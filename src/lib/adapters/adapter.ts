/**
 * Base adapter interface for database tool integrations
 * Defines the contract that all specific database adapters must implement
 */

import { AdapterConfig, DetectionResult } from '../../types/adapters';

export interface DatabaseAdapter {
  /**
   * Unique identifier for this adapter
   */
  id: string;
  
  /**
   * Display name for the adapter
   */
  displayName: string;
  
  /**
   * Configuration options for the adapter
   */
  config: AdapterConfig;
  
  /**
   * Detects if the current page contains the relevant database UI
   * @returns Promise resolving to detection result with confidence score
   */
  detect(): Promise<DetectionResult>;
  
  /**
   * Injects required scripts/styles into the page for adapter functionality
   */
  initialize(): Promise<void>;
  
  /**
   * Extracts schema information from the database UI
   */
  extractSchema(): Promise<any>;
  
  /**
   * Verifies if the adapter is compatible with the current page
   */
  isCompatible(): Promise<boolean>;
} 