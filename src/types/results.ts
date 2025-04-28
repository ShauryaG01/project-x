/**
 * Type definitions for query results
 * Provides TypeScript interfaces for result data
 */

/**
 * Column info in query results
 */
export interface ResultColumn {
  /**
   * Name of the column
   */
  name: string;
  
  /**
   * Display name for the column (may differ from actual name)
   */
  displayName: string;
  
  /**
   * Data type of the column
   */
  type: string;
  
  /**
   * Base type (simplified category)
   */
  baseType?: string;
  
  /**
   * Semantic type (if available)
   */
  semanticType?: string;
  
  /**
   * Field ID (if available)
   */
  fieldId?: number;
  
  /**
   * Table ID (if available)
   */
  tableId?: number;
  
  /**
   * Whether the column is a dimension
   */
  dimension?: boolean;
}

/**
 * Query result row
 */
export type ResultRow = Array<any>;

/**
 * Complete query results
 */
export interface QueryResults {
  /**
   * Columns in the result
   */
  columns: ResultColumn[];
  
  /**
   * Rows of data
   */
  rows: ResultRow[];
  
  /**
   * Total number of rows
   */
  rowCount: number;
  
  /**
   * Time taken to execute query (ms)
   */
  executionTime?: number;
  
  /**
   * Raw data in JSON format (if available)
   */
  rawData?: any;
  
  /**
   * Whether the results were truncated
   */
  truncated?: boolean;
  
  /**
   * Error message (if query failed)
   */
  error?: string;
  
  /**
   * SQL query that was executed
   */
  query?: string;
  
  /**
   * Visualization type used
   */
  visualizationType?: string;
  
  /**
   * Card ID (if saved query)
   */
  cardId?: number;
}

/**
 * Summary of query results
 */
export interface ResultsSummary {
  /**
   * Number of rows returned
   */
  rowCount: number;
  
  /**
   * Number of columns
   */
  columnCount: number;
  
  /**
   * Column names
   */
  columnNames: string[];
  
  /**
   * Time taken to execute
   */
  executionTime?: number;
  
  /**
   * Whether the results were truncated
   */
  truncated?: boolean;
}

/**
 * Visualization settings for results
 */
export interface VisualizationSettings {
  /**
   * Type of visualization
   */
  type: string;
  
  /**
   * Column settings
   */
  columnSettings?: Record<string, any>;
  
  /**
   * Color settings
   */
  colors?: any[];
  
  /**
   * Dimension columns
   */
  dimensions?: string[];
  
  /**
   * Metric columns
   */
  metrics?: string[];
  
  /**
   * Additional settings
   */
  [key: string]: any;
} 