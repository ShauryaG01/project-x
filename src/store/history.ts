/**
 * Query History Store
 * 
 * This module provides global state management for query history
 * using React Context and useReducer.
 */

import React, { createContext, useReducer, useContext, useCallback, ReactNode } from 'react';
import historyStorage from '../lib/storage/history';
import { StoredQuery } from '../types/storage';
import { 
  HistoryState, 
  HistoryAction, 
  HistoryContextType,
  HistoryFilterType,
  HistorySortField,
  HistorySortDirection
} from '../types/history';

// Initial state for history
const initialState: HistoryState = {
  queries: [],
  loading: false,
  error: null,
  filter: { type: HistoryFilterType.ALL },
  sort: { 
    field: HistorySortField.TIMESTAMP, 
    direction: HistorySortDirection.DESC 
  },
  searchQuery: '',
  selectedQueryId: null
};

// Reducer for history state
function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'SET_QUERIES':
      return { ...state, queries: action.payload };
    case 'ADD_QUERY':
      return { ...state, queries: [action.payload, ...state.queries] };
    case 'UPDATE_QUERY':
      return { 
        ...state, 
        queries: state.queries.map(q => 
          q.id === action.payload.id ? action.payload : q
        ) 
      };
    case 'DELETE_QUERY':
      return { 
        ...state, 
        queries: state.queries.filter(q => q.id !== action.payload),
        selectedQueryId: state.selectedQueryId === action.payload ? null : state.selectedQueryId
      };
    case 'LOADING':
      return { ...state, loading: action.payload };
    case 'ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SORT':
      return { ...state, sort: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SELECT_QUERY':
      return { ...state, selectedQueryId: action.payload };
    case 'CLEAR_HISTORY':
      return { ...state, queries: [], selectedQueryId: null };
    default:
      return state;
  }
}

// Create history context
export const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

// History provider component
interface HistoryProviderProps {
  children: ReactNode;
}

export function HistoryProvider({ children }: HistoryProviderProps) {
  const [state, dispatch] = useReducer(historyReducer, initialState);

  // Load queries from storage
  const loadQueries = useCallback(async () => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const queries = await historyStorage.getAll();
      dispatch({ type: 'SET_QUERIES', payload: queries });
      dispatch({ type: 'ERROR', payload: null });
    } catch (error) {
      console.error('Failed to load queries:', error);
      dispatch({ type: 'ERROR', payload: error as Error });
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  }, []);

  // Save a new query
  const saveQuery = useCallback(async (query: Omit<StoredQuery, 'id' | 'timestamp'>) => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const newQuery = await historyStorage.save(query);
      dispatch({ type: 'ADD_QUERY', payload: newQuery });
      dispatch({ type: 'ERROR', payload: null });
      return newQuery;
    } catch (error) {
      console.error('Failed to save query:', error);
      dispatch({ type: 'ERROR', payload: error as Error });
      throw error;
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  }, []);

  // Update an existing query
  const updateQuery = useCallback(async (id: string, updates: Partial<StoredQuery>) => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const updatedQuery = await historyStorage.update(id, updates);
      dispatch({ type: 'UPDATE_QUERY', payload: updatedQuery });
      dispatch({ type: 'ERROR', payload: null });
      return updatedQuery;
    } catch (error) {
      console.error('Failed to update query:', error);
      dispatch({ type: 'ERROR', payload: error as Error });
      throw error;
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  }, []);

  // Delete a query
  const deleteQuery = useCallback(async (id: string) => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      await historyStorage.delete(id);
      dispatch({ type: 'DELETE_QUERY', payload: id });
      dispatch({ type: 'ERROR', payload: null });
    } catch (error) {
      console.error('Failed to delete query:', error);
      dispatch({ type: 'ERROR', payload: error as Error });
      throw error;
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  }, []);

  // Star/unstar a query
  const starQuery = useCallback(async (id: string, isStarred: boolean) => {
    return updateQuery(id, { isStarred });
  }, [updateQuery]);

  // Clear all history
  const clearHistory = useCallback(async () => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      await historyStorage.clear();
      dispatch({ type: 'CLEAR_HISTORY' });
      dispatch({ type: 'ERROR', payload: null });
    } catch (error) {
      console.error('Failed to clear history:', error);
      dispatch({ type: 'ERROR', payload: error as Error });
      throw error;
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  }, []);

  // Get filtered and sorted queries
  const getFilteredQueries = useCallback(() => {
    const { queries, filter, sort, searchQuery } = state;
    
    // First apply filters
    let filteredQueries = [...queries];
    
    // Apply type filter
    switch (filter.type) {
      case HistoryFilterType.STARRED:
        filteredQueries = filteredQueries.filter(q => q.isStarred);
        break;
      case HistoryFilterType.SUCCESSFUL:
        filteredQueries = filteredQueries.filter(q => !q.error);
        break;
      case HistoryFilterType.FAILED:
        filteredQueries = filteredQueries.filter(q => !!q.error);
        break;
      case HistoryFilterType.DATABASE:
        if (filter.value) {
          filteredQueries = filteredQueries.filter(q => q.databaseId === filter.value);
        }
        break;
      case HistoryFilterType.CUSTOM:
        // Custom filtering could be implemented here
        break;
      default:
        // No filtering for ALL
        break;
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredQueries = filteredQueries.filter(q => 
        q.question.toLowerCase().includes(query) || 
        q.sql.toLowerCase().includes(query) ||
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Apply sorting
    filteredQueries.sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case HistorySortField.TIMESTAMP:
          comparison = a.timestamp - b.timestamp;
          break;
        case HistorySortField.DATABASE:
          comparison = a.databaseId.localeCompare(b.databaseId);
          break;
        case HistorySortField.QUESTION:
          comparison = a.question.localeCompare(b.question);
          break;
        default:
          comparison = 0;
      }
      
      // Apply sort direction
      return sort.direction === HistorySortDirection.ASC ? comparison : -comparison;
    });
    
    return filteredQueries;
  }, [state]);

  // Construct the context value
  const contextValue: HistoryContextType = {
    state,
    dispatch,
    loadQueries,
    saveQuery,
    updateQuery,
    deleteQuery,
    starQuery,
    clearHistory,
    getFilteredQueries
  };

  // Use React.createElement instead of JSX to avoid linter issues
  return React.createElement(
    HistoryContext.Provider, 
    { value: contextValue }, 
    children
  );
}

// Custom hook to use the history context
export function useHistory(): HistoryContextType {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
} 