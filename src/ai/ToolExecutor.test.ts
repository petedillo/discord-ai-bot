import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolExecutor } from './ToolExecutor.js';
import { OllamaClient } from './OllamaClient.js';
import { registry } from './ToolRegistry.js';
import { getMetrics, resetMetrics } from '../metrics/index.js';
import type { ITool } from './types.js';
import type { Ollama } from 'ollama';

// Helper to create a mock Ollama client
function createMockOllamaClient() {
  return {
    chat: vi.fn(),
    list: vi.fn(),
  } as unknown as Ollama;
}

describe('ToolExecutor Metrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('Tool execution metrics', () => {
    it('should track successful tool execution count', async () => {
      // Create a mock tool
      const mockTool: ITool = {
        name: 'test_tool',
        schema: {
          name: 'test_tool',
          description: 'A test tool',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        execute: vi.fn().mockResolvedValue({ success: true, result: 'test result' }),
      };
      registry.register(mockTool);

      const mockOllama = createMockOllamaClient();
      (mockOllama.chat as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [
              {
                function: {
                  name: 'test_tool',
                  arguments: {} as Record<string, unknown>,
                },
              },
            ],
          },
          done: true,
        })
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: 'Final response',
          },
          done: true,
        });

      const ollamaClient = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
        client: mockOllama,
      });

      const executor = new ToolExecutor(ollamaClient, 5);
      await executor.processMessage('test message');

      const metrics = await getMetrics();
      expect(metrics).toContain('tool_executions_total');
      expect(metrics).toMatch(/tool_executions_total\{tool="test_tool",status="success"\} 1/);
    });

    it('should track failed tool execution count', async () => {
      // Create a mock tool that fails
      const mockTool: ITool = {
        name: 'failing_tool',
        schema: {
          name: 'failing_tool',
          description: 'A failing tool',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        execute: vi.fn().mockRejectedValue(new Error('Tool failed')),
      };
      registry.register(mockTool);

      const mockOllama = createMockOllamaClient();
      (mockOllama.chat as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [
              {
                function: {
                  name: 'failing_tool',
                  arguments: {} as Record<string, unknown>,
                },
              },
            ],
          },
          done: true,
        })
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: 'Final response',
          },
          done: true,
        });

      const ollamaClient = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
        client: mockOllama,
      });

      const executor = new ToolExecutor(ollamaClient, 5);
      await executor.processMessage('test message');

      const metrics = await getMetrics();
      expect(metrics).toMatch(/tool_executions_total\{tool="failing_tool",status="error"\} 1/);
    });

    it('should track tool execution duration', async () => {
      const mockTool: ITool = {
        name: 'timed_tool',
        schema: {
          name: 'timed_tool',
          description: 'A timed tool',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        execute: vi.fn().mockResolvedValue({ success: true, result: 'done' }),
      };
      registry.register(mockTool);

      const mockOllama = createMockOllamaClient();
      (mockOllama.chat as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [
              {
                function: {
                  name: 'timed_tool',
                  arguments: {} as Record<string, unknown>,
                },
              },
            ],
          },
          done: true,
        })
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: 'Final',
          },
          done: true,
        });

      const ollamaClient = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
        client: mockOllama,
      });

      const executor = new ToolExecutor(ollamaClient, 5);
      await executor.processMessage('test');

      const metrics = await getMetrics();
      expect(metrics).toContain('tool_execution_duration_seconds');
      expect(metrics).toMatch(/tool_execution_duration_seconds_count\{tool="timed_tool"\} 1/);
    });
  });
});
