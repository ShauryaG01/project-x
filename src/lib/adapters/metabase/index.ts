/**
 * Metabase adapter implementation
 * Provides integration with Metabase UI for the extension
 */

import { DatabaseAdapter } from '../adapter';
import { AdapterConfig, DetectionResult } from '../../../types/adapters';
import { detectMetabase, detectMetabaseVersion } from './detector';
import { getMetabaseConfig, validateSelector } from './selectors';
import { metabaseExecutor, SqlExecutionResult } from './executor';
import { resultsExtractor } from './results';
import { QueryResults } from '../../../types/results';

/**
 * Metabase adapter class
 * Implements the DatabaseAdapter interface for Metabase
 */
export class MetabaseAdapter implements DatabaseAdapter {
  /**
   * Unique identifier for this adapter
   */
  public readonly id = 'metabase';
  
  /**
   * Display name for the adapter
   */
  public readonly displayName = 'Metabase';
  
  /**
   * Configuration options for the adapter
   */
  public readonly config: AdapterConfig;
  
  /**
   * Detected version of Metabase
   */
  private version: string | null = null;
  
  /**
   * Constructor
   */
  constructor() {
    this.config = getMetabaseConfig();
  }
  
  /**
   * Detects if the current page contains Metabase
   * @returns Promise resolving to detection result with confidence score
   */
  async detect(): Promise<DetectionResult> {
    const result = await detectMetabase();
    
    if (result.detected) {
      // Try to detect version if Metabase is detected
      this.version = await detectMetabaseVersion();
      
      if (this.version) {
        if (!result.details) {
          result.details = {};
        }
        result.details.version = this.version;
      }
    }
    
    return result;
  }
  
  /**
   * Injects required scripts and styles into the page
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    // Verify we're in a Metabase page
    const isCompatible = await this.isCompatible();
    if (!isCompatible) {
      console.warn('Metabase adapter initialized on incompatible page');
      return;
    }
    
    // Add any necessary event listeners or page modifications
    this.setupEventListeners();
    
    console.log(`Metabase adapter initialized${this.version ? ` (v${this.version})` : ''}`);
  }
  
  /**
   * Extracts schema information from Metabase
   * @returns Promise resolving to schema data
   */
  async extractSchema(): Promise<any> {
    // This will be implemented in Step 13
    return {};
  }
  
  /**
   * Verifies if the adapter is compatible with the current page
   * @returns Promise resolving to true if compatible
   */
  async isCompatible(): Promise<boolean> {
    const detection = await this.detect();
    return detection.detected && detection.confidence >= 60;
  }
  
  /**
   * Injects SQL into Metabase's editor
   * @param sql SQL query to inject
   * @returns Promise resolving to true if successful
   */
  async injectSQL(sql: string): Promise<boolean> {
    try {
      console.log('MetabaseAdapter: Injecting SQL:', sql);
      return await metabaseExecutor.injectSql(sql);
    } catch (error) {
      console.error('MetabaseAdapter: Error injecting SQL:', error);
      return false;
    }
  }
  
  /**
   * Executes the current SQL query
   * @returns Promise resolving to execution result
   */
  async executeQuery(): Promise<SqlExecutionResult> {
    try {
      console.log('MetabaseAdapter: Executing SQL query');
      return await metabaseExecutor.executeQuery();
    } catch (error) {
      console.error('MetabaseAdapter: Error executing query:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
  
  /**
   * Injects and executes a SQL query
   * @param sql SQL query to inject and execute
   * @returns Promise resolving to execution result
   */
  async injectAndExecuteSQL(sql: string): Promise<SqlExecutionResult> {
    try {
      const injected = await this.injectSQL(sql);
      if (!injected) {
        return { success: false, error: 'Failed to inject SQL' };
      }
      
      return await this.executeQuery();
    } catch (error) {
      console.error('MetabaseAdapter: Error injecting and executing SQL:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
  
  /**
   * Extracts query results from Metabase
   * @returns Promise resolving to query results
   */
  async extractResults(): Promise<QueryResults> {
    try {
      console.log('MetabaseAdapter: Extracting query results');
      return await resultsExtractor.extractResults();
    } catch (error) {
      console.error('MetabaseAdapter: Error extracting results:', error);
      throw error;
    }
  }
  
  /**
   * Sets up event listeners for Metabase UI interactions
   */
  private setupEventListeners(): void {
    // Listen for SQL editor changes
    this.observeSQLEditor();
    
    // Listen for result panel changes
    this.observeResultsPanel();
  }
  
  /**
   * Creates MutationObserver for the SQL editor
   */
  private observeSQLEditor(): void {
    if (!validateSelector('sql_editor')) {
      return;
    }
    
    const editorElement = document.querySelector(
      this.config.selectors.interaction?.sql_editor.selector || ''
    );
    
    if (!editorElement) {
      return;
    }
    
    const observer = new MutationObserver((mutations) => {
      // Detect SQL editor changes
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // SQL editor content changed
          console.log('MetabaseAdapter: SQL editor content changed');
        }
      });
    });
    
    observer.observe(editorElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  
  /**
   * Creates MutationObserver for the results panel
   */
  private observeResultsPanel(): void {
    if (!validateSelector('result_table')) {
      return;
    }
    
    const resultContainer = document.querySelector(
      this.config.selectors.interaction?.result_table.selector || ''
    );
    
    if (!resultContainer) {
      return;
    }
    
    const observer = new MutationObserver((mutations) => {
      // Detect results panel changes
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // Results panel content changed
          console.log('MetabaseAdapter: Results panel content changed');
          
          // You might want to automatically extract results here
          // This could be triggered when new results load
          this.extractResults()
            .then(results => {
              console.log('MetabaseAdapter: Auto-extracted results:', 
                `${results.rowCount} rows, ${results.columns.length} columns`);
            })
            .catch(error => {
              console.error('MetabaseAdapter: Error auto-extracting results:', error);
            });
        }
      });
    });
    
    observer.observe(resultContainer, {
      childList: true,
      subtree: true
    });
  }
}

// Create and export a singleton instance
export const metabaseAdapter = new MetabaseAdapter(); 