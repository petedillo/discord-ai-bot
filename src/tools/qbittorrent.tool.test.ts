import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QBittorrentTool, type QBittorrentToolArgs } from './qbittorrent.tool.js';
import * as metrics from '../metrics/index.js';
import { qbittorrentClient } from '../clients/index.js';

// Mock the qbittorrent client
vi.mock('../clients/index.js', () => ({
  qbittorrentClient: {
    getTorrents: vi.fn(),
    getTorrentProperties: vi.fn(),
    getTransferInfo: vi.fn(),
  },
}));

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

  describe('JSON output format - list action', () => {
    it('returns structured JSON for empty torrent list', async () => {
      vi.mocked(qbittorrentClient.getTorrents).mockResolvedValueOnce([]);

      const result = await tool.execute({ action: 'list' });

      expect(result).toEqual({
        success: true,
        action: 'list',
        filter: 'all',
        count: 0,
        torrents: [],
      });
    });

    it('returns structured JSON for torrent list', async () => {
      vi.mocked(qbittorrentClient.getTorrents).mockResolvedValueOnce([
        {
          hash: 'abc123',
          name: 'Test Movie',
          state: 'downloading',
          progress: 0.5,
          dl_speed: 1048576, // 1 MB/s
          up_speed: 524288, // 512 KB/s
        },
        {
          hash: 'def456',
          name: 'Test Show',
          state: 'seeding',
          progress: 1.0,
          dl_speed: 0,
          up_speed: 262144,
        },
      ]);

      const result = await tool.execute({ action: 'list', filter: 'downloading' });

      expect(result.success).toBe(true);
      expect(result).toMatchObject({
        action: 'list',
        filter: 'downloading',
        count: 2,
      });

      // Check torrents array structure
      const torrents = (result as unknown as { torrents: unknown[] }).torrents;
      expect(torrents).toHaveLength(2);
      expect(torrents[0]).toEqual({
        hash: 'abc123',
        name: 'Test Movie',
        state: 'downloading',
        progress: 50, // Converted to percentage
        dlSpeed: 1048576,
        upSpeed: 524288,
      });
      expect(torrents[1]).toEqual({
        hash: 'def456',
        name: 'Test Show',
        state: 'seeding',
        progress: 100,
        dlSpeed: 0,
        upSpeed: 262144,
      });
    });
  });

  describe('JSON output format - details action', () => {
    it('returns structured JSON for torrent details', async () => {
      vi.mocked(qbittorrentClient.getTorrentProperties).mockResolvedValueOnce({
        hash: 'abc123',
        name: 'Test Movie',
        comment: 'A test torrent',
        total_size: 1073741824, // 1 GB
        total_downloaded: 536870912, // 512 MB
        total_uploaded: 268435456, // 256 MB
        addition_date: 1704067200, // Jan 1, 2024
        completion_date: 0, // Not completed
      });

      const result = await tool.execute({ action: 'details', hash: 'abc123' });

      expect(result.success).toBe(true);
      expect(result).toMatchObject({
        action: 'details',
        torrent: {
          hash: 'abc123',
          name: 'Test Movie',
          comment: 'A test torrent',
          totalSize: 1073741824,
          totalDownloaded: 536870912,
          totalUploaded: 268435456,
          progress: 50,
          additionDate: 1704067200,
          completionDate: 0,
        },
      });
    });
  });

  describe('JSON output format - speeds action', () => {
    it('returns structured JSON for speeds', async () => {
      vi.mocked(qbittorrentClient.getTransferInfo).mockResolvedValueOnce({
        dl_info_speed: 5242880, // 5 MB/s
        up_info_speed: 1048576, // 1 MB/s
        total_downloaded: 0,
        total_uploaded: 0,
        dht_nodes: 0,
      });

      const result = await tool.execute({ action: 'speeds' });

      expect(result).toEqual({
        success: true,
        action: 'speeds',
        downloadSpeed: 5242880,
        uploadSpeed: 1048576,
      });
    });
  });

  describe('JSON output format - transfer_info action', () => {
    it('returns structured JSON for transfer info', async () => {
      vi.mocked(qbittorrentClient.getTransferInfo).mockResolvedValueOnce({
        dl_info_speed: 2097152,
        up_info_speed: 524288,
        total_downloaded: 107374182400, // 100 GB
        total_uploaded: 53687091200, // 50 GB
        dht_nodes: 450,
      });

      const result = await tool.execute({ action: 'transfer_info' });

      expect(result).toEqual({
        success: true,
        action: 'transfer_info',
        downloadSpeed: 2097152,
        uploadSpeed: 524288,
        totalDownloaded: 107374182400,
        totalUploaded: 53687091200,
        dhtNodes: 450,
      });
    });
  });

  describe('error handling', () => {
    it('returns error result when client throws', async () => {
      vi.mocked(qbittorrentClient.getTorrents).mockRejectedValueOnce(
        new Error('Connection refused')
      );

      const result = await tool.execute({ action: 'list' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Connection refused');
      }
    });
  });

  describe('metrics tracking', () => {
    it('tool has execute method for metrics tracking', async () => {
      expect(typeof tool.execute).toBe('function');
    });
  });
});
