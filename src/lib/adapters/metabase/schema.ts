/**
 * Metabase Schema Extraction
 * 
 * This module contains functionality to extract database schema information
 * from Metabase's UI.
 */

import { v4 as uuidv4 } from 'uuid';
import * as selectors from './selectors';
import { 
  ExtractedSchema, 
  ExtractedTable, 
  ExtractedColumn,
  ExtractedRelationship,
  SchemaExtractionOptions,
  SchemaDetectionResult
} from '../../schema/types';
import { MetabaseAdapterError } from '../../errors/types';

/**
 * Default schema extraction options
 */
const DEFAULT_EXTRACTION_OPTIONS: SchemaExtractionOptions = {
  includeColumnDescriptions: true,
  extractRelationships: true,
  maxDepth: 1,
  includeSampleData: false
};

/**
 * Extract database schema information from Metabase
 */
export async function extractSchema(
  options: Partial<SchemaExtractionOptions> = {}
): Promise<ExtractedSchema> {
  try {
    // Merge with default options
    const extractionOptions = { ...DEFAULT_EXTRACTION_OPTIONS, ...options };
    
    // Get current database information
    const databaseInfo = await getCurrentDatabaseInfo();
    
    // Extract tables
    const tables = await extractTables(extractionOptions);
    
    // Create the schema object
    const schema: ExtractedSchema = {
      databaseId: databaseInfo.id,
      databaseName: databaseInfo.name,
      tables
    };
    
    return schema;
  } catch (error) {
    console.error('Failed to extract schema from Metabase:', error);
    throw new MetabaseAdapterError(
      'Failed to extract database schema',
      'SCHEMA_EXTRACTION_FAILED',
      { cause: error }
    );
  }
}

/**
 * Get information about the current database
 */
async function getCurrentDatabaseInfo(): Promise<{ id: string, name: string }> {
  // Find the database selector in the UI
  const databaseSelector = document.querySelector(selectors.DATABASE_SELECTOR);
  
  if (!databaseSelector) {
    throw new MetabaseAdapterError(
      'Could not find database selector in Metabase UI',
      'ELEMENT_NOT_FOUND'
    );
  }
  
  // Extract database name and ID
  const databaseName = databaseSelector.textContent?.trim() || 'Unknown Database';
  
  // Try to get ID from data attribute or URL
  const databaseId = databaseSelector.getAttribute('data-database-id') || 
    extractDatabaseIdFromUrl() || 
    `db-${uuidv4().slice(0, 8)}`;
  
  return { id: databaseId, name: databaseName };
}

/**
 * Extract database ID from the current URL
 */
function extractDatabaseIdFromUrl(): string | null {
  const urlMatch = window.location.href.match(/\/database\/(\d+)/);
  return urlMatch ? urlMatch[1] : null;
}

/**
 * Extract tables from Metabase UI
 */
async function extractTables(options: SchemaExtractionOptions): Promise<ExtractedTable[]> {
  const tables: ExtractedTable[] = [];
  
  // In Metabase's data model browser, tables are listed in a sidebar
  const tableElements = document.querySelectorAll(selectors.TABLE_LIST_ITEM);
  
  if (tableElements.length === 0) {
    // Try to open data model browser if not already open
    await navigateToDataModelBrowser();
    // Try again to get tables
    const tableElementsRetry = document.querySelectorAll(selectors.TABLE_LIST_ITEM);
    if (tableElementsRetry.length === 0) {
      throw new MetabaseAdapterError(
        'Could not find any tables in Metabase UI',
        'ELEMENT_NOT_FOUND'
      );
    }
  }
  
  // Process each table
  for (const tableElement of Array.from(tableElements)) {
    // Filter tables if specific ones are requested
    const tableName = tableElement.textContent?.trim() || '';
    if (
      options.tablesToInclude && 
      options.tablesToInclude.length > 0 && 
      !options.tablesToInclude.includes(tableName)
    ) {
      continue;
    }
    
    // Click on the table to view its details
    (tableElement as HTMLElement).click();
    
    // Wait for table details to load
    await waitForElement(selectors.TABLE_DETAIL_VIEW);
    
    // Extract table information
    const table = await extractTableDetails(options);
    
    if (table) {
      tables.push(table);
    }
  }
  
  return tables;
}

/**
 * Extract details for the currently selected table
 */
async function extractTableDetails(options: SchemaExtractionOptions): Promise<ExtractedTable | null> {
  // Get table header information
  const tableHeaderElement = document.querySelector(selectors.TABLE_HEADER);
  if (!tableHeaderElement) return null;
  
  // Extract table name and description
  const tableName = tableHeaderElement.querySelector(selectors.TABLE_NAME)?.textContent?.trim() || 'Unknown Table';
  const tableDescription = tableHeaderElement.querySelector(selectors.TABLE_DESCRIPTION)?.textContent?.trim();
  
  // Try to get table ID from data attribute or generate one
  const tableIdElement = document.querySelector(selectors.TABLE_ID_ATTRIBUTE);
  const tableId = tableIdElement?.getAttribute('data-table-id') || 
    `table-${uuidv4().slice(0, 8)}`;
  
  // Extract columns
  const columns = await extractColumns(options);
  
  return {
    id: tableId,
    name: tableName,
    description: tableDescription,
    columns
  };
}

/**
 * Extract columns for the currently selected table
 */
async function extractColumns(options: SchemaExtractionOptions): Promise<ExtractedColumn[]> {
  const columns: ExtractedColumn[] = [];
  
  // Find column elements
  const columnElements = document.querySelectorAll(selectors.COLUMN_LIST_ITEM);
  
  for (const columnElement of Array.from(columnElements)) {
    // Extract column name
    const nameElement = columnElement.querySelector(selectors.COLUMN_NAME);
    const name = nameElement?.textContent?.trim() || 'Unknown Column';
    
    // Extract column type
    const typeElement = columnElement.querySelector(selectors.COLUMN_TYPE);
    const type = typeElement?.textContent?.trim() || 'unknown';
    
    // Extract column attributes
    const isPrimaryKey = columnElement.querySelector(selectors.COLUMN_PRIMARY_KEY_INDICATOR) !== null;
    const isForeignKey = columnElement.querySelector(selectors.COLUMN_FOREIGN_KEY_INDICATOR) !== null;
    
    // Get or generate ID
    const columnId = columnElement.getAttribute('data-column-id') || 
      `col-${uuidv4().slice(0, 8)}`;
    
    // Extract description if requested
    let description: string | undefined;
    if (options.includeColumnDescriptions) {
      description = await extractColumnDescription(columnElement);
    }
    
    // Detect if nullable (this is a heuristic, not always available in UI)
    const isNullable = !columnElement.querySelector(selectors.COLUMN_NOT_NULL_INDICATOR);
    
    columns.push({
      id: columnId,
      name,
      type,
      description,
      isPrimaryKey,
      isForeignKey,
      isNullable
    });
  }
  
  return columns;
}

/**
 * Extract column description by clicking on the column and reading details
 */
async function extractColumnDescription(columnElement: Element): Promise<string | undefined> {
  // Store original state to restore after
  const wasColumnDetailsOpen = document.querySelector(selectors.COLUMN_DETAIL_VIEW) !== null;
  
  // Click column to view details if not already open
  if (!wasColumnDetailsOpen) {
    (columnElement as HTMLElement).click();
    // Wait for column details to appear
    await waitForElement(selectors.COLUMN_DETAIL_VIEW);
  }
  
  // Extract description
  const descriptionElement = document.querySelector(selectors.COLUMN_DESCRIPTION);
  const description = descriptionElement?.textContent?.trim();
  
  // Close column details if we opened them
  if (!wasColumnDetailsOpen) {
    const closeButton = document.querySelector(selectors.COLUMN_DETAIL_CLOSE_BUTTON);
    if (closeButton) {
      (closeButton as HTMLElement).click();
    }
  }
  
  return description;
}

/**
 * Extract relationships between tables
 */
export async function extractRelationships(): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];
  
  // Find foreign key indicators
  const foreignKeyElements = document.querySelectorAll(selectors.COLUMN_FOREIGN_KEY_INDICATOR);
  
  for (const fkElement of Array.from(foreignKeyElements)) {
    // Find parent column element
    const columnElement = fkElement.closest(selectors.COLUMN_LIST_ITEM);
    if (!columnElement) continue;
    
    // Click on foreign key to view relationship details
    (fkElement as HTMLElement).click();
    
    // Wait for relationship details to load
    await waitForElement(selectors.FK_RELATIONSHIP_DETAIL);
    
    // Extract relationship details
    const sourceTableElement = document.querySelector(selectors.FK_SOURCE_TABLE);
    const sourceColumnElement = document.querySelector(selectors.FK_SOURCE_COLUMN);
    const targetTableElement = document.querySelector(selectors.FK_TARGET_TABLE);
    const targetColumnElement = document.querySelector(selectors.FK_TARGET_COLUMN);
    
    if (sourceTableElement && sourceColumnElement && targetTableElement && targetColumnElement) {
      const relation: ExtractedRelationship = {
        sourceTableId: sourceTableElement.getAttribute('data-table-id') || `source-${uuidv4().slice(0, 8)}`,
        sourceTableName: sourceTableElement.textContent?.trim() || 'Unknown Source Table',
        sourceColumnId: sourceColumnElement.getAttribute('data-column-id') || `source-col-${uuidv4().slice(0, 8)}`,
        sourceColumnName: sourceColumnElement.textContent?.trim() || 'Unknown Source Column',
        targetTableId: targetTableElement.getAttribute('data-table-id') || `target-${uuidv4().slice(0, 8)}`,
        targetTableName: targetTableElement.textContent?.trim() || 'Unknown Target Table',
        targetColumnId: targetColumnElement.getAttribute('data-column-id') || `target-col-${uuidv4().slice(0, 8)}`,
        targetColumnName: targetColumnElement.textContent?.trim() || 'Unknown Target Column'
      };
      
      relationships.push(relation);
    }
    
    // Close relationship details popup
    const closeButton = document.querySelector(selectors.FK_RELATIONSHIP_CLOSE_BUTTON);
    if (closeButton) {
      (closeButton as HTMLElement).click();
    }
  }
  
  return relationships;
}

/**
 * Navigate to Metabase's data model browser if not already there
 */
async function navigateToDataModelBrowser(): Promise<void> {
  // Check if already in data model browser
  if (document.querySelector(selectors.DATA_MODEL_BROWSER)) {
    return;
  }
  
  // Find and click admin menu
  const adminButton = document.querySelector(selectors.ADMIN_BUTTON);
  if (adminButton) {
    (adminButton as HTMLElement).click();
    
    // Wait for admin menu
    await waitForElement(selectors.ADMIN_MENU);
    
    // Find and click data model option
    const dataModelOption = document.querySelector(selectors.DATA_MODEL_OPTION);
    if (dataModelOption) {
      (dataModelOption as HTMLElement).click();
      
      // Wait for data model browser to load
      await waitForElement(selectors.DATA_MODEL_BROWSER);
    }
  }
}

/**
 * Wait for an element to appear in the DOM
 */
function waitForElement(selector: string, timeout = 5000): Promise<Element> {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const element = document.querySelector(selector);
    if (element) {
      return resolve(element);
    }
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
    
    // Create observer to watch for element
    const observer = new MutationObserver((mutations: MutationRecord[], obs: MutationObserver) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
      }
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

/**
 * Check if schema extraction is possible in current page
 */
export function canExtractSchema(): boolean {
  return (
    // Check for common Metabase UI elements that indicate we're on a page where schema can be extracted
    document.querySelector(selectors.METABASE_APP) !== null &&
    (document.querySelector(selectors.DATA_MODEL_BROWSER) !== null ||
     document.querySelector(selectors.QUERY_BUILDER) !== null)
  );
}

/**
 * Get schema detection status
 */
export function getSchemaDetectionStatus(): SchemaDetectionResult {
  const tables = document.querySelectorAll(selectors.TABLE_LIST_ITEM);
  const columns = document.querySelectorAll(selectors.COLUMN_LIST_ITEM);
  const relationships = document.querySelectorAll(selectors.COLUMN_FOREIGN_KEY_INDICATOR);
  
  const errors: string[] = [];
  
  if (tables.length === 0) {
    errors.push('No tables detected in current view');
  }
  
  return {
    foundTables: tables.length,
    foundColumns: columns.length,
    foundRelationships: relationships.length,
    extractionComplete: tables.length > 0 && errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
} 