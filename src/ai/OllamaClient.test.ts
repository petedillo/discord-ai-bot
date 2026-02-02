import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaClient } from './OllamaClient.js';
import { getMetrics, resetMetrics } from '../metrics/index.js';

describe('OllamaClient Metrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('chat() instrumentation', () => {
    it('should record duration for successful chat requests', async () => {
      const client = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
      });

      // Mock the internal Ollama client to avoid real API calls
      const mockChat = vi.spyOn((client as unknown as { client: { chat: unknown } }).client, 'chat');
      mockChat.mockResolvedValue({
        message: { role: 'assistant', content: 'test response' },
        done: true,
      });

      await client.chat([{ role: 'user', content: 'test' }]);

      const metrics = await getMetrics();
      expect(metrics).toContain('ollama_request_duration_seconds');
      expect(metrics).toContain('ollama_request_duration_seconds_count');
    });

    it('should record duration histogram with multiple observations', async () => {
      const client = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
      });

      const mockChat = vi.spyOn((client as unknown as { client: { chat: unknown } }).client, 'chat');
      mockChat.mockResolvedValue({
        message: { role: 'assistant', content: 'test' },
        done: true,
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
      const client = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
      });

      // Mock list to succeed
      const mockList = vi.spyOn((client as unknown as { client: { list: unknown } }).client, 'list');
      mockList.mockResolvedValue({ models: [] });

      const available = await client.isAvailable();
      expect(available).toBe(true);

      const metrics = await getMetrics();
      expect(metrics).toContain('ollama_available 1');
    });

    it('should set gauge to 0 when Ollama is unavailable', async () => {
      const client = new OllamaClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        timeout: 30000,
      });

      // Mock list to fail
      const mockList = vi.spyOn((client as unknown as { client: { list: unknown } }).client, 'list');
      mockList.mockRejectedValue(new Error('Connection refused'));

      const available = await client.isAvailable();
      expect(available).toBe(false);

      const metrics = await getMetrics();
      expect(metrics).toContain('ollama_available 0');
    });
  });
});
