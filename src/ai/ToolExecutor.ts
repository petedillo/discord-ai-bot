// Tool Executor - handles tool call execution loop
import type { Message } from 'ollama';
import type { OllamaClient } from './OllamaClient.js';
import { registry } from './ToolRegistry.js';
import type {
  ToolExecutionRecord,
  ProcessMessageResult,
  OnToolCallCallback,
  ToolResult,
} from './types.js';

export class ToolExecutor {
  private readonly ollamaClient: OllamaClient;
  private readonly maxIterations: number;

  constructor(ollamaClient: OllamaClient, maxIterations = 5) {
    this.ollamaClient = ollamaClient;
    this.maxIterations = maxIterations;
  }

  /**
   * Process a user message, executing tools as needed
   */
  async processMessage(
    userMessage: string,
    onToolCall?: OnToolCallCallback
  ): Promise<ProcessMessageResult> {
    const messages: Message[] = [{ role: 'user', content: userMessage }];
    const tools = registry.getToolSchemas();
    const toolsUsed: ToolExecutionRecord[] = [];
    let iterations = 0;

    while (iterations < this.maxIterations) {
      iterations++;

      // Call Ollama with tools
      const response = await this.ollamaClient.chat(messages, tools);
      const toolCalls = response.message.tool_calls;

      // Check if there are tool calls to process
      if (!toolCalls || toolCalls.length === 0) {
        // No more tool calls - return final response
        return {
          response: response.message.content || 'No response generated',
          toolsUsed,
        };
      }

      // Add assistant message with tool calls to history
      messages.push(response.message);

      // Process each tool call
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = (toolCall.function.arguments ?? {}) as Record<string, unknown>;

        // Notify about tool call
        onToolCall?.(toolName, toolArgs);

        // Execute the tool
        const tool = registry.get(toolName);
        let result: ToolResult;

        if (!tool) {
          result = { success: false, error: `Unknown tool: ${toolName}` };
        } else {
          try {
            result = await tool.execute(toolArgs);
          } catch (error) {
            result = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        }

        toolsUsed.push({ name: toolName, args: toolArgs, result });

        // Add tool result to conversation
        messages.push({
          role: 'tool',
          content: JSON.stringify(result),
        });
      }
    }

    // Max iterations reached
    return {
      response: 'Maximum tool iterations reached. Please try a simpler question.',
      toolsUsed,
    };
  }
}

export default ToolExecutor;
