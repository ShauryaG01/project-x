/**
 * Schema Parser Module
 * 
 * This module handles the extraction, parsing, and conversion of database schemas
 * from various sources into our standardized format.
 */

import { v4 as uuidv4 } from 'uuid';
import { extractSchema, extractRelationships, canExtractSchema } from '../adapters/metabase/schema';
import { 
  ExtractedSchema, 
  ExtractedTable, 
  ExtractedColumn, 
  ExtractedRelationship,
  SchemaExtractionOptions,
  SchemaDetectionResult
} from './types';
import { 
  SchemaCache, 
  TableInfo, 
  ColumnInfo, 
  Relationship
} from '../../types/storage';
import * as schemaStorage from '../storage/schema';

/**
 * Extract and parse schema from the current page
 */
export async function extractAndParseSchema(
  options: Partial<SchemaExtractionOptions> = {}
): Promise<SchemaCache | null> {
  try {
    // Check if we can extract schema from current page
    if (!canExtractSchema()) {
      console.warn('Cannot extract schema from current page');
      return null;
    }
    
    // Extract raw schema data
    const extractedSchema = await extractSchema(options);
    
    // Extract relationships if requested
    const extractedRelationships = options.extractRelationships 
      ? await extractRelationships() 
      : [];
    
    // Convert to standardized format
    const schemaCache = convertToSchemaCache(extractedSchema, extractedRelationships);
    
    // Save to storage
    await schemaStorage.saveSchema(schemaCache);
    
    return schemaCache;
  } catch (error) {
    console.error('Failed to extract and parse schema:', error);
    return null;
  }
}

/**
 * Convert extracted schema to storage format
 */
export function convertToSchemaCache(
  extractedSchema: ExtractedSchema,
  extractedRelationships: ExtractedRelationship[] = []
): SchemaCache {
  // Convert tables
  const tables: TableInfo[] = extractedSchema.tables.map(table => convertTable(table));
  
  // Convert relationships
  const relationships: Relationship[] = extractedRelationships.map(rel => convertRelationship(rel));
  
  // Create schema cache
  return {
    databaseId: extractedSchema.databaseId,
    lastUpdated: Date.now(),
    tables,
    relationships
  };
}

/**
 * Convert extracted table to storage format
 */
function convertTable(extractedTable: ExtractedTable): TableInfo {
  return {
    id: extractedTable.id,
    name: extractedTable.name,
    description: extractedTable.description,
    columns: extractedTable.columns.map(column => convertColumn(column))
  };
}

/**
 * Convert extracted column to storage format
 */
function convertColumn(extractedColumn: ExtractedColumn): ColumnInfo {
  return {
    id: extractedColumn.id,
    name: extractedColumn.name,
    type: extractedColumn.type,
    description: extractedColumn.description,
    isPrimaryKey: extractedColumn.isPrimaryKey,
    isForeignKey: extractedColumn.isForeignKey,
    isNullable: extractedColumn.isNullable
  };
}

/**
 * Convert extracted relationship to storage format
 */
function convertRelationship(extractedRelationship: ExtractedRelationship): Relationship {
  return {
    id: `rel-${uuidv4().slice(0, 8)}`,
    sourceTableId: extractedRelationship.sourceTableId,
    sourceColumnId: extractedRelationship.sourceColumnId,
    targetTableId: extractedRelationship.targetTableId,
    targetColumnId: extractedRelationship.targetColumnId,
    // Default to one-to-many as the most common type
    // In a real implementation, we'd try to detect this more accurately
    type: 'one-to-many'
  };
}

/**
 * Merge new schema information with existing cached schema
 */
export async function mergeWithExistingSchema(
  databaseId: string,
  newSchema: SchemaCache
): Promise<SchemaCache> {
  try {
    // Try to get existing schema
    const existingSchema = await schemaStorage.getSchema(databaseId);
    
    if (!existingSchema) {
      // No existing schema, just save the new one
      return await schemaStorage.saveSchema(newSchema);
    }
    
    // Create tables map for quick lookup
    const existingTablesMap = new Map(
      existingSchema.tables.map(table => [table.id, table])
    );
    
    // Process new tables
    for (const newTable of newSchema.tables) {
      const existingTable = existingTablesMap.get(newTable.id);
      
      if (!existingTable) {
        // New table, add it
        existingSchema.tables.push(newTable);
      } else {
        // Existing table, merge information
        mergeTableInfo(existingTable, newTable);
      }
    }
    
    // Create relationships map for quick lookup
    const existingRelationshipsMap = new Map(
      existingSchema.relationships.map(rel => [rel.id, rel])
    );
    
    // Process new relationships
    for (const newRel of newSchema.relationships) {
      const existingRel = existingRelationshipsMap.get(newRel.id);
      
      if (!existingRel) {
        // New relationship, add it
        existingSchema.relationships.push(newRel);
      }
      // Relationships are simple enough that we don't need to merge them
    }
    
    // Update lastUpdated
    existingSchema.lastUpdated = Date.now();
    
    // Save updated schema
    return await schemaStorage.saveSchema(existingSchema);
  } catch (error) {
    console.error('Failed to merge schema:', error);
    throw error;
  }
}

/**
 * Merge table information
 */
function mergeTableInfo(existingTable: TableInfo, newTable: TableInfo): void {
  // Update description if we have a new one and the old one was empty
  if (newTable.description && !existingTable.description) {
    existingTable.description = newTable.description;
  }
  
  // Create columns map for quick lookup
  const existingColumnsMap = new Map(
    existingTable.columns.map(col => [col.id, col])
  );
  
  // Process new columns
  for (const newColumn of newTable.columns) {
    const existingColumn = existingColumnsMap.get(newColumn.id);
    
    if (!existingColumn) {
      // New column, add it
      existingTable.columns.push(newColumn);
    } else {
      // Existing column, merge information
      mergeColumnInfo(existingColumn, newColumn);
    }
  }
}

/**
 * Merge column information
 */
function mergeColumnInfo(existingColumn: ColumnInfo, newColumn: ColumnInfo): void {
  // Update description if we have a new one and the old one was empty
  if (newColumn.description && !existingColumn.description) {
    existingColumn.description = newColumn.description;
  }
  
  // Update data type if it was unknown before
  if (existingColumn.type === 'unknown' && newColumn.type !== 'unknown') {
    existingColumn.type = newColumn.type;
  }
  
  // Update key information
  if (newColumn.isPrimaryKey) {
    existingColumn.isPrimaryKey = true;
  }
  
  if (newColumn.isForeignKey) {
    existingColumn.isForeignKey = true;
  }
  
  // Update nullable status if we have more accurate information
  if (!existingColumn.isNullable && newColumn.isNullable) {
    existingColumn.isNullable = true;
  }
  
  // Merge examples if they exist
  if (newColumn.examples && newColumn.examples.length > 0) {
    if (!existingColumn.examples) {
      existingColumn.examples = [...newColumn.examples];
    } else {
      // Add new examples, avoiding duplicates
      const uniqueExamples = new Set([...existingColumn.examples, ...newColumn.examples]);
      existingColumn.examples = Array.from(uniqueExamples);
    }
  }
}

/**
 * Determine if schema needs to be refreshed based on age
 */
export async function shouldRefreshSchema(
  databaseId: string,
  maxAgeMs: number = 24 * 60 * 60 * 1000 // Default to 1 day
): Promise<boolean> {
  try {
    const schema = await schemaStorage.getSchema(databaseId);
    
    if (!schema) {
      // No schema, should extract
      return true;
    }
    
    const ageMs = Date.now() - schema.lastUpdated;
    return ageMs > maxAgeMs;
  } catch (error) {
    console.error('Error checking schema refresh status:', error);
    // If we can't determine, default to refresh
    return true;
  }
}

/**
 * Check if we have sufficient schema information
 */
export async function hasSufficientSchema(databaseId: string): Promise<boolean> {
  try {
    const schema = await schemaStorage.getSchema(databaseId);
    
    if (!schema) {
      return false;
    }
    
    // Check if we have at least some tables
    return schema.tables.length > 0;
  } catch (error) {
    console.error('Error checking schema sufficiency:', error);
    return false;
  }
} 