/**
 * Schema management types
 * 
 * This module contains types for database schema parsing and management.
 */

import { SchemaCache, TableInfo, ColumnInfo, Relationship } from '../../types/storage';

/**
 * Metabase schema information extracted from the UI
 */
export interface ExtractedSchema {
  databaseId: string;
  databaseName: string;
  tables: ExtractedTable[];
}

/**
 * Table information extracted from Metabase UI
 */
export interface ExtractedTable {
  id: string;
  name: string;
  description?: string;
  columns: ExtractedColumn[];
}

/**
 * Column information extracted from Metabase UI
 */
export interface ExtractedColumn {
  id: string;
  name: string;
  type: string;
  description?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
}

/**
 * Extracted foreign key relationship from Metabase
 */
export interface ExtractedRelationship {
  sourceTableId: string;
  sourceTableName: string;
  sourceColumnId: string;
  sourceColumnName: string;
  targetTableId: string;
  targetTableName: string;
  targetColumnId: string;
  targetColumnName: string;
}

/**
 * Schema extraction options
 */
export interface SchemaExtractionOptions {
  includeColumnDescriptions?: boolean;
  extractRelationships?: boolean;
  maxDepth?: number; // For relationship traversal
  tablesToInclude?: string[]; // Limit extraction to specific tables
  includeSampleData?: boolean;
}

/**
 * Schema detection result
 */
export interface SchemaDetectionResult {
  foundTables: number;
  foundColumns: number;
  foundRelationships: number;
  extractionComplete: boolean;
  errors?: string[];
}

/**
 * Schema diff representing changes between cached and extracted schema
 */
export interface SchemaDiff {
  newTables: string[];
  modifiedTables: string[];
  removedTables: string[];
  newColumns: { [tableId: string]: string[] };
  modifiedColumns: { [tableId: string]: string[] };
  removedColumns: { [tableId: string]: string[] };
  newRelationships: string[];
  modifiedRelationships: string[];
  removedRelationships: string[];
}

/**
 * Schema optimization options for LLM context compression
 */
export interface SchemaCompressionOptions {
  maxTables?: number;
  maxColumnsPerTable?: number;
  includeDescriptions?: boolean;
  prioritizeReferencedTables?: boolean;
  includeRelationships?: boolean;
  maxTokens?: number;
}

/**
 * Compressed schema for LLM context
 */
export interface CompressedSchema {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      isPrimaryKey: boolean;
      isForeignKey: boolean;
    }>;
  }>;
  relationships: Array<{
    source: string;
    sourceColumn: string;
    target: string;
    targetColumn: string;
  }>;
} 