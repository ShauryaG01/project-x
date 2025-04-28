/**
 * Progressive Schema Builder
 * 
 * This module helps progressively build and improve schema understanding
 * through continuous learning and discovery.
 */

import { v4 as uuidv4 } from 'uuid';
import * as schemaStorage from '../storage/schema';
import * as schemaParser from './parser';
import { 
  SchemaCache, 
  TableInfo, 
  ColumnInfo, 
  Relationship 
} from '../../types/storage';
import { SchemaDiff } from './types';

/**
 * Progressive schema builder class for managing schema learning
 */
export class SchemaBuilder {
  private databaseId: string;
  private currentSchema: SchemaCache | null = null;
  private isBuilding = false;
  private learningQueue: Array<() => Promise<void>> = [];

  constructor(databaseId: string) {
    this.databaseId = databaseId;
  }

  /**
   * Initialize the schema builder
   */
  public async initialize(): Promise<boolean> {
    try {
      // Load existing schema if available
      this.currentSchema = await schemaStorage.getSchema(this.databaseId);
      return true;
    } catch (error) {
      console.error('Failed to initialize schema builder:', error);
      return false;
    }
  }

  /**
   * Get the current schema
   */
  public getCurrentSchema(): SchemaCache | null {
    return this.currentSchema;
  }

  /**
   * Check if we have a schema
   */
  public hasSchema(): boolean {
    return this.currentSchema !== null;
  }

  /**
   * Start schema extraction process
   */
  public async extractSchema(
    forceRefresh = false
  ): Promise<SchemaCache | null> {
    try {
      // Check if we should refresh schema
      const shouldRefresh = forceRefresh || 
        await schemaParser.shouldRefreshSchema(this.databaseId);
      
      if (!shouldRefresh && this.currentSchema) {
        return this.currentSchema;
      }
      
      // Extract schema from current page
      const newSchema = await schemaParser.extractAndParseSchema({
        includeColumnDescriptions: true,
        extractRelationships: true
      });
      
      if (newSchema) {
        if (this.currentSchema) {
          // Merge with existing schema
          this.currentSchema = await schemaParser.mergeWithExistingSchema(
            this.databaseId, 
            newSchema
          );
        } else {
          // Set as current schema
          this.currentSchema = newSchema;
        }
      }
      
      return this.currentSchema;
    } catch (error) {
      console.error('Failed to extract schema:', error);
      return this.currentSchema;
    }
  }

  /**
   * Update schema with new information learned from queries
   */
  public async learnFromQuery(
    sql: string,
    resultColumns?: string[],
    resultData?: any[][]
  ): Promise<void> {
    if (!this.currentSchema) {
      console.warn('Cannot learn from query: No schema available');
      return;
    }

    // Queue learning task
    const learningTask = async (): Promise<void> => {
      try {
        // Extract table and column information from SQL
        const tablesAndColumns = extractTablesAndColumnsFromSQL(sql);
        
        // Create updated schema
        let updatedSchema = { ...this.currentSchema! };
        
        // Process discovered tables and columns
        for (const [tableName, columns] of Object.entries(tablesAndColumns)) {
          await this.ensureTableExists(updatedSchema, tableName, columns);
        }
        
        // Learn from result columns if available
        if (resultColumns && resultColumns.length > 0 && resultData && resultData.length > 0) {
          await this.learnFromResults(updatedSchema, resultColumns, resultData);
        }
        
        // Update lastUpdated
        updatedSchema.lastUpdated = Date.now();
        
        // Save updated schema
        this.currentSchema = await schemaStorage.saveSchema(updatedSchema);
      } catch (error) {
        console.error('Failed to learn from query:', error);
      }
    };
    
    // Add to queue and process
    this.learningQueue.push(learningTask);
    await this.processLearningQueue();
  }

  /**
   * Ensure a table exists in schema
   */
  private async ensureTableExists(
    schema: SchemaCache,
    tableName: string,
    columns: string[] = []
  ): Promise<TableInfo> {
    // Try to find existing table
    let table = schema.tables.find(t => 
      t.name.toLowerCase() === tableName.toLowerCase()
    );
    
    if (!table) {
      // Create new table
      table = {
        id: `table-${uuidv4().slice(0, 8)}`,
        name: tableName,
        columns: []
      };
      
      schema.tables.push(table);
    }
    
    // Add any missing columns
    for (const colName of columns) {
      await this.ensureColumnExists(table, colName);
    }
    
    return table;
  }

  /**
   * Ensure a column exists in a table
   */
  private async ensureColumnExists(
    table: TableInfo,
    columnName: string
  ): Promise<ColumnInfo> {
    // Try to find existing column
    let column = table.columns.find(c => 
      c.name.toLowerCase() === columnName.toLowerCase()
    );
    
    if (!column) {
      // Create new column
      column = {
        id: `col-${uuidv4().slice(0, 8)}`,
        name: columnName,
        type: 'unknown', // We don't know the type yet
        isPrimaryKey: false,
        isForeignKey: false,
        isNullable: true // Assume nullable by default
      };
      
      table.columns.push(column);
    }
    
    return column;
  }

  /**
   * Learn schema information from query results
   */
  private async learnFromResults(
    schema: SchemaCache,
    columns: string[],
    data: any[][]
  ): Promise<void> {
    if (columns.length === 0 || data.length === 0) {
      return;
    }
    
    // Parse column names to extract table info
    const tableColumnMap = new Map<string, string[]>();
    
    for (const fullColumnName of columns) {
      // Check if column name includes table name (e.g., "table.column")
      const parts = fullColumnName.split('.');
      
      if (parts.length === 2) {
        const tableName = parts[0].trim();
        const columnName = parts[1].trim();
        
        if (!tableColumnMap.has(tableName)) {
          tableColumnMap.set(tableName, []);
        }
        
        tableColumnMap.get(tableName)!.push(columnName);
      }
    }
    
    // Process each table
    for (const [tableName, columnNames] of tableColumnMap.entries()) {
      const table = await this.ensureTableExists(schema, tableName, columnNames);
      
      // Learn from data
      this.inferTypesFromData(table, columnNames, data);
    }
  }

  /**
   * Infer column types from result data
   */
  private inferTypesFromData(
    table: TableInfo,
    columnNames: string[],
    data: any[][]
  ): void {
    // Process each column
    for (let colIndex = 0; colIndex < columnNames.length; colIndex++) {
      const columnName = columnNames[colIndex];
      
      // Find column in table
      const column = table.columns.find(c => 
        c.name.toLowerCase() === columnName.toLowerCase()
      );
      
      if (!column) continue;
      
      // Skip if we already know the type
      if (column.type !== 'unknown') continue;
      
      // Get sample values for this column
      const sampleValues: any[] = [];
      for (let i = 0; i < Math.min(10, data.length); i++) {
        if (data[i] && data[i][colIndex] !== undefined) {
          sampleValues.push(data[i][colIndex]);
        }
      }
      
      // Infer type from sample values
      column.type = inferColumnType(sampleValues);
      
      // Store examples
      if (!column.examples) {
        column.examples = [];
      }
      
      // Add up to 5 non-null examples
      const nonNullExamples = sampleValues
        .filter(v => v !== null && v !== undefined)
        .map(v => String(v))
        .slice(0, 5);
      
      if (nonNullExamples.length > 0) {
        // Add new examples, avoiding duplicates
        const uniqueExamples = new Set([...column.examples, ...nonNullExamples]);
        column.examples = Array.from(uniqueExamples).slice(0, 10); // Keep max 10 examples
      }
      
      // Check if column is nullable
      const hasNulls = sampleValues.some(v => v === null || v === undefined);
      column.isNullable = hasNulls;
    }
  }

  /**
   * Get schema differences between current and new schema
   */
  public async diffSchema(newSchema: SchemaCache): Promise<SchemaDiff> {
    const diff: SchemaDiff = {
      newTables: [],
      modifiedTables: [],
      removedTables: [],
      newColumns: {},
      modifiedColumns: {},
      removedColumns: {},
      newRelationships: [],
      modifiedRelationships: [],
      removedRelationships: []
    };
    
    if (!this.currentSchema) {
      // Everything is new
      diff.newTables = newSchema.tables.map(t => t.name);
      diff.newRelationships = newSchema.relationships.map(r => r.id);
      return diff;
    }
    
    // Compare tables
    const currentTableIds = new Set(this.currentSchema.tables.map(t => t.id));
    const newTableIds = new Set(newSchema.tables.map(t => t.id));
    
    // Find new tables
    for (const table of newSchema.tables) {
      if (!currentTableIds.has(table.id)) {
        diff.newTables.push(table.name);
      }
    }
    
    // Find removed tables
    for (const table of this.currentSchema.tables) {
      if (!newTableIds.has(table.id)) {
        diff.removedTables.push(table.name);
      }
    }
    
    // Find modified tables and columns
    for (const newTable of newSchema.tables) {
      const currentTable = this.currentSchema.tables.find(t => t.id === newTable.id);
      
      if (currentTable) {
        // Check for modifications
        const isModified = JSON.stringify(newTable) !== JSON.stringify(currentTable);
        
        if (isModified) {
          diff.modifiedTables.push(newTable.name);
          
          // Check columns
          const currentColumnIds = new Set(currentTable.columns.map(c => c.id));
          const newColumnIds = new Set(newTable.columns.map(c => c.id));
          
          // New columns
          const newColumns = newTable.columns
            .filter(c => !currentColumnIds.has(c.id))
            .map(c => c.name);
          
          if (newColumns.length > 0) {
            diff.newColumns[newTable.id] = newColumns;
          }
          
          // Removed columns
          const removedColumns = currentTable.columns
            .filter(c => !newColumnIds.has(c.id))
            .map(c => c.name);
          
          if (removedColumns.length > 0) {
            diff.removedColumns[newTable.id] = removedColumns;
          }
          
          // Modified columns
          const modifiedColumns: string[] = [];
          
          for (const newColumn of newTable.columns) {
            const currentColumn = currentTable.columns.find(c => c.id === newColumn.id);
            
            if (currentColumn && JSON.stringify(newColumn) !== JSON.stringify(currentColumn)) {
              modifiedColumns.push(newColumn.name);
            }
          }
          
          if (modifiedColumns.length > 0) {
            diff.modifiedColumns[newTable.id] = modifiedColumns;
          }
        }
      }
    }
    
    // Compare relationships
    const currentRelIds = new Set(this.currentSchema.relationships.map(r => r.id));
    const newRelIds = new Set(newSchema.relationships.map(r => r.id));
    
    // Find new relationships
    for (const rel of newSchema.relationships) {
      if (!currentRelIds.has(rel.id)) {
        diff.newRelationships.push(rel.id);
      }
    }
    
    // Find removed relationships
    for (const rel of this.currentSchema.relationships) {
      if (!newRelIds.has(rel.id)) {
        diff.removedRelationships.push(rel.id);
      }
    }
    
    // Find modified relationships
    for (const newRel of newSchema.relationships) {
      const currentRel = this.currentSchema.relationships.find(r => r.id === newRel.id);
      
      if (currentRel && JSON.stringify(newRel) !== JSON.stringify(currentRel)) {
        diff.modifiedRelationships.push(newRel.id);
      }
    }
    
    return diff;
  }

  /**
   * Process learning queue
   */
  private async processLearningQueue(): Promise<void> {
    if (this.isBuilding || this.learningQueue.length === 0) {
      return;
    }
    
    this.isBuilding = true;
    
    try {
      while (this.learningQueue.length > 0) {
        const task = this.learningQueue.shift();
        if (task) {
          await task();
        }
      }
    } finally {
      this.isBuilding = false;
    }
  }
}

/**
 * Extract table and column names from SQL query
 */
function extractTablesAndColumnsFromSQL(sql: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  // Simple regex-based extraction (not perfect but better than nothing)
  try {
    // Normalize SQL
    const normalizedSQL = sql
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/--.*$/gm, '')          // Remove single-line comments
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .toLowerCase();
    
    // Extract table names from common SQL patterns
    const fromMatches = normalizedSQL.match(/from\s+([a-zA-Z0-9_"]+)/g) || [];
    const joinMatches = normalizedSQL.match(/join\s+([a-zA-Z0-9_"]+)/g) || [];
    
    // Process all matches
    [...fromMatches, ...joinMatches].forEach(match => {
      const tableName = match.split(/\s+/)[1].replace(/"/g, '').trim();
      if (tableName && !result[tableName]) {
        result[tableName] = [];
      }
    });
    
    // Extract columns from select statements
    const selectMatch = normalizedSQL.match(/select\s+(.*?)\s+from/);
    if (selectMatch && selectMatch[1]) {
      const columns = selectMatch[1].split(',');
      
      columns.forEach(col => {
        // Process each column
        col = col.trim();
        
        // Check for table.column format
        const tableColMatch = col.match(/([a-zA-Z0-9_"]+)\.([a-zA-Z0-9_"]+)/);
        if (tableColMatch) {
          const tableName = tableColMatch[1].replace(/"/g, '');
          const columnName = tableColMatch[2].replace(/"/g, '');
          
          if (!result[tableName]) {
            result[tableName] = [];
          }
          
          if (!result[tableName].includes(columnName)) {
            result[tableName].push(columnName);
          }
        }
      });
    }
    
    // Extract columns from where clause
    const whereMatch = normalizedSQL.match(/where\s+(.*?)(?:order by|group by|limit|$)/i);
    if (whereMatch && whereMatch[1]) {
      const conditions = whereMatch[1].split(/and|or/i);
      
      conditions.forEach(condition => {
        const tableColMatch = condition.match(/([a-zA-Z0-9_"]+)\.([a-zA-Z0-9_"]+)/g);
        
        if (tableColMatch) {
          tableColMatch.forEach(match => {
            const parts = match.split('.');
            const tableName = parts[0].replace(/"/g, '');
            const columnName = parts[1].replace(/"/g, '');
            
            if (!result[tableName]) {
              result[tableName] = [];
            }
            
            if (!result[tableName].includes(columnName)) {
              result[tableName].push(columnName);
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('Failed to extract tables and columns from SQL:', error);
  }
  
  return result;
}

/**
 * Infer column type from sample values
 */
function inferColumnType(values: any[]): string {
  // Skip empty arrays
  if (values.length === 0) {
    return 'unknown';
  }
  
  // Filter out nulls and undefined
  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  
  if (nonNullValues.length === 0) {
    return 'unknown';
  }
  
  // Check types
  const allNumbers = nonNullValues.every(v => typeof v === 'number' || !isNaN(parseFloat(v)));
  const allIntegers = allNumbers && nonNullValues.every(v => Number.isInteger(parseFloat(v)));
  const allBooleans = nonNullValues.every(v => typeof v === 'boolean' || v === 'true' || v === 'false');
  const allDates = nonNullValues.every(v => !isNaN(Date.parse(String(v))));
  
  if (allIntegers) {
    return 'integer';
  } else if (allNumbers) {
    return 'number';
  } else if (allBooleans) {
    return 'boolean';
  } else if (allDates) {
    return 'date';
  }
  
  return 'string';
} 