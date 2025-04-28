/**
 * Schema Compressor
 * 
 * This module provides utilities to compress database schema information
 * to fit within LLM context limits while preserving the most relevant information.
 */

import { 
  SchemaCache, 
  TableInfo, 
  ColumnInfo, 
  Relationship 
} from '../../types/storage';
import { SchemaCompressionOptions, CompressedSchema } from './types';

/**
 * Default compression options
 */
const DEFAULT_COMPRESSION_OPTIONS: SchemaCompressionOptions = {
  maxTables: 20,
  maxColumnsPerTable: 20,
  includeDescriptions: true,
  prioritizeReferencedTables: true,
  includeRelationships: true,
  maxTokens: 4000 // Conservative estimate for context size
};

/**
 * Compress schema for LLM context
 */
export function compressSchema(
  schema: SchemaCache,
  referencedTables: string[] = [],
  options: Partial<SchemaCompressionOptions> = {}
): CompressedSchema {
  // Merge with default options
  const compressionOptions = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
  
  // Start with empty compressed schema
  const compressed: CompressedSchema = {
    tables: [],
    relationships: []
  };
  
  // If no schema, return empty
  if (!schema || !schema.tables || schema.tables.length === 0) {
    return compressed;
  }
  
  // Create working copy of tables
  let tables = [...schema.tables];
  
  // Prioritize tables if needed
  if (compressionOptions.prioritizeReferencedTables && referencedTables.length > 0) {
    // Sort tables to prioritize referenced ones
    tables.sort((a, b) => {
      const aIsReferenced = referencedTables.includes(a.name.toLowerCase());
      const bIsReferenced = referencedTables.includes(b.name.toLowerCase());
      
      if (aIsReferenced && !bIsReferenced) return -1;
      if (!aIsReferenced && bIsReferenced) return 1;
      return 0;
    });
  }
  
  // Limit number of tables
  if (compressionOptions.maxTables && compressionOptions.maxTables < tables.length) {
    tables = tables.slice(0, compressionOptions.maxTables);
  }
  
  // Process tables
  for (const table of tables) {
    // Start with essential table information
    const compressedTable = {
      name: table.name,
      columns: compressColumns(table.columns, compressionOptions)
    };
    
    compressed.tables.push(compressedTable);
  }
  
  // Process relationships if requested
  if (compressionOptions.includeRelationships && schema.relationships) {
    // Get all table names for filtering
    const includedTableNames = compressed.tables.map(t => t.name.toLowerCase());
    
    // Filter relationships to only include tables we're keeping
    const relevantRelationships = schema.relationships.filter(rel => {
      // Find source and target tables
      const sourceTable = schema.tables.find(t => t.id === rel.sourceTableId);
      const targetTable = schema.tables.find(t => t.id === rel.targetTableId);
      
      // Only include if both tables are in our compressed schema
      return sourceTable && 
        targetTable && 
        includedTableNames.includes(sourceTable.name.toLowerCase()) && 
        includedTableNames.includes(targetTable.name.toLowerCase());
    });
    
    // Process relationships
    for (const rel of relevantRelationships) {
      const sourceTable = schema.tables.find(t => t.id === rel.sourceTableId);
      const targetTable = schema.tables.find(t => t.id === rel.targetTableId);
      
      if (!sourceTable || !targetTable) continue;
      
      // Find source and target columns
      const sourceColumn = sourceTable.columns.find(c => c.id === rel.sourceColumnId);
      const targetColumn = targetTable.columns.find(c => c.id === rel.targetColumnId);
      
      if (!sourceColumn || !targetColumn) continue;
      
      compressed.relationships.push({
        source: sourceTable.name,
        sourceColumn: sourceColumn.name,
        target: targetTable.name,
        targetColumn: targetColumn.name
      });
    }
  }
  
  // If we're concerned about total token size, do a final trim
  if (compressionOptions.maxTokens) {
    return trimToTokenLimit(compressed, compressionOptions.maxTokens);
  }
  
  return compressed;
}

/**
 * Compress columns for a table
 */
function compressColumns(
  columns: ColumnInfo[],
  options: SchemaCompressionOptions
): Array<{name: string, type: string, isPrimaryKey: boolean, isForeignKey: boolean}> {
  // Start with all columns
  let processedColumns = [...columns];
  
  // Sort columns to prioritize primary and foreign keys
  processedColumns.sort((a, b) => {
    if (a.isPrimaryKey && !b.isPrimaryKey) return -1;
    if (!a.isPrimaryKey && b.isPrimaryKey) return 1;
    if (a.isForeignKey && !b.isForeignKey) return -1;
    if (!a.isForeignKey && b.isForeignKey) return 1;
    return 0;
  });
  
  // Limit number of columns if needed
  if (options.maxColumnsPerTable && options.maxColumnsPerTable < processedColumns.length) {
    processedColumns = processedColumns.slice(0, options.maxColumnsPerTable);
  }
  
  // Compress each column
  return processedColumns.map(column => ({
    name: column.name,
    type: column.type,
    isPrimaryKey: column.isPrimaryKey,
    isForeignKey: column.isForeignKey
  }));
}

/**
 * Convert compressed schema to a string representation for token estimation
 */
function schemaToString(schema: CompressedSchema): string {
  const parts: string[] = [];
  
  // Add tables
  for (const table of schema.tables) {
    parts.push(`Table: ${table.name}`);
    
    // Add columns
    for (const column of table.columns) {
      const keyInfo = column.isPrimaryKey ? 'PK' : (column.isForeignKey ? 'FK' : '');
      parts.push(`  ${column.name} (${column.type})${keyInfo ? ' ' + keyInfo : ''}`);
    }
  }
  
  // Add relationships
  if (schema.relationships.length > 0) {
    parts.push('\nRelationships:');
    for (const rel of schema.relationships) {
      parts.push(`  ${rel.source}.${rel.sourceColumn} -> ${rel.target}.${rel.targetColumn}`);
    }
  }
  
  return parts.join('\n');
}

/**
 * Roughly estimate token count for a string
 * This is a very rough approximation - in practice, you'd want a proper tokenizer
 */
function estimateTokens(text: string): number {
  // A very rough approximation - about 4 chars per token
  return Math.ceil(text.length / 4);
}

/**
 * Trim schema to fit within token limit
 */
function trimToTokenLimit(schema: CompressedSchema, maxTokens: number): CompressedSchema {
  // Convert to string to estimate tokens
  const fullSchemaString = schemaToString(schema);
  const estimatedTokens = estimateTokens(fullSchemaString);
  
  // If we're already under the limit, return as is
  if (estimatedTokens <= maxTokens) {
    return schema;
  }
  
  // Need to trim - create a copy to work with
  const trimmed: CompressedSchema = {
    tables: [...schema.tables],
    relationships: [...schema.relationships]
  };
  
  // First reduce relationships if we have a lot
  if (trimmed.relationships.length > 10) {
    const reductionFactor = maxTokens / estimatedTokens;
    const newRelCount = Math.max(5, Math.floor(trimmed.relationships.length * reductionFactor));
    trimmed.relationships = trimmed.relationships.slice(0, newRelCount);
  }
  
  // If still too large, reduce tables
  while (estimateTokens(schemaToString(trimmed)) > maxTokens && trimmed.tables.length > 1) {
    // Remove the last table (least important due to our sorting)
    trimmed.tables.pop();
    
    // Remove any relationships that reference removed tables
    const tableNames = new Set(trimmed.tables.map(t => t.name.toLowerCase()));
    trimmed.relationships = trimmed.relationships.filter(rel => 
      tableNames.has(rel.source.toLowerCase()) && tableNames.has(rel.target.toLowerCase())
    );
  }
  
  // If still too large, reduce columns per table
  if (estimateTokens(schemaToString(trimmed)) > maxTokens) {
    // Reduce columns per table by an appropriate factor
    const reductionFactor = 0.7; // Remove 30% of columns
    
    for (let i = 0; i < trimmed.tables.length; i++) {
      const table = trimmed.tables[i];
      const newColumnCount = Math.max(
        // Keep at least primary/foreign keys
        table.columns.filter(c => c.isPrimaryKey || c.isForeignKey).length,
        // Otherwise reduce by factor
        Math.floor(table.columns.length * reductionFactor)
      );
      
      if (newColumnCount < table.columns.length) {
        trimmed.tables[i] = {
          ...table,
          columns: table.columns.slice(0, newColumnCount)
        };
      }
    }
  }
  
  // As a last resort, remove more tables if still too large
  while (estimateTokens(schemaToString(trimmed)) > maxTokens && trimmed.tables.length > 1) {
    trimmed.tables.pop();
    
    // Update relationships
    const tableNames = new Set(trimmed.tables.map(t => t.name.toLowerCase()));
    trimmed.relationships = trimmed.relationships.filter(rel => 
      tableNames.has(rel.source.toLowerCase()) && tableNames.has(rel.target.toLowerCase())
    );
  }
  
  return trimmed;
}

/**
 * Convert schema to SQL CREATE TABLE statements for LLM context
 */
export function schemaToSQLStatements(schema: CompressedSchema): string {
  const statements: string[] = [];
  
  // Generate CREATE TABLE statements
  for (const table of schema.tables) {
    const columnDefs: string[] = [];
    
    for (const column of table.columns) {
      let columnDef = `  ${column.name} ${mapTypeToSQL(column.type)}`;
      
      // Add key constraints
      if (column.isPrimaryKey) {
        columnDef += ' PRIMARY KEY';
      }
      
      columnDefs.push(columnDef);
    }
    
    // Create the complete statement
    const createStatement = `CREATE TABLE ${table.name} (\n${columnDefs.join(',\n')}\n);`;
    statements.push(createStatement);
  }
  
  // Generate ALTER TABLE statements for foreign keys
  for (const rel of schema.relationships) {
    const alterStatement = `ALTER TABLE ${rel.source} ADD CONSTRAINT fk_${rel.source}_${rel.target}
  FOREIGN KEY (${rel.sourceColumn}) REFERENCES ${rel.target}(${rel.targetColumn});`;
    
    statements.push(alterStatement);
  }
  
  return statements.join('\n\n');
}

/**
 * Map type string to SQL type
 */
function mapTypeToSQL(type: string): string {
  switch (type.toLowerCase()) {
    case 'integer':
      return 'INTEGER';
    case 'number':
      return 'NUMERIC';
    case 'string':
      return 'VARCHAR(255)';
    case 'text':
      return 'TEXT';
    case 'boolean':
      return 'BOOLEAN';
    case 'date':
      return 'DATE';
    case 'timestamp':
      return 'TIMESTAMP';
    case 'json':
      return 'JSON';
    default:
      return 'VARCHAR(255)';
  }
}

/**
 * Generate a compact schema description for LLM prompt
 */
export function generateSchemaDescription(schema: CompressedSchema): string {
  const lines: string[] = [
    'DATABASE SCHEMA:',
    '----------------'
  ];
  
  // Add tables
  for (const table of schema.tables) {
    lines.push(`Table: ${table.name}`);
    
    // Add columns
    for (const column of table.columns) {
      const keyInfo = [
        column.isPrimaryKey ? 'PK' : '',
        column.isForeignKey ? 'FK' : ''
      ].filter(Boolean).join(',');
      
      lines.push(`  - ${column.name} (${column.type})${keyInfo ? ' [' + keyInfo + ']' : ''}`);
    }
    
    lines.push(''); // Empty line between tables
  }
  
  // Add relationships
  if (schema.relationships.length > 0) {
    lines.push('Relationships:');
    for (const rel of schema.relationships) {
      lines.push(`  - ${rel.source}.${rel.sourceColumn} -> ${rel.target}.${rel.targetColumn}`);
    }
  }
  
  return lines.join('\n');
} 