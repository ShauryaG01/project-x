/**
 * LLM Provider Router
 * 
 * Routes LLM requests to the appropriate provider based on configuration and availability
 */

import { 
  LLMProvider, 
  LLMProviderType, 
  LLMOperationInput, 
  LLMOperationResult,
  LLMOperationStatus,
  LLMOperationType
} from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Router configuration options
 */
export interface RouterConfig {
  /**
   * Primary provider to use
   */
  primaryProvider: LLMProviderType;
  
  /**
   * Fallback providers in order of preference
   */
  fallbackProviders?: LLMProviderType[];
  
  /**
   * Whether to use automatic fallback if primary provider fails
   */
  autoFallback?: boolean;
  
  /**
   * Maximum retry attempts
   */
  maxRetries?: number;
}

/**
 * LLM Provider Router
 * 
 * Manages multiple LLM providers and routes requests to the appropriate one
 */
export class LLMRouter {
  /**
   * Map of registered providers
   */
  private providers: Map<LLMProviderType, LLMProvider> = new Map();
  
  /**
   * Router configuration
   */
  private config: RouterConfig;
  
  /**
   * Currently active provider
   */
  private activeProvider: LLMProvider | null = null;
  
  /**
   * Constructor
   * @param config Router configuration
   */
  constructor(config: RouterConfig) {
    this.config = {
      primaryProvider: config.primaryProvider,
      fallbackProviders: config.fallbackProviders || [],
      autoFallback: config.autoFallback !== undefined ? config.autoFallback : true,
      maxRetries: config.maxRetries || 2
    };
  }
  
  /**
   * Register a provider with the router
   * @param provider Provider to register
   */
  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }
  
  /**
   * Get a registered provider by ID
   * @param id Provider ID
   * @returns The provider or undefined if not found
   */
  getProvider(id: LLMProviderType): LLMProvider | undefined {
    return this.providers.get(id);
  }
  
  /**
   * Get all registered providers
   * @returns Array of all registered providers
   */
  getAllProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Get the currently active provider
   * @returns The active provider or null if none
   */
  getActiveProvider(): LLMProvider | null {
    return this.activeProvider;
  }
  
  /**
   * Update router configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<RouterConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
  
  /**
   * Get the most suitable provider based on configuration and availability
   * @returns Promise resolving to the most suitable provider or null if none available
   */
  async getSuitableProvider(): Promise<LLMProvider | null> {
    // Try primary provider first
    const primaryProvider = this.providers.get(this.config.primaryProvider);
    if (primaryProvider) {
      const isReady = primaryProvider.isReady;
      if (isReady) {
        this.activeProvider = primaryProvider;
        return primaryProvider;
      }
    }
    
    // If primary provider not available, try fallbacks
    if (this.config.autoFallback && this.config.fallbackProviders) {
      for (const fallbackId of this.config.fallbackProviders) {
        const fallbackProvider = this.providers.get(fallbackId);
        if (fallbackProvider) {
          const isReady = fallbackProvider.isReady;
          if (isReady) {
            this.activeProvider = fallbackProvider;
            return fallbackProvider;
          }
        }
      }
    }
    
    // No suitable provider found
    this.activeProvider = null;
    return null;
  }
  
  /**
   * Generate a response using the most suitable provider
   * @param input Operation input
   * @returns Promise resolving to operation result
   */
  async generate(input: LLMOperationInput): Promise<LLMOperationResult> {
    let provider = await this.getSuitableProvider();
    
    if (!provider) {
      return {
        id: uuidv4(),
        status: LLMOperationStatus.FAILED,
        error: 'No suitable LLM provider available',
        provider: this.config.primaryProvider,
        model: 'unknown'
      };
    }
    
    let retries = 0;
    let lastError: any = null;
    
    while (retries <= this.config.maxRetries!) {
      try {
        const result = await provider.generate(input);
        return result;
      } catch (error) {
        lastError = error;
        retries++;
        
        // If we have retries left and auto fallback is enabled, try fallbacks
        if (retries <= this.config.maxRetries! && this.config.autoFallback) {
          const nextProvider = await this.getNextFallbackProvider(provider.id);
          if (nextProvider) {
            provider = nextProvider;
            continue;
          }
        }
        
        // No more retries or fallbacks
        break;
      }
    }
    
    // All attempts failed
    return {
      id: uuidv4(),
      status: LLMOperationStatus.FAILED,
      error: lastError ? lastError.message || 'LLM generation failed' : 'LLM generation failed',
      provider: provider.id,
      model: provider.supportedModels[0] || 'unknown'
    };
  }
  
  /**
   * Cancel the current generation operation
   */
  cancelGeneration(): void {
    if (this.activeProvider) {
      this.activeProvider.cancelGeneration();
    }
  }
  
  /**
   * Get the next fallback provider after the specified provider
   * @param currentId Current provider ID
   * @returns Promise resolving to the next fallback provider or null if none available
   */
  private async getNextFallbackProvider(currentId: LLMProviderType): Promise<LLMProvider | null> {
    if (!this.config.fallbackProviders || this.config.fallbackProviders.length === 0) {
      return null;
    }
    
    // Find current provider in fallback list
    const currentIndex = this.config.fallbackProviders.indexOf(currentId);
    const startIndex = currentIndex === -1 ? 0 : currentIndex + 1;
    
    // Try each fallback provider in order
    for (let i = startIndex; i < this.config.fallbackProviders.length; i++) {
      const fallbackId = this.config.fallbackProviders[i];
      const fallbackProvider = this.providers.get(fallbackId);
      
      if (fallbackProvider) {
        const isReady = fallbackProvider.isReady;
        if (isReady) {
          this.activeProvider = fallbackProvider;
          return fallbackProvider;
        }
      }
    }
    
    // If we started from a non-zero index, also check providers before current
    if (startIndex > 0) {
      for (let i = 0; i < startIndex; i++) {
        const fallbackId = this.config.fallbackProviders[i];
        const fallbackProvider = this.providers.get(fallbackId);
        
        if (fallbackProvider) {
          const isReady = fallbackProvider.isReady;
          if (isReady) {
            this.activeProvider = fallbackProvider;
            return fallbackProvider;
          }
        }
      }
    }
    
    // Check primary provider if it's not the current one
    if (this.config.primaryProvider !== currentId) {
      const primaryProvider = this.providers.get(this.config.primaryProvider);
      if (primaryProvider) {
        const isReady = primaryProvider.isReady;
        if (isReady) {
          this.activeProvider = primaryProvider;
          return primaryProvider;
        }
      }
    }
    
    // No suitable fallback found
    return null;
  }
} 