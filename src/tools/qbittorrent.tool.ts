import { BaseTool } from './BaseTool.js';
import { qbittorrentClient } from '../clients/index.js';
import type { ToolSchema, ToolResult } from '../ai/types.js';

export interface QBittorrentToolArgs {
  action: 'list' | 'details' | 'speeds' | 'transfer_info';
  filter?: 'all' | 'downloading' | 'seeding' | 'completed' | 'paused' | 'active' | 'inactive' | 'stalled';
  hash?: string;
}

/**
 * Tool for querying qBittorrent torrent status and transfer information
 */
export class QBittorrentTool extends BaseTool<QBittorrentToolArgs> {
  readonly name = 'qbittorrent';

  readonly schema: ToolSchema = {
    name: 'qbittorrent',
    description:
      'Query qBittorrent for torrent status, download/upload speeds, and transfer information. Read-only access to torrent information on the local network.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action to perform',
          enum: ['list', 'details', 'speeds', 'transfer_info'],
        },
        filter: {
          type: 'string',
          description: 'Filter torrents (used with list action)',
          enum: ['all', 'downloading', 'seeding', 'completed', 'paused', 'active', 'inactive', 'stalled'],
        },
        hash: {
          type: 'string',
          description: 'Torrent hash (required for details action)',
        },
      },
      required: ['action'],
    },
  };

  async execute(args: QBittorrentToolArgs): Promise<ToolResult> {
    try {
      switch (args.action) {
        case 'list':
          return await this.handleList(args.filter);

        case 'details':
          return await this.handleDetails(args.hash);

        case 'speeds':
          return await this.handleSpeeds();

        case 'transfer_info':
          return await this.handleTransferInfo();

        default:
          return {
            success: false,
            error: `Unknown action: ${args.action}`,
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `qBittorrent tool error: ${errorMessage}`,
      };
    }
  }

  private async handleList(filter?: string): Promise<ToolResult> {
    const torrents = await qbittorrentClient.getTorrents(filter);

    if (torrents.length === 0) {
      return {
        success: true,
        data: 'No torrents found.',
      };
    }

    const formatSize = (bytes: number): string => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const formatSpeed = (bytesPerSec: number): string => {
      return `${formatSize(bytesPerSec)}/s`;
    };

    const torrentList = torrents
      .map((t) => {
        const progress = ((t.progress as number) * 100).toFixed(1);
        return `• **${t.name}** [${t.state}] ${progress}% (↓ ${formatSpeed(t.dl_speed as number)} ↑ ${formatSpeed(t.up_speed as number)})`;
      })
      .join('\n');

    return {
      success: true,
      data: `**Torrents** (${filter ? `filter: ${filter}` : 'all'}):\n${torrentList}`,
    };
  }

  private async handleDetails(hash?: string): Promise<ToolResult> {
    if (!hash) {
      return {
        success: false,
        error: 'Torrent hash is required for details action',
      };
    }

    const props = await qbittorrentClient.getTorrentProperties(hash);

    const formatSize = (bytes: number): string => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const formatDate = (timestamp: number): string => {
      if (timestamp <= 0) return 'Not completed';
      const dateStr = new Date(timestamp * 1000).toISOString().split('T')[0];
      return dateStr || 'Invalid date';
    };

    const progress = ((props.total_downloaded / props.total_size) * 100).toFixed(1);

    return {
      success: true,
      data: `**Torrent Details**
• **Name**: ${props.name}
• **Hash**: ${props.hash}
• **Size**: ${formatSize(props.total_size)}
• **Downloaded**: ${formatSize(props.total_downloaded)} (${progress}%)
• **Uploaded**: ${formatSize(props.total_uploaded)}
• **Added**: ${formatDate(props.addition_date)}
• **Completed**: ${formatDate(props.completion_date)}`,
    };
  }

  private async handleSpeeds(): Promise<ToolResult> {
    const transferInfo = await qbittorrentClient.getTransferInfo();

    const formatSpeed = (bytesPerSec: number): string => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let speed = bytesPerSec;
      let unitIndex = 0;

      while (speed >= 1024 && unitIndex < units.length - 1) {
        speed /= 1024;
        unitIndex++;
      }

      return `${speed.toFixed(2)} ${units[unitIndex]}/s`;
    };

    return {
      success: true,
      data: `**Current Speeds**
• **Download**: ${formatSpeed(transferInfo.dl_info_speed)}
• **Upload**: ${formatSpeed(transferInfo.up_info_speed)}`,
    };
  }

  private async handleTransferInfo(): Promise<ToolResult> {
    const transferInfo = await qbittorrentClient.getTransferInfo();

    const formatSize = (bytes: number): string => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const formatSpeed = (bytesPerSec: number): string => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let speed = bytesPerSec;
      let unitIndex = 0;

      while (speed >= 1024 && unitIndex < units.length - 1) {
        speed /= 1024;
        unitIndex++;
      }

      return `${speed.toFixed(2)} ${units[unitIndex]}/s`;
    };

    return {
      success: true,
      data: `**Transfer Information**
• **Download Speed**: ${formatSpeed(transferInfo.dl_info_speed)}
• **Upload Speed**: ${formatSpeed(transferInfo.up_info_speed)}
• **Total Downloaded**: ${formatSize(transferInfo.total_downloaded)}
• **Total Uploaded**: ${formatSize(transferInfo.total_uploaded)}
• **DHT Nodes**: ${transferInfo.dht_nodes}`,
    };
  }
}

// Export as default singleton instance
export default new QBittorrentTool();
