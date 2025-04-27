/**
 * IndexedDB Database Management
 * 
 * This module handles the initialization and management of the IndexedDB database
 * used for storing query history, schema cache, and user settings.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StoredQuery } from '../../types/storage';
import { SchemaCache } from '../../types/storage';
import { UserSettings } from '../../types/storage';

// Database name and version
const DB_NAME = 'metabase-nl-db';
const DB_VERSION = 1;

// Define database schema
interface MetabaseNLDB extends DBSchema {
  queries: {
    key: string; // UUID
    value: StoredQuery;
    indexes: {
      'by-timestamp': number;
      'by-database': string;
    };
  };
  schema: {
    key: string; // databaseId
    value: SchemaCache;
  };
  settings: {
    key: string; // setting key
    value: UserSettings[keyof UserSettings];
  };
}

// Database instance
let dbInstance: IDBPDatabase<MetabaseNLDB> | null = null;

/**
 * Initialize the database
 */
export async function initDatabase(): Promise<IDBPDatabase<MetabaseNLDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<MetabaseNLDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // Create object stores if they don't exist
        if (oldVersion < 1) {
          // Create query history store
          const queryStore = db.createObjectStore('queries', { keyPath: 'id' });
          queryStore.createIndex('by-timestamp', 'timestamp');
          queryStore.createIndex('by-database', 'databaseId');
          
          // Create schema cache store
          db.createObjectStore('schema', { keyPath: 'databaseId' });
          
          // Create settings store
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
      blocked() {
        console.error('Database opening blocked');
      },
      blocking() {
        console.warn('This database is blocking an older version');
      },
      terminated() {
        console.error('Database connection terminated');
        dbInstance = null;
      },
    });

    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error('Failed to initialize database');
  }
}

/**
 * Get the database instance
 */
export async function getDB(): Promise<IDBPDatabase<MetabaseNLDB>> {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

/**
 * Close the database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Clear all data from the database
 */
export async function clearDatabase(): Promise<void> {
  const db = await getDB();
  
  // Clear all object stores
  const tx = db.transaction(['queries', 'schema', 'settings'], 'readwrite');
  await Promise.all([
    tx.objectStore('queries').clear(),
    tx.objectStore('schema').clear(),
    tx.objectStore('settings').clear(),
    tx.done,
  ]);
}

/**
 * Delete the database entirely
 */
export async function deleteDatabase(): Promise<void> {
  await closeDB();
  await indexedDB.deleteDatabase(DB_NAME);
}

// Export a default object for easier importing
export default {
  init: initDatabase,
  get: getDB,
  close: closeDB,
  clear: clearDatabase,
  delete: deleteDatabase,
}; 