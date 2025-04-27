/**
 * Storage-related types for the application
 */

/**
 * Stored query with history information
 */
export interface StoredQuery {
  id: string; // UUID
  question: string; // Original natural language question
  sql: string; // Generated SQL
  timestamp: number; // Unix timestamp
  databaseId: string; // Metabase database ID
  executionTime?: number; // Query execution time in ms
  isStarred?: boolean; // Whether the query is marked as favorite
  resultCount?: number; // Number of results returned
  tags?: string[]; // User-defined tags
  metabaseUrl?: string; // URL to the Metabase query
  error?: string; // Error message if query failed
}

/**
 * Schema cache for a database
 */
export interface SchemaCache {
  databaseId: string; // Metabase database ID
  lastUpdated: number; // Unix timestamp
  tables: TableInfo[];
  relationships: Relationship[];
}

/**
 * Table information
 */
export interface TableInfo {
  id: string; // Table ID
  name: string; // Table name
  description?: string; // Table description
  columns: ColumnInfo[];
  rowCount?: number; // Approximate row count if available
}

/**
 * Column information
 */
export interface ColumnInfo {
  id: string; // Column ID
  name: string; // Column name
  type: string; // Data type
  description?: string; // Column description
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  isIndexed?: boolean;
  isUnique?: boolean;
  examples?: string[]; // Sample values
}

/**
 * Relationship between tables
 */
export interface Relationship {
  id: string; // Relationship ID
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

/**
 * User settings
 */
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  maxHistoryItems: number;
  enableHistory: boolean;
  primaryProvider: 'openai' | 'anthropic' | 'local';
  openaiApiKey?: string;
  anthropicApiKey?: string;
  shareUsageStats: boolean;
  storeQueriesLocally: boolean;
  promptTemplate?: string;
  defaultDatabase?: string;
}

/**
 * Metadata for bulk operations
 */
export interface StorageMetadata {
  lastSyncTime?: number;
  version?: string;
  device?: string;
}

/**
 * Storage error types
 */
export enum StorageErrorType {
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom storage error
 */
export class StorageError extends Error {
  type: StorageErrorType;
  
  constructor(message: string, type: StorageErrorType = StorageErrorType.UNKNOWN) {
    super(message);
    this.name = 'StorageError';
    this.type = type;
  }
} 