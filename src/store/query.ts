import { create } from 'zustand';
import { processQuery, QueryProcessingResult, QueryProcessingOptions } from '../lib/query/processor';

interface QueryState {
  query: string;
  result: QueryProcessingResult | null;
  isLoading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  processQuery: (options?: QueryProcessingOptions) => Promise<void>;
  clearQuery: () => void;
}

export const useQueryStore = create<QueryState>((set, get) => ({
  query: '',
  result: null,
  isLoading: false,
  error: null,
  
  setQuery: (query: string) => {
    set({ query });
  },
  
  processQuery: async (options?: QueryProcessingOptions) => {
    const { query } = get();
    
    if (!query) {
      set({ error: 'No query provided' });
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const result = await processQuery(query, options);
      set({ result, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
    }
  },
  
  clearQuery: () => {
    set({
      query: '',
      result: null,
      error: null
    });
  }
})); 