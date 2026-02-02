import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QBittorrentClient } from './QBittorrentClient.js';
import * as metrics from '../metrics/index.js';

describe('QBittorrentClient', () => {
  let client: QBittorrentClient;

  beforeEach(() => {
    vi.clearAllMocks();
    metrics.resetMetrics();
    client = new QBittorrentClient('http://test-qbit:8080');
  });

  describe('getTorrents()', () => {
    it('returns parsed torrent list', async () => {
      const mockTorrents = [
        {
          hash: 'abc123',
          name: 'Test Torrent 1',
          state: 'downloading',
          progress: 0.5,
          dl_speed: 1024000,
          up_speed: 512000,
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTorrents,
      });

      const result = await client.getTorrents();

      expect(result).toEqual(mockTorrents);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-qbit:8080/api/v2/torrents/info',
        expect.any(Object)
      );
    });

    it('applies filter parameter', async () => {
      const mockTorrents = [
        {
          hash: 'abc123',
          name: 'Downloading Torrent',
          state: 'downloading',
          progress: 0.75,
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTorrents,
      });

      await client.getTorrents('downloading');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('filter=downloading'),
        expect.any(Object)
      );
    });
  });

  describe('getTorrentProperties()', () => {
    it('returns torrent details by hash', async () => {
      const mockProperties = {
        hash: 'abc123',
        name: 'Test Torrent',
        comment: 'Test comment',
        total_size: 1024000000,
        total_downloaded: 512000000,
        total_uploaded: 256000000,
        addition_date: 1704067200,
        completion_date: 1704153600,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockProperties,
      });

      const result = await client.getTorrentProperties('abc123');

      expect(result).toEqual(mockProperties);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-qbit:8080/api/v2/torrents/properties?hash=abc123',
        expect.any(Object)
      );
    });
  });

  describe('getTransferInfo()', () => {
    it('returns transfer stats', async () => {
      const mockTransferInfo = {
        dl_info_speed: 5242880,
        up_info_speed: 2621440,
        total_uploaded: 10737418240,
        total_downloaded: 53687091200,
        dht_nodes: 50,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransferInfo,
      });

      const result = await client.getTransferInfo();

      expect(result).toEqual(mockTransferInfo);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-qbit:8080/api/v2/transfer/info',
        expect.any(Object)
      );
    });
  });

  describe('isAvailable()', () => {
    it('returns true when API responds', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      });

      const result = await client.isAvailable();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-qbit:8080/api/v2/app/version',
        expect.any(Object)
      );
    });

    it('returns false on connection error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Connection failed'));

      const result = await client.isAvailable();

      expect(result).toBe(false);
    });

    it('returns false on non-200 status', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await client.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('metrics', () => {
    it('records request duration on each call', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await client.getTorrents();

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('qbittorrent_request_duration_seconds');
    });

    it('sets availability gauge correctly', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      });

      await client.isAvailable();

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('qbittorrent_available 1');
    });

    it('sets availability gauge to 0 on failure', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Failed'));

      await client.isAvailable();

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('qbittorrent_available 0');
    });
  });

  describe('error handling', () => {
    it('throws on failed request with non-OK response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.getTorrents()).rejects.toThrow();
    });

    it('throws on network error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getTorrents()).rejects.toThrow();
    });
  });
});
