/**
 * Adapter registry for managing database adapters
 * Provides functionality to register, retrieve, and select appropriate adapters
 */

import { DatabaseAdapter } from './adapter';

class AdapterRegistry {
  private adapters: Map<string, DatabaseAdapter> = new Map();
  private activeAdapter: DatabaseAdapter | null = null;

  /**
   * Register a new adapter in the registry
   * @param adapter The adapter instance to register
   */
  register(adapter: DatabaseAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  /**
   * Get an adapter by its ID
   * @param id The adapter ID
   * @returns The adapter instance or undefined if not found
   */
  getAdapter(id: string): DatabaseAdapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Get all registered adapters
   * @returns Array of all registered adapters
   */
  getAllAdapters(): DatabaseAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Detect which adapter should be used for the current page
   * @returns Promise resolving to the most compatible adapter or null if none found
   */
  async detectAdapter(): Promise<DatabaseAdapter | null> {
    if (this.adapters.size === 0) {
      return null;
    }

    const detectionResults = await Promise.all(
      this.getAllAdapters().map(async (adapter) => {
        try {
          const result = await adapter.detect();
          return { adapter, result };
        } catch (error) {
          console.error(`Error detecting adapter ${adapter.id}:`, error);
          return { adapter, result: { detected: false, confidence: 0 } };
        }
      })
    );

    // Find the adapter with the highest confidence
    const bestMatch = detectionResults.reduce(
      (best, current) => {
        if (!current.result.detected) {
          return best;
        }
        
        if (!best || current.result.confidence > best.result.confidence) {
          return current;
        }
        
        return best;
      },
      null as { adapter: DatabaseAdapter; result: { detected: boolean; confidence: number } } | null
    );

    this.activeAdapter = bestMatch?.adapter || null;
    return this.activeAdapter;
  }

  /**
   * Get the currently active adapter
   * @returns The current active adapter or null if none
   */
  getActiveAdapter(): DatabaseAdapter | null {
    return this.activeAdapter;
  }

  /**
   * Set the active adapter manually
   * @param adapterId The ID of the adapter to set as active
   * @returns True if successful, false if adapter not found
   */
  setActiveAdapter(adapterId: string): boolean {
    const adapter = this.getAdapter(adapterId);
    if (adapter) {
      this.activeAdapter = adapter;
      return true;
    }
    return false;
  }
}

// Create and export a singleton instance
export const adapterRegistry = new AdapterRegistry(); 