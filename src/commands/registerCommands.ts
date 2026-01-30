// Register Discord slash commands
import { REST, Routes } from 'discord.js';
import { allCommands } from './definitions/index.js';
import { config } from '../config.js';

export async function registerCommands(): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    console.log(`Registering ${allCommands.length} slash commands...`);

    await rest.put(Routes.applicationCommands(config.discord.clientId), {
      body: allCommands,
    });

    console.log('Successfully registered slash commands');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
}

export default registerCommands;
