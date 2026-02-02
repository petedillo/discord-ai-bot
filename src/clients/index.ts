import { QBittorrentClient } from './QBittorrentClient.js';
import { config } from '../config.js';

// Create singleton instance
export const qbittorrentClient = new QBittorrentClient(config.qbittorrent.host);

export { QBittorrentClient };
export type { TorrentInfo, TorrentProperties, TransferInfo } from './QBittorrentClient.js';
