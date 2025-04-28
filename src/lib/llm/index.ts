/**
 * LLM Module Entry Point
 * 
 * Provides a unified interface to interact with LLM providers
 */

import { 
  LLMProvider, 
  LLMProviderType, 
  LLMOperationInput, 
  LLMOperationResult,
  LLMOperationStatus,
  LLMOperationType,
  BaseModelParams,
  ChatMessage
} from './types';
import { LLMRouter, RouterConfig } from './router';
import { storage } from '../storage/db';

// Default router configuration
const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  primaryProvider: LLMProviderType.OPENAI,
  fallbackProviders: [LLMProviderType.ANTHROPIC, LLMProviderType.LOCAL],
  autoFallback: true,
  maxRetries: 2
};

/**
 * LLM Service
 * 
 * Provides methods to interact with LLM providers in a unified way
 */
class LLMService {
  /**
   * The router instance
   */
  private router: LLMRouter;
  
  /**
   * Whether the service has been initialized
   */
  private initialized = false;
  
  /**
   * Constructor
   */
  constructor() {
    this.router = new LLMRouter(DEFAULT_ROUTER_CONFIG);
  }
  
  /**
   * Initialize the LLM service
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Load settings from storage
    const settings = await this.loadSettings();
    
    // Update router config based on settings
    this.router.updateConfig({
      primaryProvider: settings.primaryProvider
    });
    
    // Dynamically import and register providers
    await this.registerProviders();
    
    this.initialized = true;
  }
  
  /**
   * Register available LLM providers
   * @returns Promise resolving when all providers are registered
   */
  private async registerProviders(): Promise<void> {
    try {
      // Import providers dynamically
      const [openaiModule, anthropicModule, localModule] = await Promise.all([
        import('./providers/openai').catch(() => null),
        import('./providers/anthropic').catch(() => null),
        import('./providers/webllm').catch(() => null)
      ]);
      
      // Register providers if available
      if (openaiModule) {
        this.router.registerProvider(openaiModule.openaiProvider);
      }
      
      if (anthropicModule) {
        this.router.registerProvider(anthropicModule.anthropicProvider);
      }
      
      if (localModule) {
        this.router.registerProvider(localModule.webllmProvider);
      }
    } catch (error) {
      console.error('Error registering LLM providers:', error);
    }
  }
  
  /**
   * Load LLM settings from storage
   * @returns Promise resolving to LLM settings
   */
  private async loadSettings(): Promise<any> {
    try {
      const settings = await storage.settings.get();
      return {
        primaryProvider: settings?.primaryProvider || LLMProviderType.OPENAI,
        openaiApiKey: settings?.openaiApiKey,
        anthropicApiKey: settings?.anthropicApiKey
      };
    } catch (error) {
      console.error('Error loading LLM settings:', error);
      return {
        primaryProvider: LLMProviderType.OPENAI
      };
    }
  }
  
  /**
   * Convert natural language to SQL
   * @param naturalLanguage Natural language query
   * @param schema Database schema
   * @param dbType Database type/dialect
   * @param previousQueries Previous queries for context
   * @param options Additional options
   * @returns Promise resolving to LLM operation result with SQL
   */
  async naturalLanguageToSQL(
    naturalLanguage: string,
    schema: any,
    dbType: string,
    previousQueries?: string[],
    options?: Partial<BaseModelParams>
  ): Promise<LLMOperationResult> {
    await this.ensureInitialized();
    
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: naturalLanguage
      }
    ];
    
    const input: LLMOperationInput = {
      operationType: LLMOperationType.NL_TO_SQL,
      modelParams: {
        temperature: 0.1,
        maxTokens: 1000,
        ...(options || {})
      },
      messages,
      schema,
      dbType,
      previousQueries
    };
    
    return this.router.generate(input);
  }
  
  /**
   * Explain a SQL query
   * @param sql SQL query to explain
   * @param schema Database schema
   * @param options Additional options
   * @returns Promise resolving to LLM operation result with explanation
   */
  async explainSQL(
    sql: string,
    schema: any,
    options?: Partial<BaseModelParams>
  ): Promise<LLMOperationResult> {
    await this.ensureInitialized();
    
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Explain this SQL query in simple terms:\n\n${sql}`
      }
    ];
    
    const input: LLMOperationInput = {
      operationType: LLMOperationType.EXPLAIN_SQL,
      modelParams: {
        temperature: 0.7,
        maxTokens: 1000,
        ...(options || {})
      },
      messages,
      schema
    };
    
    return this.router.generate(input);
  }
  
  /**
   * Fix a SQL query based on an error
   * @param sql Broken SQL query
   * @param error Error message
   * @param schema Database schema
   * @param dbType Database type/dialect
   * @param options Additional options
   * @returns Promise resolving to LLM operation result with fixed SQL
   */
  async fixSQL(
    sql: string,
    error: string,
    schema: any,
    dbType: string,
    options?: Partial<BaseModelParams>
  ): Promise<LLMOperationResult> {
    await this.ensureInitialized();
    
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Fix this SQL query that has the following error:\n\nQuery:\n${sql}\n\nError:\n${error}`
      }
    ];
    
    const input: LLMOperationInput = {
      operationType: LLMOperationType.FIX_SQL,
      modelParams: {
        temperature: 0.2,
        maxTokens: 1000,
        ...(options || {})
      },
      messages,
      schema,
      dbType
    };
    
    return this.router.generate(input);
  }
  
  /**
   * Analyze query results
   * @param sql SQL query that produced the results
   * @param results Query results as a formatted string
   * @param options Additional options
   * @returns Promise resolving to LLM operation result with analysis
   */
  async analyzeResults(
    sql: string,
    results: string,
    options?: Partial<BaseModelParams>
  ): Promise<LLMOperationResult> {
    await this.ensureInitialized();
    
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Analyze these SQL query results and provide insights:\n\nQuery:\n${sql}\n\nResults:\n${results}`
      }
    ];
    
    const input: LLMOperationInput = {
      operationType: LLMOperationType.ANALYZE_RESULTS,
      modelParams: {
        temperature: 0.7,
        maxTokens: 1500,
        ...(options || {})
      },
      messages
    };
    
    return this.router.generate(input);
  }
  
  /**
   * Get all available providers
   * @returns Array of all registered providers
   */
  getAllProviders(): LLMProvider[] {
    return this.router.getAllProviders();
  }
  
  /**
   * Get a provider by ID
   * @param id Provider ID
   * @returns The provider or undefined if not found
   */
  getProvider(id: LLMProviderType): LLMProvider | undefined {
    return this.router.getProvider(id);
  }
  
  /**
   * Get the active provider
   * @returns The active provider or null if none
   */
  getActiveProvider(): LLMProvider | null {
    return this.router.getActiveProvider();
  }
  
  /**
   * Update the router configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<RouterConfig>): void {
    this.router.updateConfig(config);
  }
  
  /**
   * Cancel the current generation operation
   */
  cancelGeneration(): void {
    this.router.cancelGeneration();
  }
  
  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Create and export a singleton instance
export const llmService = new LLMService(); 