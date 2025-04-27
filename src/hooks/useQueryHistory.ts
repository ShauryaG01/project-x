/**
 * useQueryHistory Hook
 * 
 * A convenient hook for interacting with the query history
 * that wraps the history store functionality.
 */

import { useEffect } from 'react';
import { useHistory } from '../store/history';
import { StoredQuery } from '../types/storage';
import { HistoryFilterType, HistorySortField, HistorySortDirection } from '../types/history';

export function useQueryHistory() {
  const { 
    state, 
    dispatch, 
    loadQueries, 
    saveQuery, 
    updateQuery, 
    deleteQuery, 
    starQuery, 
    clearHistory,
    getFilteredQueries 
  } = useHistory();

  // Load queries on first render
  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  // Convenient methods for managing history
  const history = {
    // State getters
    queries: state.queries,
    loading: state.loading,
    error: state.error,
    filter: state.filter,
    sort: state.sort,
    searchQuery: state.searchQuery,
    selectedQueryId: state.selectedQueryId,
    selectedQuery: state.selectedQueryId 
      ? state.queries.find(q => q.id === state.selectedQueryId) || null 
      : null,
    filteredQueries: getFilteredQueries(),
    
    // Query methods
    add: saveQuery,
    update: updateQuery,
    delete: deleteQuery,
    star: starQuery,
    clearAll: clearHistory,
    reload: loadQueries,
    
    // Selection methods
    select: (id: string | null) => {
      dispatch({ type: 'SELECT_QUERY', payload: id });
    },
    
    // Filter methods
    setFilter: (type: HistoryFilterType, value?: string, label?: string) => {
      dispatch({ 
        type: 'SET_FILTER', 
        payload: { type, value, label }
      });
    },
    
    // Search methods
    setSearchQuery: (query: string) => {
      dispatch({ type: 'SET_SEARCH', payload: query });
    },
    
    // Sort methods
    setSort: (field: HistorySortField, direction: HistorySortDirection) => {
      dispatch({ 
        type: 'SET_SORT', 
        payload: { field, direction }
      });
    },
    
    // Utility methods
    getUniqueDatabases: (): { id: string, count: number }[] => {
      const databaseCounts = state.queries.reduce((acc, query) => {
        acc[query.databaseId] = (acc[query.databaseId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(databaseCounts).map(([id, count]) => ({ id, count }));
    },
    
    getTags: (): { tag: string, count: number }[] => {
      const tagCounts: Record<string, number> = {};
      
      state.queries.forEach(query => {
        if (query.tags) {
          query.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      return Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }));
    },
    
    getRecentQueries: (limit = 5): StoredQuery[] => {
      return [...state.queries]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    },
    
    getStarredQueries: (): StoredQuery[] => {
      return state.queries.filter(q => q.isStarred);
    }
  };

  return history;
} 