/**
 * Metabase results extraction
 * Provides functionality to extract and process query results from Metabase
 */

import { getSelector, validateSelector } from './selectors';
import { QueryResults, ResultColumn, ResultRow, ResultsSummary } from '../../../types/results';

/**
 * Class for extracting and processing query results from Metabase
 */
export class ResultsExtractor {
  /**
   * Last extracted results
   */
  private lastResults: QueryResults | null = null;

  /**
   * Extract query results from Metabase's UI
   * @returns Promise resolving to query results
   */
  async extractResults(): Promise<QueryResults> {
    try {
      // First check if we have query results in Metabase's state
      const results = await this.getResultsFromState();
      
      if (results) {
        this.lastResults = results;
        return results;
      }
      
      // If we can't get results from state, try to extract from DOM
      return await this.extractResultsFromDOM();
    } catch (error) {
      console.error('Error extracting results:', error);
      throw error;
    }
  }

  /**
   * Get a summary of the results
   * @param results Query results to summarize
   * @returns Results summary
   */
  getResultsSummary(results: QueryResults): ResultsSummary {
    return {
      rowCount: results.rowCount,
      columnCount: results.columns.length,
      columnNames: results.columns.map(col => col.name),
      executionTime: results.executionTime,
      truncated: results.truncated
    };
  }

  /**
   * Extract results from Metabase's Redux state
   * @returns Promise resolving to query results or null if not found
   */
  private async getResultsFromState(): Promise<QueryResults | null> {
    try {
      // Get query results from Metabase's state
      const queryResults = await this.getMetabaseState('qb.queryResults[0]');
      if (!queryResults || !queryResults.data) {
        return null;
      }
      
      // Get current card for additional info
      const card = await this.getMetabaseState('qb.card');
      
      // Get execution time if available
      const runningTime = await this.getMetabaseState('qb.runningTime');
      
      // Extract and format the results
      const formattedResults: QueryResults = {
        columns: this.formatColumns(queryResults.data.cols || []),
        rows: queryResults.data.rows || [],
        rowCount: queryResults.data.rows?.length || 0,
        executionTime: runningTime,
        rawData: queryResults.data,
        truncated: queryResults.data.rows_truncated || false,
        error: queryResults.error,
        query: card?.dataset_query?.native?.query,
        visualizationType: card?.display,
        cardId: card?.id
      };
      
      return formattedResults;
    } catch (error) {
      console.error('Error getting results from state:', error);
      return null;
    }
  }

  /**
   * Extract results from Metabase's DOM
   * @returns Promise resolving to query results
   */
  private async extractResultsFromDOM(): Promise<QueryResults> {
    try {
      const resultTableSelector = getSelector('result_table');
      if (!resultTableSelector || !validateSelector('result_table')) {
        throw new Error('Results table not found in DOM');
      }
      
      const tableElement = document.querySelector(resultTableSelector.selector);
      if (!tableElement) {
        throw new Error('Results table element not found');
      }
      
      // Extract column headers
      const headerElements = tableElement.querySelectorAll('th');
      const columns: ResultColumn[] = Array.from(headerElements).map(header => ({
        name: header.textContent?.trim() || '',
        displayName: header.textContent?.trim() || '',
        type: 'unknown' // Can't reliably determine type from DOM
      }));
      
      // Extract rows
      const rowElements = tableElement.querySelectorAll('tbody tr');
      const rows: ResultRow[] = Array.from(rowElements).map(row => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).map(cell => cell.textContent?.trim() || null);
      });
      
      // Get visualization type if possible
      const visualizationType = this.detectVisualizationType();
      
      // Build results object
      const results: QueryResults = {
        columns,
        rows,
        rowCount: rows.length,
        visualizationType
      };
      
      this.lastResults = results;
      return results;
    } catch (error) {
      console.error('Error extracting results from DOM:', error);
      
      // If we have last results, return those
      if (this.lastResults) {
        return this.lastResults;
      }
      
      // Otherwise, return empty results
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Format column data from Metabase format to our format
   * @param cols Metabase columns
   * @returns Formatted columns
   */
  private formatColumns(cols: any[]): ResultColumn[] {
    return cols.map(col => ({
      name: col.name || '',
      displayName: col.display_name || col.name || '',
      type: col.base_type || 'unknown',
      baseType: col.base_type,
      semanticType: col.semantic_type,
      fieldId: col.field_id,
      tableId: col.table_id,
      dimension: !!col.dimension
    }));
  }

  /**
   * Try to detect the current visualization type from the DOM
   * @returns Visualization type or undefined if not detected
   */
  private detectVisualizationType(): string | undefined {
    try {
      // Common visualization containers
      const vizSelectors = [
        '.LineAreaBarChart',
        '.PieChart',
        '.TableInteractive',
        '.ScalarValue',
        '.Map',
        '.FunnelChart'
      ];
      
      for (const selector of vizSelectors) {
        if (document.querySelector(selector)) {
          // Extract type from class name
          const match = selector.match(/\.([A-Za-z]+)/);
          if (match) {
            return match[1].toLowerCase();
          }
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error detecting visualization type:', error);
      return undefined;
    }
  }

  /**
   * Get state from Metabase's Redux store
   * @param path Path to retrieve from state
   * @returns Promise resolving to state value
   */
  private async getMetabaseState(path: string): Promise<any> {
    try {
      // Access Metabase's Redux store
      const store = (window as any).Metabase?.store;
      if (!store || !store.getState) {
        console.error('Metabase store not available');
        return null;
      }
      
      // Get state from path
      const state = store.getState();
      return this.getNestedProperty(state, path);
    } catch (error) {
      console.error('Error getting Metabase state:', error);
      return null;
    }
  }

  /**
   * Get a nested property from an object using dot notation
   * @param obj Object to get property from
   * @param path Path in dot notation
   * @returns Property value
   */
  private getNestedProperty(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
      
      if (arrayMatch) {
        // Handle array access, e.g., 'queryResults[0]'
        const propName = arrayMatch[1];
        const index = parseInt(arrayMatch[2], 10);
        
        if (!current[propName] || !current[propName][index]) {
          return undefined;
        }
        
        current = current[propName][index];
      } else {
        // Handle regular property access
        if (current === undefined || current === null) {
          return undefined;
        }
        
        current = current[part];
      }
    }
    
    return current;
  }
}

// Export singleton instance
export const resultsExtractor = new ResultsExtractor(); 