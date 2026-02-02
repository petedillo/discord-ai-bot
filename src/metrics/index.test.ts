import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMetrics,
  discordBotUp,
  discordWebsocketLatency,
  discordMessagesProcessed,
  discordRequestDuration,
  ollamaAvailable,
  ollamaRequestDuration,
  toolExecutionsTotal,
  toolExecutionDuration,
  resetMetrics,
} from './index.js';

describe('Metrics Module', () => {
  beforeEach(() => {
    // Reset metrics before each test
    resetMetrics();
  });

  describe('Registry', () => {
    it('should export metrics in Prometheus format', async () => {
      const metrics = await getMetrics();
      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
    });
  });

  describe('Discord Bot Metrics', () => {
    it('should expose discord_bot_up gauge', async () => {
      discordBotUp.set(1);
      const metrics = await getMetrics();
      expect(metrics).toContain('discord_bot_up');
      expect(metrics).toContain('discord_bot_up 1');
    });

    it('should expose discord_bot_websocket_latency_seconds gauge', async () => {
      discordWebsocketLatency.set(0.045);
      const metrics = await getMetrics();
      expect(metrics).toContain('discord_bot_websocket_latency_seconds');
      expect(metrics).toContain('discord_bot_websocket_latency_seconds 0.045');
    });

    it('should expose discord_bot_messages_processed_total counter with labels', async () => {
      discordMessagesProcessed.labels('ask', 'success').inc();
      const metrics = await getMetrics();
      expect(metrics).toContain('discord_bot_messages_processed_total');
      expect(metrics).toContain('command="ask"');
      expect(metrics).toContain('status="success"');
    });

    it('should expose discord_bot_request_duration_seconds histogram', async () => {
      discordRequestDuration.labels('ask').observe(0.5);
      const metrics = await getMetrics();
      expect(metrics).toContain('discord_bot_request_duration_seconds');
      expect(metrics).toContain('command="ask"');
    });
  });

  describe('Ollama Metrics', () => {
    it('should expose ollama_available gauge', async () => {
      ollamaAvailable.set(1);
      const metrics = await getMetrics();
      expect(metrics).toContain('ollama_available');
      expect(metrics).toContain('ollama_available 1');
    });

    it('should expose ollama_request_duration_seconds histogram', async () => {
      ollamaRequestDuration.observe(1.5);
      const metrics = await getMetrics();
      expect(metrics).toContain('ollama_request_duration_seconds');
    });
  });

  describe('Tool Metrics', () => {
    it('should expose tool_executions_total counter with labels', async () => {
      toolExecutionsTotal.labels('math', 'success').inc();
      const metrics = await getMetrics();
      expect(metrics).toContain('tool_executions_total');
      expect(metrics).toContain('tool="math"');
      expect(metrics).toContain('status="success"');
    });

    it('should expose tool_execution_duration_seconds histogram with labels', async () => {
      toolExecutionDuration.labels('time').observe(0.01);
      const metrics = await getMetrics();
      expect(metrics).toContain('tool_execution_duration_seconds');
      expect(metrics).toContain('tool="time"');
    });
  });

  describe('Counter increments', () => {
    it('should increment counters correctly', async () => {
      discordMessagesProcessed.labels('info', 'success').inc();
      discordMessagesProcessed.labels('info', 'success').inc();
      discordMessagesProcessed.labels('info', 'error').inc();
      
      const metrics = await getMetrics();
      expect(metrics).toMatch(/discord_bot_messages_processed_total\{command="info",status="success"\} 2/);
      expect(metrics).toMatch(/discord_bot_messages_processed_total\{command="info",status="error"\} 1/);
    });
  });

  describe('Histogram observations', () => {
    it('should record histogram observations', async () => {
      toolExecutionDuration.labels('math').observe(0.1);
      toolExecutionDuration.labels('math').observe(0.2);
      toolExecutionDuration.labels('math').observe(0.15);
      
      const metrics = await getMetrics();
      expect(metrics).toContain('tool_execution_duration_seconds_count{tool="math"} 3');
      expect(metrics).toContain('tool_execution_duration_seconds_sum');
    });
  });
});
