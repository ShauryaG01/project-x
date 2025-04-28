import { useCallback } from 'react';
import { useQueryStore } from '../store/query';
import { QueryProcessingOptions } from '../lib/query/processor';

/**
 * Hook for processing natural language queries
 * @returns Query processing functions and state
 */
export function useQueryProcessor() {
  const {
    query,
    result,
    isLoading,
    error,
    setQuery,
    processQuery,
    clearQuery
  } = useQueryStore();

  /**
   * Process the current query
   */
  const handleProcess = useCallback(async (options?: QueryProcessingOptions) => {
    await processQuery(options);
  }, [processQuery]);

  /**
   * Update the query
   */
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, [setQuery]);

  /**
   * Clear the current query and results
   */
  const handleClear = useCallback(() => {
    clearQuery();
  }, [clearQuery]);

  return {
    query,
    result,
    isLoading,
    error,
    handleProcess,
    handleQueryChange,
    handleClear
  };
} 