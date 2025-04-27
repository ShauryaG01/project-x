/**
 * Storage Module
 * 
 * This is the main entry point for the storage module, which provides access to
 * the IndexedDB database for storing query history, schema cache, and user settings.
 */

import db from './db';
import history from './history';
import schema from './schema';
import settings from './settings';
import { StorageError, StorageErrorType } from '../../types/storage';

/**
 * Initialize all storage
 */
async function initialize(): Promise<void> {
  try {
    // Initialize database
    await db.init();
    
    // Initialize settings with defaults
    await settings.initialize();
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    throw new StorageError('Failed to initialize storage', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Clear all storage data
 */
async function clearAll(): Promise<void> {
  try {
    await db.clear();
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw new StorageError('Failed to clear storage', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Export a clean interface to the storage module
 */
export default {
  // Core database operations
  initialize,
  clearAll,
  close: db.close,
  delete: db.delete,
  
  // Query history operations
  history,
  
  // Schema cache operations
  schema,
  
  // Settings operations
  settings,
}; 