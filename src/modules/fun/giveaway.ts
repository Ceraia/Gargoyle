import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import { ChannelType, ChatInputCommandInteraction } from 'discord.js';

export default class Giveaway extends GargoyleModule {
    public override category: string = 'fun';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('giveaway')
            .addGuilds('750209335841390642') // Test server
            .setDescription('Start a giveaway')
            .addStringOption((option) => option.setName('prize').setDescription('The prize of the giveaway').setRequired(true))
            .addStringOption((option) =>
                option.setName('duration').setDescription('The duration of the giveaway (e.g. 1h, 30m, 2d)').setRequired(true)
            )
            .addIntegerOption((option) =>
                option.setName('winners').setDescription('The number of winners (default: 1)').setRequired(false).setMinValue(1).setMaxValue(20)
            )
            .addChannelOption((option) =>
                option
                    .setName('channel')
                    .setDescription('The channel to host the giveaway in (default: current channel)')
                    .setRequired(false)
                    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            )
            .setDefaultMemberPermissions(0) as GargoyleSlashCommandBuilder
    ];
    public override events = [];

    private giveawaySetups: Map<string, { prize: string; duration: number; winners: number; channelId: string; endTime: number }> = new Map();

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'giveaway') {
            if (!client.db) {
                await interaction.reply({ content: 'Database connection not established, please try again later.', ephemeral: true });
                return;
            }

            const prize = interaction.options.getString('prize', true);
            const duration = interaction.options.getString('duration', true);
            const winners = interaction.options.getInteger('winners') || 1;
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            if (!prize || !duration || !channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
                await interaction.reply({
                    content:
                        'Invalid giveaway setup. Please provide all required fields, or go to a channel that supports giveaways. (text or announcement channel)',
                    ephemeral: true
                });
                return;
            }

            // Parse duration
            const durationMatch = duration.match(/^(\d+)([smhd])$/);
            if (!durationMatch) {
                await interaction.reply({ content: 'Invalid duration format. Use s, m, h, or d (e.g. 30m, 2h, 1d).', ephemeral: true });
                return;
            }
            const durationValue = parseInt(durationMatch[1], 10);
            const durationUnit = durationMatch[2];
            let durationMs = 0;
            switch (durationUnit) {
                case 's':
                    durationMs = durationValue * 1000;
                    break;
                case 'm':
                    durationMs = durationValue * 60 * 1000;
                    break;
                case 'h':
                    durationMs = durationValue * 60 * 60 * 1000;
                    break;
                case 'd':
                    durationMs = durationValue * 24 * 60 * 60 * 1000;
                    break;
            }
            if (durationMs <= 0) {
                await interaction.reply({ content: 'Duration must be greater than 0.', ephemeral: true });
                return;
            }

            await interaction.reply({ content: 'This command is not yet implemented.', ephemeral: true });
        }
    }
}
