// /info command handler
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { OllamaClient } from '../../ai/OllamaClient.js';
import { registry } from '../../ai/ToolRegistry.js';

export async function handleInfoCommand(
  interaction: ChatInputCommandInteraction,
  ollamaClient: OllamaClient,
  allowedUsers: string[]
): Promise<void> {
  // Defer reply
  try {
    await interaction.deferReply();
  } catch (deferErr) {
    console.warn(
      'deferReply failed:',
      deferErr instanceof Error ? deferErr.message : deferErr
    );
    return;
  }

  try {
    const ollamaAvailable = await ollamaClient.isAvailable();
    const toolCount = registry.size();

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Bot Information')
      .addFields(
        { name: 'Status', value: 'Online', inline: true },
        { name: 'AI Model', value: ollamaClient.getModel(), inline: true },
        { name: 'AI Service', value: ollamaAvailable ? 'Available' : 'Unavailable', inline: true },
        { name: 'Authorized Users', value: `${allowedUsers.length}`, inline: true },
        { name: 'Available Tools', value: `${toolCount}`, inline: true },
        {
          name: 'Commands',
          value: '`/ask` - Ask the AI a question\n`/info` - Show bot info\n`/tools` - List available tools',
          inline: false,
        }
      )
      .setTimestamp();

    try {
      await interaction.editReply({ embeds: [embed] });
    } catch (replyErr) {
      console.warn(
        'Failed to send info embed reply:',
        replyErr instanceof Error ? replyErr.message : replyErr
      );
      try {
        await interaction.followUp({
          content: 'Failed to send info in channel.',
          ephemeral: true,
        });
      } catch (fuErr) {
        console.error('followUp failed:', fuErr);
      }
    }
  } catch (error) {
    console.error('Info command error:', error);
    try {
      await interaction.editReply({ content: 'Failed to retrieve bot information.' });
    } catch (errReply) {
      console.error('Failed to send error reply:', errReply);
    }
  }
}

export default handleInfoCommand;
