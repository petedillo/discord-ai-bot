// /info command definition
import { SlashCommandBuilder } from 'discord.js';

export const infoCommand = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Get bot information')
  .toJSON();

export default infoCommand;
