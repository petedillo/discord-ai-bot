import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaClient } from './OllamaClient.js';
import { getMetrics, resetMetrics } from '../metrics/index.js';
import type { Ollama } from 'ollama';

// Helper to create a mock Ollama client
function createMockOllamaClient() {
  return {
    chat: vi.fn(),
    list: vi.fn(),
  } as unknown as Ollama;
}

describe('OllamaClient Metrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('chat() instrumentation', () => {
    it('should record duration for successful chat requests', async () => {
      const mockOllama = createMockOllamaClient();
      (mockOllama.chat as ReturnType<typeof vi.fn>).mockResolvedValue({
        message: { role: 'assistant', content: 'test response' },
        done: true,
      });

      const client = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
        client: mockOllama,
      });

      await client.chat([{ role: 'user', content: 'test' }]);

      const metrics = await getMetrics();
      expect(metrics).toContain('ollama_request_duration_seconds');
      expect(metrics).toContain('ollama_request_duration_seconds_count');
    });

    it('should record duration histogram with multiple observations', async () => {
      const mockOllama = createMockOllamaClient();
      (mockOllama.chat as ReturnType<typeof vi.fn>).mockResolvedValue({
        message: { role: 'assistant', content: 'test' },
        done: true,
      });

      const client = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
        client: mockOllama,
      });

      // Make multiple calls
      await client.chat([{ role: 'user', content: 'test1' }]);
      await client.chat([{ role: 'user', content: 'test2' }]);

      const metrics = await getMetrics();
      expect(metrics).toMatch(/ollama_request_duration_seconds_count 2/);
    });
  });

  describe('isAvailable() instrumentation', () => {
    it('should set gauge to 1 when Ollama is available', async () => {
      const mockOllama = createMockOllamaClient();
      (mockOllama.list as ReturnType<typeof vi.fn>).mockResolvedValue({ models: [] });

      const client = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
        client: mockOllama,
      });

      const available = await client.isAvailable();
      expect(available).toBe(true);

      const metrics = await getMetrics();
      expect(metrics).toContain('ollama_available 1');
    });

    it('should set gauge to 0 when Ollama is unavailable', async () => {
      const mockOllama = createMockOllamaClient();
      (mockOllama.list as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection refused'));

      const client = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
        client: mockOllama,
      });

      const available = await client.isAvailable();
      expect(available).toBe(false);

      const metrics = await getMetrics();
      expect(metrics).toContain('ollama_available 0');
    });
  });
});
