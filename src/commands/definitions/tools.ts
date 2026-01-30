// /tools command definition
import { SlashCommandBuilder } from 'discord.js';

export const toolsCommand = new SlashCommandBuilder()
  .setName('tools')
  .setDescription('List available AI tools')
  .toJSON();

export default toolsCommand;
