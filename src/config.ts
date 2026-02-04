// Configuration module
import 'dotenv/config';

interface Config {
  discord: {
    token: string;
    clientId: string;
    allowedUsers: string[];
  };
  ollama: {
    host: string;
    model: string;
    timeout: number;
  };
  tools: {
    maxIterations: number;
  };
  toolExecutor: {
    loggingEnabled: boolean;
  };
  summarizer: {
    enabled: boolean;
    model: string;
  };
  metrics: {
    enabled: boolean;
    port: number;
  };
  qbittorrent: {
    host: string;
    enabled: boolean;
  };
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? defaultValue ?? '';
}

function parseAllowedUsers(ids: string | undefined): string[] {
  if (!ids) return [];
  return ids.split(',').map((id) => id.trim()).filter(Boolean);
}

export const config: Config = {
  discord: {
    token: getEnvVar('DISCORD_TOKEN'),
    clientId: getEnvVar('DISCORD_CLIENT_ID'),
    allowedUsers: parseAllowedUsers(process.env.ALLOWED_USER_IDS),
  },
  ollama: {
    host: getEnvVar('OLLAMA_HOST', 'http://localhost:11434'),
    model: getEnvVar('OLLAMA_MODEL', 'qwen-tools'),
    timeout: parseInt(getEnvVar('OLLAMA_TIMEOUT', '120000'), 10),
  },
  tools: {
    maxIterations: 5,
  },
  toolExecutor: {
    loggingEnabled: getEnvVar('TOOL_EXECUTOR_LOGGING', 'false') === 'true',
  },
  summarizer: {
    enabled: getEnvVar('SUMMARIZER_ENABLED', 'true') === 'true',
    model: getEnvVar('SUMMARIZER_MODEL', 'qwen2.5:3b'),
  },
  metrics: {
    enabled: getEnvVar('METRICS_ENABLED', 'true') === 'true',
    port: parseInt(getEnvVar('METRICS_PORT', '9090'), 10),
  },
  qbittorrent: {
    host: getEnvVar('QBIT_HOST', 'http://192.168.50.21:8080'),
    enabled: getEnvVar('QBIT_ENABLED', 'true') === 'true',
  },
};

export default config;
