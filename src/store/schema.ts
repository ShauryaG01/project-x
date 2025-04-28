/**
 * Schema Store
 * 
 * Global state management for database schema information.
 */

import { create, StateCreator, StoreApi } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { SchemaCache } from '../types/storage';
import * as schemaStorage from '../lib/storage/schema';
import { SchemaBuilder } from '../lib/schema/builder';
import { SchemaDiff } from '../lib/schema/types';

interface SchemaMetadata {
  lastExtracted: number;
  extractionCount: number;
  isExtractionInProgress: boolean;
}

interface SchemaState {
  // Current active database ID
  currentDatabaseId: string | null;
  
  // Schema extraction metadata by database ID
  extractionMetadata: Record<string, SchemaMetadata>;
  
  // Map of builders by database ID (not persisted)
  builders: Map<string, SchemaBuilder>;
  
  // Actions
  setCurrentDatabase: (databaseId: string) => void;
  
  // Schema extraction
  startSchemaExtraction: (databaseId: string) => Promise<void>;
  completeSchemaExtraction: (databaseId: string, success: boolean) => void;
  
  // Schema access
  getSchemaBuilder: (databaseId: string) => SchemaBuilder;
  getSchemaMetadata: (databaseId: string) => SchemaMetadata | null;
  
  // Schema updates
  updateExtractionMetadata: (databaseId: string, updates: Partial<SchemaMetadata>) => void;
  recordSchemaDiff: (databaseId: string, diff: SchemaDiff) => void;
}

// Define the persisted state type
interface PersistedSchemaState {
  currentDatabaseId: string | null;
  extractionMetadata: Record<string, SchemaMetadata>;
}

// Initial metadata for a database
const createInitialMetadata = (): SchemaMetadata => ({
  lastExtracted: 0,
  extractionCount: 0,
  isExtractionInProgress: false
});

// Define the persist middleware options
type SchemaPersist = (
  config: StateCreator<SchemaState>,
  options: PersistOptions<SchemaState, PersistedSchemaState>
) => StateCreator<SchemaState>;

// Create the store with proper typing
export const useSchemaStore = create<SchemaState>()(
  (persist as SchemaPersist)(
    (set: StoreApi<SchemaState>['setState'], get: StoreApi<SchemaState>['getState']) => ({
      currentDatabaseId: null,
      extractionMetadata: {},
      builders: new Map<string, SchemaBuilder>(),
      
      // Set current database
      setCurrentDatabase: (databaseId: string) => {
        set({ currentDatabaseId: databaseId });
        
        // Ensure we have metadata for this database
        const state = get();
        if (!state.extractionMetadata[databaseId]) {
          set((state: SchemaState) => ({
            extractionMetadata: {
              ...state.extractionMetadata,
              [databaseId]: createInitialMetadata()
            }
          }));
        }
        
        // Ensure we have a builder for this database
        get().getSchemaBuilder(databaseId);
      },
      
      // Start schema extraction
      startSchemaExtraction: async (databaseId: string) => {
        const state = get();
        
        // Update metadata to indicate extraction in progress
        state.updateExtractionMetadata(databaseId, {
          isExtractionInProgress: true
        });
        
        try {
          // Get builder and perform extraction
          const builder = state.getSchemaBuilder(databaseId);
          const newSchema = await builder.extractSchema(true);
          
          // Complete extraction
          if (newSchema) {
            state.completeSchemaExtraction(databaseId, true);
            return;
          }
          
          state.completeSchemaExtraction(databaseId, false);
        } catch (error) {
          console.error('Schema extraction failed:', error);
          state.completeSchemaExtraction(databaseId, false);
        }
      },
      
      // Complete schema extraction
      completeSchemaExtraction: (databaseId: string, success: boolean) => {
        const state = get();
        const metadata = state.getSchemaMetadata(databaseId) || createInitialMetadata();
        
        state.updateExtractionMetadata(databaseId, {
          isExtractionInProgress: false,
          lastExtracted: success ? Date.now() : metadata.lastExtracted,
          extractionCount: success ? metadata.extractionCount + 1 : metadata.extractionCount
        });
      },
      
      // Get schema builder for a database
      getSchemaBuilder: (databaseId: string) => {
        const state = get();
        let builder = state.builders.get(databaseId);
        
        if (!builder) {
          // Create new builder
          builder = new SchemaBuilder(databaseId);
          
          // Initialize it
          builder.initialize().catch((error: unknown) => {
            console.error(`Failed to initialize schema builder for database ${databaseId}:`, error);
          });
          
          // Store the builder (note: this won't be persisted)
          const builders = new Map(state.builders);
          builders.set(databaseId, builder);
          set({ builders });
        }
        
        return builder;
      },
      
      // Get schema metadata for a database
      getSchemaMetadata: (databaseId: string) => {
        const state = get();
        return state.extractionMetadata[databaseId] || null;
      },
      
      // Update extraction metadata
      updateExtractionMetadata: (databaseId: string, updates: Partial<SchemaMetadata>) => {
        set((state: SchemaState) => {
          const currentMetadata = state.extractionMetadata[databaseId] || createInitialMetadata();
          
          return {
            extractionMetadata: {
              ...state.extractionMetadata,
              [databaseId]: {
                ...currentMetadata,
                ...updates
              }
            }
          };
        });
      },
      
      // Record schema diff
      recordSchemaDiff: (databaseId: string, diff: SchemaDiff) => {
        // This is a placeholder for analytics or other tracking
        console.log(`Schema diff for database ${databaseId}:`, diff);
        
        // In a real implementation, you might want to:
        // 1. Record the diff for analytics
        // 2. Notify the user of significant changes
        // 3. Update UI to highlight new schema elements
      }
    }),
    {
      name: 'schema-storage',
      
      // Only persist certain parts of the state
      partialize: (state: SchemaState): PersistedSchemaState => ({
        currentDatabaseId: state.currentDatabaseId,
        extractionMetadata: state.extractionMetadata
      })
    }
  )
);

/**
 * Get schema builder for current database
 */
export function useCurrentSchemaBuilder(): SchemaBuilder | null {
  const { currentDatabaseId, getSchemaBuilder } = useSchemaStore();
  
  if (!currentDatabaseId) {
    return null;
  }
  
  return getSchemaBuilder(currentDatabaseId);
}

/**
 * Get schema metadata for current database
 */
export function useCurrentSchemaMetadata(): SchemaMetadata | null {
  const { currentDatabaseId, getSchemaMetadata } = useSchemaStore();
  
  if (!currentDatabaseId) {
    return null;
  }
  
  return getSchemaMetadata(currentDatabaseId);
} 