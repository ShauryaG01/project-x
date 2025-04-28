/**
 * OpenAI Provider Implementation
 * 
 * Implements the LLM provider interface for OpenAI API
 */

import { 
  LLMProvider, 
  LLMProviderType, 
  LLMOperationInput, 
  LLMOperationResult,
  LLMOperationStatus,
  LLMOperationType,
  ChatMessage,
  ProgressCallback,
  StreamingCallback
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// Constants
const API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';
const SUPPORTED_MODELS = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];

/**
 * OpenAI Provider class
 */
class OpenAIProvider implements LLMProvider {
  /**
   * Provider ID
   */
  id: LLMProviderType = LLMProviderType.OPENAI;
  
  /**
   * Provider name
   */
  name: string = 'OpenAI';
  
  /**
   * Whether the provider is ready to use
   */
  isReady: boolean = false;
  
  /**
   * List of supported models
   */
  supportedModels: string[] = SUPPORTED_MODELS;
  
  /**
   * API key
   */
  private apiKey: string = '';
  
  /**
   * Current model
   */
  private model: string = DEFAULT_MODEL;
  
  /**
   * Current abort controller for ongoing request
   */
  private abortController: AbortController | null = null;
  
  /**
   * Initialize the provider
   * @param config Configuration object with API key
   */
  async initialize(config?: any): Promise<void> {
    if (!config || !config.apiKey) {
      this.isReady = false;
      throw new Error('OpenAI API key is required');
    }
    
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
    
    // Validate API key with a minimal request
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API validation failed');
      }
      
      this.isReady = true;
    } catch (error) {
      this.isReady = false;
      throw error;
    }
  }
  
  /**
   * Convert ChatMessage array to OpenAI format
   */
  private convertMessages(messages: ChatMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
  
  /**
   * Generate a response for an operation
   */
  async generate(
    input: LLMOperationInput,
    onProgress?: ProgressCallback,
    onChunk?: StreamingCallback
  ): Promise<LLMOperationResult> {
    if (!this.isReady) {
      throw new Error('OpenAI provider is not initialized');
    }
    
    const operationId = uuidv4();
    
    // Set up operation cancellation
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    
    try {
      // Prepare request
      const requestData: any = {
        model: this.model,
        messages: this.convertMessages(input.messages),
        stream: Boolean(onChunk),
        temperature: input.modelParams?.temperature ?? 0.3,
        max_tokens: input.modelParams?.maxTokens
      };
      
      // Stream response if callback is provided
      if (onChunk) {
        return await this.streamResponse(operationId, requestData, signal, onProgress, onChunk);
      } else {
        return await this.generateSingle(operationId, requestData, signal, onProgress);
      }
    } catch (error: any) {
      // If aborted, return cancelled status
      if (error.name === 'AbortError') {
        return {
          id: operationId,
          status: LLMOperationStatus.CANCELLED,
          provider: this.id,
          model: this.model
        };
      }
      
      // Otherwise rethrow
      throw error;
    } finally {
      this.abortController = null;
    }
  }
  
  /**
   * Generate a single response (non-streaming)
   */
  private async generateSingle(
    operationId: string,
    requestData: any,
    signal: AbortSignal,
    onProgress?: ProgressCallback
  ): Promise<LLMOperationResult> {
    if (onProgress) {
      onProgress(0);
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestData),
      signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }
    
    if (onProgress) {
      onProgress(50);
    }
    
    const data = await response.json();
    
    if (onProgress) {
      onProgress(100);
    }
    
    return {
      id: operationId,
      status: LLMOperationStatus.COMPLETED,
      provider: this.id,
      model: this.model,
      result: data.choices[0].message.content,
      tokens: {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens
      }
    };
  }
  
  /**
   * Stream response chunks
   */
  private async streamResponse(
    operationId: string,
    requestData: any,
    signal: AbortSignal,
    onProgress?: ProgressCallback,
    onChunk?: StreamingCallback
  ): Promise<LLMOperationResult> {
    if (onProgress) {
      onProgress(0);
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestData),
      signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let accumulatedContent = '';
    let promptTokens = 0;
    let completionTokens = 0;
    
    try {
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk
          .split('\n')
          .filter(line => line.trim().startsWith('data:') && !line.includes('[DONE]'));
        
        for (const line of lines) {
          const jsonStr = line.replace(/^data:\s+/, '').trim();
          if (jsonStr) {
            try {
              const json = JSON.parse(jsonStr);
              const content = json.choices[0]?.delta?.content || '';
              
              if (content) {
                accumulatedContent += content;
                completionTokens += 1; // Approximation
                
                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (e) {
              console.error('Error parsing stream chunk:', e);
            }
          }
        }
        
        if (onProgress) {
          // Approximate progress based on received content
          onProgress(Math.min(99, accumulatedContent.length / 10));
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    if (onProgress) {
      onProgress(100);
    }
    
    // Approximate token usage
    promptTokens = Math.round(JSON.stringify(requestData.messages).length / 4);
    completionTokens = Math.round(accumulatedContent.length / 4);
    
    return {
      id: operationId,
      status: LLMOperationStatus.COMPLETED,
      provider: this.id,
      model: this.model,
      result: accumulatedContent,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens
      }
    };
  }
  
  /**
   * Cancel the current generation
   */
  cancelGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Export singleton instance
export const openaiProvider = new OpenAIProvider(); 