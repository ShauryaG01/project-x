/**
 * Schema Cache Storage Operations
 * 
 * This module provides functions for managing database schema cache in IndexedDB.
 */

import { getDB } from './db';
import { SchemaCache, TableInfo, ColumnInfo, Relationship } from '../../types/storage';
import { StorageError, StorageErrorType } from '../../types/storage';

/**
 * Save schema cache for a database
 */
export async function saveSchema(schema: SchemaCache): Promise<SchemaCache> {
  try {
    const db = await getDB();
    
    // Ensure lastUpdated is set
    if (!schema.lastUpdated) {
      schema.lastUpdated = Date.now();
    }
    
    // Save to IndexedDB
    await db.put('schema', schema);
    
    return schema;
  } catch (error) {
    console.error('Failed to save schema:', error);
    throw new StorageError('Failed to save schema cache', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Get schema for a database
 */
export async function getSchema(databaseId: string): Promise<SchemaCache | null> {
  try {
    const db = await getDB();
    const schema = await db.get('schema', databaseId);
    return schema || null;
  } catch (error) {
    console.error('Failed to get schema:', error);
    throw new StorageError('Failed to retrieve schema', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Update schema for a database
 */
export async function updateSchema(databaseId: string, updates: Partial<SchemaCache>): Promise<SchemaCache> {
  try {
    const db = await getDB();
    
    // Get the existing schema
    const existingSchema = await db.get('schema', databaseId);
    
    if (!existingSchema) {
      throw new StorageError(`Schema for database ${databaseId} not found`, StorageErrorType.NOT_FOUND);
    }
    
    // Create updated schema
    const updatedSchema: SchemaCache = {
      ...existingSchema,
      ...updates,
      databaseId, // Ensure database ID doesn't change
      lastUpdated: Date.now(), // Update timestamp
    };
    
    // Save to IndexedDB
    await db.put('schema', updatedSchema);
    
    return updatedSchema;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    console.error('Failed to update schema:', error);
    throw new StorageError('Failed to update schema', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Delete schema for a database
 */
export async function deleteSchema(databaseId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('schema', databaseId);
  } catch (error) {
    console.error('Failed to delete schema:', error);
    throw new StorageError('Failed to delete schema', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Get all schemas
 */
export async function getAllSchemas(): Promise<SchemaCache[]> {
  try {
    const db = await getDB();
    return await db.getAll('schema');
  } catch (error) {
    console.error('Failed to get all schemas:', error);
    throw new StorageError('Failed to retrieve schemas', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Add or update a table in schema
 */
export async function updateTable(databaseId: string, table: TableInfo): Promise<SchemaCache> {
  try {
    const schema = await getSchema(databaseId);
    
    if (!schema) {
      // Create new schema with this table
      return saveSchema({
        databaseId,
        lastUpdated: Date.now(),
        tables: [table],
        relationships: [],
      });
    }
    
    // Find if table already exists
    const existingTableIndex = schema.tables.findIndex(t => t.id === table.id);
    
    if (existingTableIndex >= 0) {
      // Update existing table
      schema.tables[existingTableIndex] = table;
    } else {
      // Add new table
      schema.tables.push(table);
    }
    
    // Update lastUpdated
    schema.lastUpdated = Date.now();
    
    // Save updated schema
    return saveSchema(schema);
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    console.error('Failed to update table:', error);
    throw new StorageError('Failed to update table in schema', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Add or update a relationship in schema
 */
export async function updateRelationship(databaseId: string, relationship: Relationship): Promise<SchemaCache> {
  try {
    const schema = await getSchema(databaseId);
    
    if (!schema) {
      // Create new schema with this relationship
      return saveSchema({
        databaseId,
        lastUpdated: Date.now(),
        tables: [],
        relationships: [relationship],
      });
    }
    
    // Find if relationship already exists
    const existingRelationshipIndex = schema.relationships.findIndex(r => r.id === relationship.id);
    
    if (existingRelationshipIndex >= 0) {
      // Update existing relationship
      schema.relationships[existingRelationshipIndex] = relationship;
    } else {
      // Add new relationship
      schema.relationships.push(relationship);
    }
    
    // Update lastUpdated
    schema.lastUpdated = Date.now();
    
    // Save updated schema
    return saveSchema(schema);
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    console.error('Failed to update relationship:', error);
    throw new StorageError('Failed to update relationship in schema', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Remove a table from schema
 */
export async function removeTable(databaseId: string, tableId: string): Promise<SchemaCache | null> {
  try {
    const schema = await getSchema(databaseId);
    
    if (!schema) {
      return null;
    }
    
    // Remove table
    schema.tables = schema.tables.filter(table => table.id !== tableId);
    
    // Remove relationships involving this table
    schema.relationships = schema.relationships.filter(
      rel => rel.sourceTableId !== tableId && rel.targetTableId !== tableId
    );
    
    // Update lastUpdated
    schema.lastUpdated = Date.now();
    
    // Save updated schema
    return saveSchema(schema);
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    console.error('Failed to remove table:', error);
    throw new StorageError('Failed to remove table from schema', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Get a specific table from schema
 */
export async function getTable(databaseId: string, tableId: string): Promise<TableInfo | null> {
  try {
    const schema = await getSchema(databaseId);
    
    if (!schema) {
      return null;
    }
    
    const table = schema.tables.find(table => table.id === tableId);
    return table || null;
  } catch (error) {
    console.error('Failed to get table:', error);
    throw new StorageError('Failed to retrieve table', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Clear all schemas
 */
export async function clearSchemas(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('schema');
  } catch (error) {
    console.error('Failed to clear schemas:', error);
    throw new StorageError('Failed to clear schemas', StorageErrorType.TRANSACTION_FAILED);
  }
}

// Export default object for easier importing
export default {
  save: saveSchema,
  get: getSchema,
  update: updateSchema,
  delete: deleteSchema,
  getAll: getAllSchemas,
  updateTable,
  updateRelationship,
  removeTable,
  getTable,
  clear: clearSchemas,
}; 