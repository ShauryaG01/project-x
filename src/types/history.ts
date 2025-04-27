/**
 * Query History Types
 * 
 * This module contains type definitions related to query history
 * that extend the base storage types.
 */

import React from 'react';
import { StoredQuery } from './storage';

/**
 * Enum for query history filtering options
 */
export enum HistoryFilterType {
  ALL = 'all',
  STARRED = 'starred',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  DATABASE = 'database',
  CUSTOM = 'custom'
}

/**
 * Interface for query history filters
 */
export interface HistoryFilter {
  type: HistoryFilterType;
  value?: string;
  label?: string;
}

/**
 * Interface for query history sort options
 */
export enum HistorySortField {
  TIMESTAMP = 'timestamp',
  DATABASE = 'databaseId',
  QUESTION = 'question'
}

/**
 * Interface for query history sort direction
 */
export enum HistorySortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Interface for query history sort options
 */
export interface HistorySort {
  field: HistorySortField;
  direction: HistorySortDirection;
}

/**
 * Interface for the history state
 */
export interface HistoryState {
  queries: StoredQuery[];
  loading: boolean;
  error: Error | null;
  filter: HistoryFilter;
  sort: HistorySort;
  searchQuery: string;
  selectedQueryId: string | null;
}

/**
 * Interface for query history actions
 */
export type HistoryAction = 
  | { type: 'SET_QUERIES', payload: StoredQuery[] }
  | { type: 'ADD_QUERY', payload: StoredQuery }
  | { type: 'UPDATE_QUERY', payload: StoredQuery }
  | { type: 'DELETE_QUERY', payload: string }
  | { type: 'LOADING', payload: boolean }
  | { type: 'ERROR', payload: Error | null }
  | { type: 'SET_FILTER', payload: HistoryFilter }
  | { type: 'SET_SORT', payload: HistorySort }
  | { type: 'SET_SEARCH', payload: string }
  | { type: 'SELECT_QUERY', payload: string | null }
  | { type: 'CLEAR_HISTORY' };

/**
 * Interface for history context
 */
export interface HistoryContextType {
  state: HistoryState;
  dispatch: React.Dispatch<HistoryAction>;
  loadQueries: () => Promise<void>;
  saveQuery: (query: Omit<StoredQuery, 'id' | 'timestamp'>) => Promise<StoredQuery>;
  updateQuery: (id: string, updates: Partial<StoredQuery>) => Promise<StoredQuery>;
  deleteQuery: (id: string) => Promise<void>;
  starQuery: (id: string, isStarred: boolean) => Promise<StoredQuery>;
  clearHistory: () => Promise<void>;
  getFilteredQueries: () => StoredQuery[];
} 