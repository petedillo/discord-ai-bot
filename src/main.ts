// Bot initialization with tool support
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { OllamaClient } from './ai/OllamaClient.js';
import { registerCommands } from './commands/registerCommands.js';
import { createInteractionHandler } from './events/interactionCreate.js';

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

  await registerCommands();
});

// Event: Interaction (slash command)
client.on('interactionCreate', createInteractionHandler(ollamaClient, config.discord.allowedUsers));

// Start bot
export async function start(): Promise<void> {
  console.log('Starting Discord AI Bot...');
  await client.login(config.discord.token);
}

export default start;
