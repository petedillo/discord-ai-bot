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
  metrics: {
    enabled: boolean;
    port: number;
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
  metrics: {
    enabled: getEnvVar('METRICS_ENABLED', 'true') === 'true',
    port: parseInt(getEnvVar('METRICS_PORT', '9090'), 10),
  },
};

export default config;
