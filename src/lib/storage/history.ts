/**
 * Query History Storage Operations
 * 
 * This module provides functions for managing query history in IndexedDB.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db';
import { StoredQuery } from '../../types/storage';
import { StorageError, StorageErrorType } from '../../types/storage';

/**
 * Save a query to history
 */
export async function saveQuery(query: Omit<StoredQuery, 'id' | 'timestamp'>): Promise<StoredQuery> {
  try {
    const db = await getDB();
    
    // Create a complete query object with id and timestamp
    const newQuery: StoredQuery = {
      ...query,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    
    // Save to IndexedDB
    await db.put('queries', newQuery);
    
    return newQuery;
  } catch (error) {
    console.error('Failed to save query:', error);
    throw new StorageError('Failed to save query to history', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Get a query by ID
 */
export async function getQuery(id: string): Promise<StoredQuery | null> {
  try {
    const db = await getDB();
    const query = await db.get('queries', id);
    return query || null;
  } catch (error) {
    console.error('Failed to get query:', error);
    throw new StorageError('Failed to retrieve query', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Update a query
 */
export async function updateQuery(id: string, updates: Partial<StoredQuery>): Promise<StoredQuery> {
  try {
    const db = await getDB();
    
    // Get the existing query
    const existingQuery = await db.get('queries', id);
    
    if (!existingQuery) {
      throw new StorageError(`Query with ID ${id} not found`, StorageErrorType.NOT_FOUND);
    }
    
    // Create updated query
    const updatedQuery: StoredQuery = {
      ...existingQuery,
      ...updates,
      id, // Ensure ID doesn't change
    };
    
    // Save to IndexedDB
    await db.put('queries', updatedQuery);
    
    return updatedQuery;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    console.error('Failed to update query:', error);
    throw new StorageError('Failed to update query', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Delete a query
 */
export async function deleteQuery(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('queries', id);
  } catch (error) {
    console.error('Failed to delete query:', error);
    throw new StorageError('Failed to delete query', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Get all queries
 */
export async function getAllQueries(): Promise<StoredQuery[]> {
  try {
    const db = await getDB();
    return await db.getAll('queries');
  } catch (error) {
    console.error('Failed to get all queries:', error);
    throw new StorageError('Failed to retrieve queries', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Get queries by database ID
 */
export async function getQueriesByDatabase(databaseId: string): Promise<StoredQuery[]> {
  try {
    const db = await getDB();
    const index = db.transaction('queries').store.index('by-database');
    return await index.getAll(databaseId);
  } catch (error) {
    console.error('Failed to get queries by database:', error);
    throw new StorageError('Failed to retrieve queries by database', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Get recent queries, limited by count
 */
export async function getRecentQueries(limit: number = 10): Promise<StoredQuery[]> {
  try {
    const db = await getDB();
    const tx = db.transaction('queries', 'readonly');
    const index = tx.store.index('by-timestamp');
    
    // Get all keys, then sort in descending order (newest first)
    const keys = await index.getAllKeys();
    const sortedKeys = Array.from(keys).sort((a, b) => Number(b) - Number(a));
    
    // Limit the number of results
    const limitedKeys = sortedKeys.slice(0, limit);
    
    // Fetch the queries
    const queries: StoredQuery[] = [];
    for (const key of limitedKeys) {
      const cursor = await index.openCursor(IDBKeyRange.only(key));
      if (cursor) {
        queries.push(cursor.value);
      }
    }
    
    return queries;
  } catch (error) {
    console.error('Failed to get recent queries:', error);
    throw new StorageError('Failed to retrieve recent queries', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Search queries by text
 */
export async function searchQueries(searchText: string): Promise<StoredQuery[]> {
  try {
    const db = await getDB();
    const allQueries = await db.getAll('queries');
    
    // Simple case-insensitive search in question and SQL
    const searchLower = searchText.toLowerCase();
    return allQueries.filter(query => 
      query.question.toLowerCase().includes(searchLower) ||
      query.sql.toLowerCase().includes(searchLower) ||
      (query.tags && query.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
    );
  } catch (error) {
    console.error('Failed to search queries:', error);
    throw new StorageError('Failed to search queries', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Clear all query history
 */
export async function clearHistory(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('queries');
  } catch (error) {
    console.error('Failed to clear history:', error);
    throw new StorageError('Failed to clear query history', StorageErrorType.TRANSACTION_FAILED);
  }
}

// Export default object for easier importing
export default {
  save: saveQuery,
  get: getQuery,
  update: updateQuery,
  delete: deleteQuery,
  getAll: getAllQueries,
  getByDatabase: getQueriesByDatabase,
  getRecent: getRecentQueries,
  search: searchQueries,
  clear: clearHistory,
}; 