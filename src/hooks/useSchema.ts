/**
 * Schema Management Hook
 * 
 * React hook for managing database schema operations and state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SchemaBuilder } from '../lib/schema/builder';
import * as schemaStorage from '../lib/storage/schema';
import { compressSchema, generateSchemaDescription } from '../lib/schema/compressor';
import { SchemaCache } from '../types/storage';
import { CompressedSchema, SchemaExtractionOptions, SchemaCompressionOptions } from '../lib/schema/types';

interface SchemaState {
  schema: SchemaCache | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: number | null;
}

interface SchemaHook {
  schema: SchemaCache | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: number | null;
  refreshSchema: (options?: Partial<SchemaExtractionOptions>) => Promise<SchemaCache | null>;
  getCompressedSchema: (referencedTables?: string[], options?: Partial<SchemaCompressionOptions>) => CompressedSchema;
  getSchemaDescription: (referencedTables?: string[]) => string;
  getSchemaSQLStatements: () => string;
  learnFromQuery: (sql: string, resultColumns?: string[], resultData?: any[][]) => Promise<void>;
  hasSchema: boolean;
}

/**
 * Hook for managing schema operations
 */
export function useSchema(databaseId: string): SchemaHook {
  const [state, setState] = useState<SchemaState>({
    schema: null,
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  
  // Create and memoize the SchemaBuilder instance
  const schemaBuilder = useMemo(() => new SchemaBuilder(databaseId), [databaseId]);
  
  // Load initial schema
  useEffect(() => {
    let isMounted = true;
    
    const loadSchema = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Initialize the schema builder
        await schemaBuilder.initialize();
        
        // Get current schema
        const schema = schemaBuilder.getCurrentSchema();
        
        if (isMounted) {
          setState({
            schema,
            isLoading: false,
            error: null,
            lastUpdated: schema?.lastUpdated || null
          });
        }
      } catch (error) {
        if (isMounted) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: error instanceof Error ? error : new Error('Failed to load schema')
          }));
        }
      }
    };
    
    loadSchema();
    
    return () => {
      isMounted = false;
    };
  }, [databaseId, schemaBuilder]);
  
  /**
   * Refresh schema from current page
   */
  const refreshSchema = useCallback(async (
    options?: Partial<SchemaExtractionOptions>
  ): Promise<SchemaCache | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Extract schema
      const schema = await schemaBuilder.extractSchema(true);
      
      setState({
        schema,
        isLoading: false,
        error: null,
        lastUpdated: schema?.lastUpdated || null
      });
      
      return schema;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('Failed to refresh schema')
      }));
      return null;
    }
  }, [schemaBuilder]);
  
  /**
   * Get compressed schema for LLM context
   */
  const getCompressedSchema = useCallback((
    referencedTables: string[] = [],
    options?: Partial<SchemaCompressionOptions>
  ): CompressedSchema => {
    if (!state.schema) {
      return { tables: [], relationships: [] };
    }
    
    return compressSchema(state.schema, referencedTables, options);
  }, [state.schema]);
  
  /**
   * Get schema description for LLM prompt
   */
  const getSchemaDescription = useCallback((referencedTables: string[] = []): string => {
    const compressed = getCompressedSchema(referencedTables);
    return generateSchemaDescription(compressed);
  }, [getCompressedSchema]);
  
  /**
   * Get schema as SQL statements
   */
  const getSchemaSQLStatements = useCallback((): string => {
    const compressed = getCompressedSchema();
    
    // We'll use the compressor's schemaToSQLStatements function directly
    // This isn't ideal from an import perspective, but for simplicity we'll do it this way
    return require('../lib/schema/compressor').schemaToSQLStatements(compressed);
  }, [getCompressedSchema]);
  
  /**
   * Learn schema information from query execution
   */
  const learnFromQuery = useCallback(async (
    sql: string,
    resultColumns?: string[],
    resultData?: any[][]
  ): Promise<void> => {
    try {
      await schemaBuilder.learnFromQuery(sql, resultColumns, resultData);
      
      // Update state with new schema
      const schema = schemaBuilder.getCurrentSchema();
      setState({
        schema,
        isLoading: false,
        error: null,
        lastUpdated: schema?.lastUpdated || null
      });
    } catch (error) {
      console.error('Failed to learn from query:', error);
      // Don't update state on learning errors
    }
  }, [schemaBuilder]);
  
  return {
    schema: state.schema,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refreshSchema,
    getCompressedSchema,
    getSchemaDescription,
    getSchemaSQLStatements,
    learnFromQuery,
    hasSchema: !!state.schema
  };
} 