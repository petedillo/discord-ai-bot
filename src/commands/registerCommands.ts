// Register Discord slash commands
import { REST, Routes } from 'discord.js';
import { allCommands } from './definitions/index.js';
import { config } from '../config.js';
import { logger } from '../utils/index.js';

export async function registerCommands(): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    logger.debug(`Registering ${allCommands.length} slash commands...`);

    await rest.put(Routes.applicationCommands(config.discord.clientId), {
      body: allCommands,
    });

    logger.info('Successfully registered slash commands');
  } catch (error) {
    logger.error('Failed to register commands:', error);
  }
}

export default registerCommands;
