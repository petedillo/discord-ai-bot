// Tool Registry - manages tool definitions and metadata
import type { ITool, OllamaToolDefinition, ToolDescription } from './types.js';
import { logger } from '../utils/index.js';

export class ToolRegistry {
  private readonly tools = new Map<string, ITool>();

  /**
   * Register a tool
   */
  register(tool: ITool): void {
    if (!tool.name || !tool.schema || typeof tool.execute !== 'function') {
      throw new Error('Invalid tool: missing name, schema, or execute method');
    }
    this.tools.set(tool.name, tool);
    logger.debug(`Registered tool: ${tool.name}`);
  }

  /**
   * Get a tool by name
   */
  get(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tool schemas for Ollama API
   */
  getToolSchemas(): OllamaToolDefinition[] {
    return Array.from(this.tools.values()).map((tool) => ({
      type: 'function' as const,
      function: tool.schema,
    }));
  }

  /**
   * Get list of all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tool descriptions for display
   */
  getToolDescriptions(): ToolDescription[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.schema.description,
      parameters: tool.schema.parameters,
    }));
  }

  /**
   * Get number of registered tools
   */
  size(): number {
    return this.tools.size;
  }
}

// Singleton instance
export const registry = new ToolRegistry();

export default ToolRegistry;
