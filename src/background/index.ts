/**
 * Background Service Worker
 * 
 * This script runs in the background and handles:
 * - Communication between content scripts and popup
 * - Storage operations
 * - Extension lifecycle events
 */

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Initialize default settings
    chrome.storage.sync.set({
      theme: 'light',
      maxHistoryItems: 50,
      enableHistory: true,
      primaryProvider: 'openai',
      shareUsageStats: true,
      storeQueriesLocally: true
    });
    
    console.log('MetabaseNL: Extension installed with default settings');
  } else if (details.reason === 'update') {
    console.log(`MetabaseNL: Extension updated to version ${chrome.runtime.getManifest().version}`);
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  // Handle messages based on their type
  switch (request.type) {
    case 'PING':
      // Simple ping to check if background script is running
      sendResponse({ status: 'ok', version: chrome.runtime.getManifest().version });
      break;
      
    case 'GET_SETTINGS':
      // Retrieve settings from storage
      chrome.storage.sync.get(null, (settings) => {
        sendResponse({ status: 'ok', data: settings });
      });
      return true; // Keep the message channel open for async response
      
    case 'EXECUTE_QUERY':
      // Forward the query to the appropriate content script
      // This will be implemented in later steps
      sendResponse({ status: 'error', message: 'Query execution not implemented yet' });
      break;
      
    default:
      sendResponse({ status: 'error', message: 'Unknown message type' });
  }
});

// Setup context menu (will be implemented in later steps)
chrome.runtime.onStartup.addListener(() => {
  // Initialize any runtime state
  console.log('MetabaseNL: Background service worker started');
});

// Simple way to keep service worker alive
// This helps with older Chrome versions
function keepAlive() {
  setInterval(() => {
    console.log('MetabaseNL: Service worker keepalive');
  }, 20000);
}

keepAlive(); 