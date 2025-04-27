/**
 * Type definitions for database adapters
 * Provides TypeScript interfaces for adapter implementation
 */

/**
 * Result of adapter detection process
 */
export interface DetectionResult {
  /**
   * Whether the database tool was detected in the page
   */
  detected: boolean;
  
  /**
   * Confidence score (0-100) of the detection
   * Higher values indicate higher confidence
   */
  confidence: number;
  
  /**
   * Optional details about the detection
   */
  details?: {
    /**
     * Version of the detected tool if available
     */
    version?: string;
    
    /**
     * URL pattern that was matched
     */
    urlPattern?: string;
    
    /**
     * DOM elements that were used for detection
     */
    elements?: string[];
  };
}

/**
 * Configuration options for an adapter
 */
export interface AdapterConfig {
  /**
   * URL patterns that this adapter supports (regex strings)
   */
  urlPatterns: string[];
  
  /**
   * DOM selectors used to identify this database tool
   */
  selectors: {
    /**
     * Selectors for detecting presence of the tool
     */
    detection: {
      /**
       * CSS selectors for detection
       */
      css?: string[];
      
      /**
       * XPath selectors for detection
       */
      xpath?: string[];
    };
    
    /**
     * Selectors for interacting with the tool
     */
    interaction?: Record<string, SelectorDefinition>;
  };
  
  /**
   * Settings specific to this adapter
   */
  settings?: Record<string, any>;
}

/**
 * Definition of a DOM selector
 */
export interface SelectorDefinition {
  /**
   * Type of selector (CSS or XPath)
   */
  type: 'CSS' | 'XPATH';
  
  /**
   * The selector string
   */
  selector: string;
  
  /**
   * Optional description of what this selector targets
   */
  description?: string;
}

/**
 * Schema element types that can be extracted
 */
export enum SchemaElementType {
  DATABASE = 'database',
  TABLE = 'table',
  COLUMN = 'column',
  VIEW = 'view',
  FUNCTION = 'function',
  RELATIONSHIP = 'relationship'
}

/**
 * Database schema element
 */
export interface SchemaElement {
  /**
   * Type of schema element
   */
  type: SchemaElementType;
  
  /**
   * Name of the schema element
   */
  name: string;
  
  /**
   * Display name (may differ from actual name)
   */
  displayName?: string;
  
  /**
   * Unique identifier for the element
   */
  id?: string | number;
  
  /**
   * Additional metadata specific to the element type
   */
  metadata?: Record<string, any>;
  
  /**
   * Parent element ID (e.g., table ID for a column)
   */
  parentId?: string | number;
  
  /**
   * Child elements if applicable
   */
  children?: SchemaElement[];
} 