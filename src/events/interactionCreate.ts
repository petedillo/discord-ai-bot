// Interaction event handler - routes commands to handlers
import type { Interaction } from 'discord.js';
import type { OllamaClient } from '../ai/OllamaClient.js';
import { handleAskCommand, handleInfoCommand, handleToolsCommand } from '../commands/handlers/index.js';

export function createInteractionHandler(
  ollamaClient: OllamaClient,
  allowedUsers: string[]
): (interaction: Interaction) => Promise<void> {
  return async function handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
      case 'ask':
        await handleAskCommand(interaction, ollamaClient, allowedUsers);
        break;
      case 'info':
        await handleInfoCommand(interaction, ollamaClient, allowedUsers);
        break;
      case 'tools':
        await handleToolsCommand(interaction);
        break;
      default:
        console.warn(`Unknown command: ${commandName}`);
    }
  };
}

export default createInteractionHandler;
