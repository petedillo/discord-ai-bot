// Ollama client wrapper with tool support
import { Ollama } from 'ollama';
import type { ChatResponse, Message } from 'ollama';
import type { OllamaToolDefinition } from './types.js';

export interface OllamaClientConfig {
  host: string;
  model: string;
  timeout: number;
}

export class OllamaClient {
  private readonly client: Ollama;
  private readonly model: string;
  private readonly timeout: number;

  constructor(config: OllamaClientConfig) {
    this.client = new Ollama({ host: config.host });
    this.model = config.model;
    this.timeout = config.timeout;
  }

  /**
   * Send a chat message with optional tool definitions
   */
  async chat(messages: Message[], tools: OllamaToolDefinition[] = []): Promise<ChatResponse> {
    const options: Parameters<Ollama['chat']>[0] = {
      model: this.model,
      messages,
      stream: false,
    };

    if (tools.length > 0) {
      options.tools = tools;
    }

    return await this.client.chat(options);
  }

  /**
   * Check if Ollama service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.list();
      return true;
    } catch (error) {
      console.warn('Ollama service unavailable:', error instanceof Error ? error.message : error);
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
