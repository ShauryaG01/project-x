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
        injectSQL(request.sql)
          .then(success => sendResponse({ success }))
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
 * This is a placeholder implementation that will be expanded in Step 7
 */
async function injectSQL(sql: string): Promise<boolean> {
  console.log('MetabaseNL: Injecting SQL', sql);
  
  // This will be properly implemented in Step 7
  // For now, just log the SQL that would be injected
  return Promise.resolve(false);
}

/**
 * Extract results from Metabase
 * This is a placeholder implementation that will be expanded in Step 8
 */
async function extractResults(): Promise<any> {
  console.log('MetabaseNL: Extracting results');
  
  // This will be properly implemented in Step 8
  // For now, just return an empty result
  return Promise.resolve({
    columns: [],
    rows: []
  });
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