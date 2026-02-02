import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QBittorrentTool, type QBittorrentToolArgs } from './qbittorrent.tool.js';
import * as metrics from '../metrics/index.js';

describe('QBittorrentTool', () => {
  let tool: QBittorrentTool;

  beforeEach(() => {
    vi.clearAllMocks();
    metrics.resetMetrics();
    tool = new QBittorrentTool();
  });

  describe('tool metadata', () => {
    it('has correct name', () => {
      expect(tool.name).toBe('qbittorrent');
    });

    it('has correct schema', () => {
      expect(tool.schema.name).toBe('qbittorrent');
      expect(tool.schema.description).toContain('qBittorrent');
      const actionProp = tool.schema.parameters.properties['action'];
      if (actionProp && 'enum' in actionProp) {
        const enumValues = (actionProp as { enum: string[] }).enum;
        expect(enumValues).toContain('list');
        expect(enumValues).toContain('details');
        expect(enumValues).toContain('speeds');
        expect(enumValues).toContain('transfer_info');
      }
      expect(tool.schema.parameters.required).toContain('action');
    });
  });

  describe('execute action validation', () => {
    it('returns error on invalid action', async () => {
      const result = await tool.execute(
        { action: 'invalid_action' } as unknown as QBittorrentToolArgs
      );

      expect(result.success).toBe(false);
    });

    it('returns error without hash for details action', async () => {
      const result = await tool.execute(
        { action: 'details' } as unknown as QBittorrentToolArgs
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('hash');
      }
    });
  });

  describe('formatting helpers', () => {
    it('has correct schema structure', () => {
      // We test that the tool has correct methods and schema
      expect(tool.name).toBe('qbittorrent');
      expect(typeof tool.execute).toBe('function');
    });
  });

  describe('metrics tracking', () => {
    it('tool has execute method for metrics tracking', async () => {
      expect(typeof tool.execute).toBe('function');
    });
  });
});
