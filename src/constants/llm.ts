/**
 * LLM Constants
 * 
 * Defines constants for LLM-related functionality
 */

import { LLMProviderType } from '../lib/llm/types';

/**
 * Default OpenAI models by operation
 */
export const DEFAULT_OPENAI_MODELS = {
  default: 'gpt-4o',
  fallback: 'gpt-3.5-turbo'
};

/**
 * Default Anthropic models by operation
 */
export const DEFAULT_ANTHROPIC_MODELS = {
  default: 'claude-3-sonnet-20240229',
  fallback: 'claude-3-haiku-20240307'
};

/**
 * Default WebLLM models
 */
export const DEFAULT_WEBLLM_MODELS = {
  default: 'Phi-2',
  fallback: 'TinyLlama-1.1B'
};

/**
 * Default model parameters
 */
export const DEFAULT_MODEL_PARAMS = {
  temperature: 0.3,
  maxTokens: 2000
};

/**
 * Default SQL generation parameters
 */
export const DEFAULT_SQL_GENERATION_PARAMS = {
  temperature: 0.1,
  maxTokens: 1000
};

/**
 * Default SQL explanation parameters
 */
export const DEFAULT_SQL_EXPLANATION_PARAMS = {
  temperature: 0.5,
  maxTokens: 2000
};

/**
 * Default result analysis parameters
 */
export const DEFAULT_ANALYSIS_PARAMS = {
  temperature: 0.7,
  maxTokens: 1500
};

/**
 * Provider display names
 */
export const PROVIDER_DISPLAY_NAMES = {
  [LLMProviderType.OPENAI]: 'OpenAI',
  [LLMProviderType.ANTHROPIC]: 'Anthropic Claude',
  [LLMProviderType.LOCAL]: 'Local (WebLLM)'
};

/**
 * Provider descriptions
 */
export const PROVIDER_DESCRIPTIONS = {
  [LLMProviderType.OPENAI]: 'Uses OpenAI\'s GPT models (requires API key)',
  [LLMProviderType.ANTHROPIC]: 'Uses Anthropic\'s Claude models (requires API key)',
  [LLMProviderType.LOCAL]: 'Runs models locally in your browser (no API key required, but slower and less capable)'
};

/**
 * Token limits by model
 */
export const MODEL_TOKEN_LIMITS = {
  'gpt-4o': 128000,
  'gpt-4-turbo': 128000,
  'gpt-3.5-turbo': 16000,
  'claude-3-opus-20240229': 200000,
  'claude-3-sonnet-20240229': 180000,
  'claude-3-haiku-20240307': 200000,
  'claude-2.1': 100000,
  'Phi-2': 2048,
  'TinyLlama-1.1B': 2048,
  'RedPajama-INCITE-Chat-3B-v1': 2048
};

/**
 * Default context size limits (in characters) for different entities
 */
export const CONTEXT_SIZE_LIMITS = {
  schema: 10000,
  query: 1000,
  results: 5000,
  history: 3000
}; 