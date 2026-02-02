// Ollama client wrapper with tool support
import { Ollama } from 'ollama';
import type { ChatResponse, Message } from 'ollama';
import type { OllamaToolDefinition } from './types.js';
import { ollamaAvailable, ollamaRequestDuration } from '../metrics/index.js';

export interface OllamaClientConfig {
  host: string;
  model: string;
  timeout: number;
  client?: Ollama;  // Optional for dependency injection in tests
}

export class OllamaClient {
  private readonly client: Ollama;
  private readonly model: string;
  private readonly timeout: number;

  constructor(config: OllamaClientConfig) {
    this.client = config.client ?? new Ollama({ host: config.host });
    this.model = config.model;
    this.timeout = config.timeout;
  }

  /**
   * Send a chat message with optional tool definitions
   */
  async chat(messages: Message[], tools: OllamaToolDefinition[] = []): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      const options: Parameters<Ollama['chat']>[0] = {
        model: this.model,
        messages,
        stream: false,
      };

      if (tools.length > 0) {
        options.tools = tools;
      }

      const response = await this.client.chat(options);
      
      // Record successful request duration
      const duration = (Date.now() - startTime) / 1000;
      ollamaRequestDuration.observe(duration);
      
      return response;
    } catch (error) {
      // Record failed request duration
      const duration = (Date.now() - startTime) / 1000;
      ollamaRequestDuration.observe(duration);
      throw error;
    }
  }

  /**
   * Check if Ollama service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.list();
      ollamaAvailable.set(1);
      return true;
    } catch (error) {
      console.warn('Ollama service unavailable:', error instanceof Error ? error.message : error);
      ollamaAvailable.set(0);
      return false;
    }
  }

  /**
   * Get the configured model name
   */
  getModel(): string {
    return this.model;
  }
}

export default OllamaClient;
