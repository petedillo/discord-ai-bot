// /tools command handler - list available AI tools
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { registry } from '../../ai/ToolRegistry.js';
import { logger } from '../../utils/index.js';

export async function handleToolsCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const tools = registry.getToolDescriptions();

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Available AI Tools')
    .setDescription('The AI can use these tools to help answer your questions:')
    .setTimestamp();

  if (tools.length === 0) {
    embed.addFields({
      name: 'No tools available',
      value: 'No tools have been registered.',
      inline: false,
    });
  } else {
    for (const tool of tools) {
      embed.addFields({
        name: `\`${tool.name}\``,
        value: tool.description || 'No description',
        inline: false,
      });
    }
  }

  try {
    await interaction.reply({ embeds: [embed] });
  } catch (replyErr) {
    logger.warn(
      'Failed to send tools embed reply:',
      replyErr instanceof Error ? replyErr.message : replyErr
    );
    try {
      await interaction.followUp({ content: 'Failed to send tools list.', ephemeral: true });
    } catch (fuErr) {
      logger.error('followUp failed:', fuErr);
    }
  }
}

export default handleToolsCommand;
