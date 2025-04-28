/**
 * Metabase Content Script
 * 
 * This script runs in the context of Metabase and handles:
 * - Detecting Metabase in the page
 * - Injecting SQL queries into Metabase's editor
 * - Extracting results from Metabase
 */

import { metabaseAdapter } from '../lib/adapters/metabase';
import { adapterRegistry } from '../lib/adapters/registry';
import { QueryResults } from '../types/results';

// State management
let isMetabaseDetected = false;
let isInitialized = false;

/**
 * Check if the current page is a Metabase instance using the adapter
 */
async function detectMetabase(): Promise<boolean> {
  try {
    const detectionResult = await metabaseAdapter.detect();
    return detectionResult.detected;
  } catch (error) {
    console.error('MetabaseNL: Error detecting Metabase', error);
    return false;
  }
}

/**
 * Initialize the content script
 */
async function initialize() {
  if (isInitialized) return;
  
  console.log('MetabaseNL: Content script initializing');
  
  // Register the Metabase adapter with the registry
  adapterRegistry.register(metabaseAdapter);
  
  // Initialize the adapter
  await metabaseAdapter.initialize();
  
  // Register message listener
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    switch (request.type) {
      case 'DETECT_METABASE':
        sendResponse({ isMetabase: isMetabaseDetected });
        break;
        
      case 'INJECT_SQL':
        injectSQL(request.sql, request.executeImmediately)
          .then(result => sendResponse({ success: result.success, error: result.error }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
        
      case 'EXECUTE_SQL':
        executeSQL()
          .then(result => sendResponse({ success: result.success, error: result.error }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
        
      case 'EXTRACT_RESULTS':
        extractResults()
          .then(results => sendResponse({ success: true, results }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
        
      case 'EXTRACT_SCHEMA':
        extractSchema()
          .then(schema => sendResponse({ success: true, schema }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
  });
  
  isInitialized = true;
  console.log('MetabaseNL: Content script initialized');
}

/**
 * Inject SQL into Metabase's editor
 * @param sql SQL query to inject
 * @param executeImmediately Whether to execute the query immediately
 * @returns Promise resolving to execution result
 */
async function injectSQL(
  sql: string, 
  executeImmediately: boolean = false
): Promise<{ success: boolean, error?: string }> {
  console.log('MetabaseNL: Injecting SQL', sql, executeImmediately ? '(with execution)' : '');
  
  try {
    if (executeImmediately) {
      // Inject and execute in one operation
      const result = await metabaseAdapter.injectAndExecuteSQL(sql);
      return result;
    } else {
      // Just inject the SQL
      const success = await metabaseAdapter.injectSQL(sql);
      return { 
        success, 
        error: success ? undefined : 'Failed to inject SQL' 
      };
    }
  } catch (error) {
    console.error('MetabaseNL: Error injecting SQL:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Execute the current SQL query
 * @returns Promise resolving to execution result
 */
async function executeSQL(): Promise<{ success: boolean, error?: string }> {
  console.log('MetabaseNL: Executing SQL query');
  
  try {
    const result = await metabaseAdapter.executeQuery();
    return result;
  } catch (error) {
    console.error('MetabaseNL: Error executing SQL:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Extract results from Metabase
 * @returns Promise resolving to query results
 */
async function extractResults(): Promise<QueryResults> {
  console.log('MetabaseNL: Extracting results');
  
  try {
    return await metabaseAdapter.extractResults();
  } catch (error) {
    console.error('MetabaseNL: Error extracting results:', error);
    // Return empty results on error
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Extract schema from Metabase
 * This is a placeholder implementation that will be expanded in Step 13
 */
async function extractSchema(): Promise<any> {
  console.log('MetabaseNL: Extracting schema');
  
  try {
    return await metabaseAdapter.extractSchema();
  } catch (error) {
    console.error('MetabaseNL: Error extracting schema', error);
    throw error;
  }
}

/**
 * Main initialization function that runs when the content script loads
 */
async function main() {
  console.log('MetabaseNL: Content script loaded');
  
  // Check if we're in Metabase
  isMetabaseDetected = await detectMetabase();
  
  if (isMetabaseDetected) {
    console.log('MetabaseNL: Metabase detected');
    await initialize();
  } else {
    console.log('MetabaseNL: Not a Metabase page');
    
    // Check again after DOM is fully loaded
    window.addEventListener('load', async () => {
      isMetabaseDetected = await detectMetabase();
      if (isMetabaseDetected) {
        console.log('MetabaseNL: Metabase detected after DOM load');
        await initialize();
      }
    });
    
    // Check again after any potential SPA navigation
    const observer = new MutationObserver(async () => {
      if (!isMetabaseDetected) {
        isMetabaseDetected = await detectMetabase();
        if (isMetabaseDetected) {
          console.log('MetabaseNL: Metabase detected after DOM mutation');
          await initialize();
          observer.disconnect();
        }
      }
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }
}

// Run the main function
main(); 