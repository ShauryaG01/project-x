/**
 * Metabase adapter implementation
 * Provides integration with Metabase UI for the extension
 */

import { DatabaseAdapter } from '../adapter';
import { AdapterConfig, DetectionResult } from '../../../types/adapters';
import { detectMetabase, detectMetabaseVersion } from './detector';
import { getMetabaseConfig, validateSelector } from './selectors';

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
      // Handle SQL editor changes
      // This will be expanded in Step 7
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
      // Handle results panel changes
      // This will be expanded in Step 8
    });
    
    observer.observe(resultContainer, {
      childList: true,
      subtree: true
    });
  }
}

// Create and export a singleton instance
export const metabaseAdapter = new MetabaseAdapter(); 