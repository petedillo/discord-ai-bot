// Bot initialization with tool support
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { OllamaClient } from './ai/OllamaClient.js';
import { registerCommands } from './commands/registerCommands.js';
import { createInteractionHandler } from './events/interactionCreate.js';
import { startMetricsServer } from './metrics/server.js';
import { discordBotUp, discordWebsocketLatency } from './metrics/index.js';

// Version info
const VERSION = '2.0.0';
const BUILD_DATE = '2026-02-02';

// Load tools (auto-registers them)
await import('./tools/index.js');

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Initialize Ollama client with tool support
const ollamaClient = new OllamaClient({
  host: config.ollama.host,
  model: config.ollama.model,
  timeout: config.ollama.timeout,
});

// Event: Bot ready
client.once('ready', async () => {
  console.log(`Discord bot logged in as ${client.user?.tag}`);
  console.log(`Ollama model: ${config.ollama.model}`);
  console.log(`Allowed users: ${config.discord.allowedUsers.length}`);

  // Set bot connection status
  discordBotUp.set(1);

  // Track WebSocket latency
  setInterval(() => {
    const latency = client.ws.ping / 1000; // Convert to seconds
    discordWebsocketLatency.set(latency);
  }, 30000); // Update every 30 seconds

  await registerCommands();
});

// Track disconnection
client.on('disconnect', () => {
  console.log('Discord bot disconnected');
  discordBotUp.set(0);
});

client.on('error', (error) => {
  console.error('Discord bot error:', error);
  discordBotUp.set(0);
});

// Event: Interaction (slash command)
client.on('interactionCreate', createInteractionHandler(ollamaClient, config.discord.allowedUsers));

// Start bot
export async function start(): Promise<void> {
  const startupTime = new Date().toISOString();
  
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Discord AI Bot v${VERSION}`);
  console.log(`  Build: ${BUILD_DATE}`);
  console.log(`  Started: ${startupTime}`);
  console.log('═══════════════════════════════════════════════════════');
  
  // Start metrics server if enabled
  if (config.metrics.enabled) {
    try {
      await startMetricsServer(config.metrics.port);
      console.log(`[Metrics] Server enabled on port ${config.metrics.port}`);
    } catch (error) {
      console.error('[Metrics] Failed to start server:', error);
    }
  } else {
    console.log('[Metrics] Server disabled');
  }
  
  await client.login(config.discord.token);
}

export default start;
