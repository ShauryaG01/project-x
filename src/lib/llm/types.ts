/**
 * LLM Module Types
 * 
 * Core type definitions for LLM providers and operations
 */

/**
 * Enum for LLM provider types
 */
export enum LLMProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  LOCAL = 'local',
}

/**
 * Enum for LLM operation types
 */
export enum LLMOperationType {
  NL_TO_SQL = 'nl_to_sql',
  EXPLAIN_SQL = 'explain_sql',
  FIX_SQL = 'fix_sql',
  ANALYZE_RESULTS = 'analyze_results',
}

/**
 * Enum for LLM operation status
 */
export enum LLMOperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Message role in a chat conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * Base model parameters
 */
export interface BaseModelParams {
  temperature: number;
  maxTokens: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

/**
 * OpenAI specific model parameters
 */
export interface OpenAIModelParams extends BaseModelParams {
  model: string;
  streaming?: boolean;
}

/**
 * Anthropic specific model parameters
 */
export interface AnthropicModelParams extends BaseModelParams {
  model: string;
  streaming?: boolean;
}

/**
 * Local model (WebLLM) specific parameters
 */
export interface LocalModelParams extends BaseModelParams {
  model: string;
}

/**
 * Input for LLM operations
 */
export interface LLMOperationInput {
  operationType: LLMOperationType;
  modelParams: Partial<BaseModelParams>;
  messages: ChatMessage[];
  schema?: any;
  dbType?: string;
  previousQueries?: string[];
}

/**
 * Result of LLM operations
 */
export interface LLMOperationResult {
  id: string;
  status: LLMOperationStatus;
  provider: LLMProviderType;
  model: string;
  query?: string;
  result?: string;
  error?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  timing?: {
    start: number;
    end: number;
    duration: number;
  };
}

/**
 * Event callback for streaming responses
 */
export type StreamingCallback = (chunk: string) => void;

/**
 * Progress callback for operations
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Interface for LLM providers
 */
export interface LLMProvider {
  /**
   * Provider ID
   */
  id: LLMProviderType;
  
  /**
   * Provider name
   */
  name: string;
  
  /**
   * Whether the provider is ready to use
   */
  isReady: boolean;
  
  /**
   * List of supported models
   */
  supportedModels: string[];
  
  /**
   * Initialize the provider
   */
  initialize(config?: any): Promise<void>;
  
  /**
   * Generate a response for an operation
   */
  generate(
    input: LLMOperationInput,
    onProgress?: ProgressCallback,
    onChunk?: StreamingCallback
  ): Promise<LLMOperationResult>;
  
  /**
   * Cancel the current generation
   */
  cancelGeneration(): void;
} 