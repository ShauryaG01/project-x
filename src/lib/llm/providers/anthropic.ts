/**
 * Anthropic Provider Implementation
 * 
 * Implements the LLM provider interface for Anthropic API
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
const API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-opus-20240229';
const SUPPORTED_MODELS = [
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'claude-2.1'
];

/**
 * Anthropic Provider class
 */
class AnthropicProvider implements LLMProvider {
  /**
   * Provider ID
   */
  id: LLMProviderType = LLMProviderType.ANTHROPIC;
  
  /**
   * Provider name
   */
  name: string = 'Anthropic';
  
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
      throw new Error('Anthropic API key is required');
    }
    
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
    
    // Validate API key with a minimal request
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Hello' }]
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
   * Convert ChatMessage array to Anthropic format
   * Anthropic only supports 'user' and 'assistant' roles
   */
  private convertMessages(messages: ChatMessage[]): any[] {
    // Filter out system messages and convert to Anthropic format
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }
  
  /**
   * Extract system message from messages
   */
  private extractSystemMessage(messages: ChatMessage[]): string | undefined {
    const systemMessage = messages.find(msg => msg.role === 'system');
    return systemMessage?.content;
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
      throw new Error('Anthropic provider is not initialized');
    }
    
    const operationId = uuidv4();
    
    // Set up operation cancellation
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    
    try {
      // Extract system message if present
      const systemMessage = this.extractSystemMessage(input.messages);
      
      // Prepare request
      const requestData: any = {
        model: this.model,
        messages: this.convertMessages(input.messages),
        system: systemMessage,
        max_tokens: input.modelParams?.maxTokens || 4000,
        temperature: input.modelParams?.temperature ?? 0.3,
        stream: Boolean(onChunk)
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
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestData),
      signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API request failed');
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
      result: data.content[0].text,
      tokens: {
        prompt: data.usage?.input_tokens || 0,
        completion: data.usage?.output_tokens || 0,
        total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
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
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestData),
      signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API request failed');
    }
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let accumulatedContent = '';
    let inputTokens = 0;
    let outputTokens = 0;
    
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
              
              // Check for token usage updates
              if (json.usage) {
                inputTokens = json.usage.input_tokens || 0;
                outputTokens = json.usage.output_tokens || 0;
              }
              
              // Check for content delta
              if (json.delta?.text) {
                const contentDelta = json.delta.text;
                accumulatedContent += contentDelta;
                
                if (onChunk) {
                  onChunk(contentDelta);
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
    
    // If no token count was provided, approximate
    if (inputTokens === 0) {
      inputTokens = Math.round(JSON.stringify(requestData.messages).length / 4);
    }
    
    if (outputTokens === 0) {
      outputTokens = Math.round(accumulatedContent.length / 4);
    }
    
    return {
      id: operationId,
      status: LLMOperationStatus.COMPLETED,
      provider: this.id,
      model: this.model,
      result: accumulatedContent,
      tokens: {
        prompt: inputTokens,
        completion: outputTokens,
        total: inputTokens + outputTokens
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
export const anthropicProvider = new AnthropicProvider(); 