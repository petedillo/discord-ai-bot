import { qbitRequestDuration, qbitAvailable } from '../metrics/index.js';

export interface TorrentInfo {
  hash: string;
  name: string;
  state: string;
  progress: number;
  dl_speed: number;
  up_speed: number;
}

export interface TorrentProperties {
  hash: string;
  name: string;
  comment: string;
  total_size: number;
  total_downloaded: number;
  total_uploaded: number;
  addition_date: number;
  completion_date: number;
}

export interface TransferInfo {
  dl_info_speed: number;
  up_info_speed: number;
  total_uploaded: number;
  total_downloaded: number;
  dht_nodes: number;
}

/**
 * HTTP client for qBittorrent WebUI API v2
 */
export class QBittorrentClient {
  private host: string;
  private timeout: number = 10000;

  constructor(host: string) {
    this.host = host;
  }

  /**
   * Get list of torrents with optional filter
   */
  async getTorrents(filter?: string): Promise<TorrentInfo[]> {
    return this.makeRequest<TorrentInfo[]>(
      `/api/v2/torrents/info${filter ? `?filter=${filter}` : ''}`
    );
  }

  /**
   * Get properties of a specific torrent by hash
   */
  async getTorrentProperties(hash: string): Promise<TorrentProperties> {
    return this.makeRequest<TorrentProperties>(
      `/api/v2/torrents/properties?hash=${hash}`
    );
  }

  /**
   * Get global transfer statistics
   */
  async getTransferInfo(): Promise<TransferInfo> {
    return this.makeRequest<TransferInfo>('/api/v2/transfer/info');
  }

  /**
   * Check if qBittorrent API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const start = Date.now();
      const response = await fetch(`${this.host}/api/v2/app/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });

      const duration = (Date.now() - start) / 1000;
      qbitRequestDuration.observe(duration);

      if (response.ok) {
        qbitAvailable.set(1);
        return true;
      } else {
        qbitAvailable.set(0);
        return false;
      }
    } catch {
      qbitAvailable.set(0);
      return false;
    }
  }

  /**
   * Make an authenticated request to qBittorrent API
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.host}${endpoint}`;
    const start = Date.now();

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });

      const duration = (Date.now() - start) / 1000;
      qbitRequestDuration.observe(duration);

      if (!response.ok) {
        throw new Error(
          `qBittorrent API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as T;
      return data;
    } catch (error: unknown) {
      const duration = (Date.now() - start) / 1000;
      qbitRequestDuration.observe(duration);

      if (error instanceof Error) {
        throw new Error(`Failed to fetch from qBittorrent: ${error.message}`);
      }
      throw error;
    }
  }
}
