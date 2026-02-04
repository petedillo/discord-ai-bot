import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SummarizerClient } from './SummarizerClient.js';
import type { Ollama } from 'ollama';

// Helper to create a mock Ollama client
function createMockOllamaClient() {
  return {
    chat: vi.fn(),
    list: vi.fn(),
  } as unknown as Ollama;
}

describe('SummarizerClient', () => {
  let mockOllama: ReturnType<typeof createMockOllamaClient>;
  let client: SummarizerClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOllama = createMockOllamaClient();
    client = new SummarizerClient({
      host: 'http://localhost:11434',
      model: 'qwen2.5:3b',
      client: mockOllama,
    });
  });

  describe('constructor', () => {
    it('should create client with provided config', () => {
      expect(client).toBeInstanceOf(SummarizerClient);
    });

    it('should use default timeout if not provided', () => {
      const clientWithDefaults = new SummarizerClient({
        host: 'http://localhost:11434',
        model: 'test-model',
        client: mockOllama,
      });
      expect(clientWithDefaults).toBeInstanceOf(SummarizerClient);
    });
  });

  describe('summarize', () => {
    it('should return summary from Ollama response', async () => {
      (mockOllama.chat as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        message: {
          content: 'Here are your 3 downloads: Movie1 (50%), Movie2 (100%), Movie3 (25%)',
        },
      });

      const data = {
        success: true,
        action: 'list',
        count: 3,
        torrents: [
          { name: 'Movie1', progress: 50 },
          { name: 'Movie2', progress: 100 },
          { name: 'Movie3', progress: 25 },
        ],
      };

      const result = await client.summarize(data, 'show my downloads');

      expect(result).toBe('Here are your 3 downloads: Movie1 (50%), Movie2 (100%), Movie3 (25%)');
      expect(mockOllama.chat).toHaveBeenCalledTimes(1);
      expect(mockOllama.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'qwen2.5:3b',
          stream: false,
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });

    it('should include user question in prompt', async () => {
      (mockOllama.chat as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        message: { content: 'Summary result' },
      });

      await client.summarize({ data: 'test' }, 'what is downloading?');

      const chatCall = (mockOllama.chat as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      const userMessage = chatCall.messages.find((m: { role: string }) => m.role === 'user') as { content: string };
      expect(userMessage.content).toContain('what is downloading?');
    });

    it('should include JSON data in prompt', async () => {
      (mockOllama.chat as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        message: { content: 'Summary' },
      });

      const testData = { torrents: [{ name: 'Test Movie' }] };
      await client.summarize(testData, 'query');

      const chatCall = (mockOllama.chat as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      const userMessage = chatCall.messages.find((m: { role: string }) => m.role === 'user') as { content: string };
      expect(userMessage.content).toContain('Test Movie');
    });

    it('should return fallback on empty response', async () => {
      (mockOllama.chat as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        message: { content: '' },
      });

      const result = await client.summarize({ test: true }, 'query');

      expect(result).toBe('Unable to summarize data.');
    });

    it('should return fallback JSON on error', async () => {
      (mockOllama.chat as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Connection failed')
      );

      const testData = { error: 'test' };
      const result = await client.summarize(testData, 'query');

      expect(result).toBe('Data: {"error":"test"}');
    });
  });

  describe('isAvailable', () => {
    it('should return true when model is available', async () => {
      (mockOllama.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        models: [{ name: 'qwen2.5:3b' }, { name: 'llama3:8b' }],
      });

      const result = await client.isAvailable();

      expect(result).toBe(true);
    });

    it('should return true when model base name matches', async () => {
      (mockOllama.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        models: [{ name: 'qwen2.5:7b' }], // Different tag but same base
      });

      const result = await client.isAvailable();

      expect(result).toBe(true);
    });

    it('should return false when model is not available', async () => {
      (mockOllama.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        models: [{ name: 'llama3:8b' }],
      });

      const result = await client.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false on connection error', async () => {
      (mockOllama.list as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Connection refused')
      );

      const result = await client.isAvailable();

      expect(result).toBe(false);
    });

    it('should handle undefined model names gracefully', async () => {
      (mockOllama.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        models: [{ name: undefined }, { name: 'qwen2.5:3b' }],
      });

      const result = await client.isAvailable();

      expect(result).toBe(true);
    });
  });
});
