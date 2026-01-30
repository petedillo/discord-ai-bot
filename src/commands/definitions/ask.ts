// /ask command definition
import { SlashCommandBuilder } from 'discord.js';

export const askCommand = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Ask the AI a question (can use tools)')
  .addStringOption((option) =>
    option.setName('question').setDescription('Your question for the AI').setRequired(true)
  )
  .toJSON();

export default askCommand;
