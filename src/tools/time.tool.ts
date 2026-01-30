// Time Tool - returns current time/date information
import { BaseTool } from './BaseTool.js';
import type { ToolSchema, ToolResult } from '../ai/types.js';

interface TimeToolArgs {
  timezone?: string;
}

class TimeTool extends BaseTool<TimeToolArgs> {
  readonly name = 'get_current_time';

  readonly schema: ToolSchema = {
    name: 'get_current_time',
    description: 'Get the current date and time in a specified timezone',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description:
            'IANA timezone name (e.g., "America/New_York", "Europe/London", "Asia/Tokyo"). Defaults to UTC.',
        },
      },
      required: [],
    },
  };

  async execute(args: TimeToolArgs): Promise<ToolResult> {
    const timezone = args.timezone ?? 'UTC';

    try {
      const now = new Date();
      const formatted = now.toLocaleString('en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });

      return {
        success: true,
        timezone,
        datetime: formatted,
        iso: now.toISOString(),
      };
    } catch {
      return {
        success: false,
        error: `Invalid timezone: ${timezone}`,
      };
    }
  }
}

export default new TimeTool();
