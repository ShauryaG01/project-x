/**
 * Metabase Content Script
 * 
 * This script runs in the context of Metabase and handles:
 * - Detecting Metabase in the page
 * - Injecting SQL queries into Metabase's editor
 * - Extracting results from Metabase
 */

// Define selectors for Metabase UI elements (will be refined later)
const SELECTORS = {
  SQL_EDITOR: '.ace_editor',
  RUN_BUTTON: '.RunButton',
  RESULTS_TABLE: '.TableInteractive',
  VISUALIZATION_ROOT: '.Visualization',
  ERROR_MESSAGE: '.QueryError'
};

// State management
let isMetabaseDetected = false;
let isInitialized = false;

/**
 * Check if the current page is a Metabase instance
 */
function detectMetabase(): boolean {
  // Look for key Metabase elements
  const hasEditor = document.querySelector(SELECTORS.SQL_EDITOR) !== null;
  const hasVisualization = document.querySelector(SELECTORS.VISUALIZATION_ROOT) !== null;
  
  // Check for metabase in URL as additional confirmation
  const isMetabaseUrl = window.location.href.includes('metabase') || 
                         window.location.href.includes('dashboard');
                        
  return (hasEditor || hasVisualization) && isMetabaseUrl;
}

/**
 * Initialize the content script
 */
function initialize() {
  if (isInitialized) return;
  
  console.log('MetabaseNL: Content script initializing');
  
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
 * Main initialization function that runs when the content script loads
 */
function main() {
  console.log('MetabaseNL: Content script loaded');
  
  // Check if we're in Metabase
  isMetabaseDetected = detectMetabase();
  
  if (isMetabaseDetected) {
    console.log('MetabaseNL: Metabase detected');
    initialize();
  } else {
    console.log('MetabaseNL: Not a Metabase page');
    
    // Check again after DOM is fully loaded
    window.addEventListener('load', () => {
      isMetabaseDetected = detectMetabase();
      if (isMetabaseDetected) {
        console.log('MetabaseNL: Metabase detected after DOM load');
        initialize();
      }
    });
    
    // Check again after any potential SPA navigation
    const observer = new MutationObserver(() => {
      if (!isMetabaseDetected) {
        isMetabaseDetected = detectMetabase();
        if (isMetabaseDetected) {
          console.log('MetabaseNL: Metabase detected after DOM mutation');
          initialize();
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