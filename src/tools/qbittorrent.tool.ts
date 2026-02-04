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
        action: 'list',
        filter: filter || 'all',
        count: 0,
        torrents: [],
      };
    }

    return {
      success: true,
      action: 'list',
      filter: filter || 'all',
      count: torrents.length,
      torrents: torrents.map((t) => ({
        name: t.name,
        hash: t.hash,
        state: t.state,
        progress: Math.round((t.progress as number) * 100),
        dlSpeed: t.dl_speed,
        upSpeed: t.up_speed,
      })),
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

    return {
      success: true,
      action: 'details',
      torrent: {
        name: props.name,
        hash: props.hash,
        comment: props.comment,
        totalSize: props.total_size,
        totalDownloaded: props.total_downloaded,
        totalUploaded: props.total_uploaded,
        progress: Math.round((props.total_downloaded / props.total_size) * 100),
        additionDate: props.addition_date,
        completionDate: props.completion_date,
      },
    };
  }

  private async handleSpeeds(): Promise<ToolResult> {
    const transferInfo = await qbittorrentClient.getTransferInfo();

    return {
      success: true,
      action: 'speeds',
      downloadSpeed: transferInfo.dl_info_speed,
      uploadSpeed: transferInfo.up_info_speed,
    };
  }

  private async handleTransferInfo(): Promise<ToolResult> {
    const transferInfo = await qbittorrentClient.getTransferInfo();

    return {
      success: true,
      action: 'transfer_info',
      downloadSpeed: transferInfo.dl_info_speed,
      uploadSpeed: transferInfo.up_info_speed,
      totalDownloaded: transferInfo.total_downloaded,
      totalUploaded: transferInfo.total_uploaded,
      dhtNodes: transferInfo.dht_nodes,
    };
  }
}

// Export as default singleton instance
export default new QBittorrentTool();
