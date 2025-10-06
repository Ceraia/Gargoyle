import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleContainerBuilder from '@src/system/backend/builders/gargoyleContainerBuilder.js';
import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import { editAsServer, sendAsServer } from '@src/system/backend/tools/server.js';
import {
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ContainerBuilder,
    MessageCreateOptions,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    SectionBuilder,
    TextChannel,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import { model, Schema } from 'mongoose';

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

    private giveawaySetups: Map<
        string,
        {
            winners: number;
            channelId: string;
            endTime: number;
            entries: string[];
            prizeMessage: string | null;
        }
    > = new Map();

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'giveaway') {
            if (!client.db) {
                await interaction.reply({ content: 'Database connection not established, please try again later.', ephemeral: true });
                return;
            }

            const duration = interaction.options.getString('duration', true);
            const winners = interaction.options.getInteger('winners') || 1;
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            if (!duration || !channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
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

            const endTime = Date.now() + durationMs;

            this.giveawaySetups.set(interaction.user.id, {
                winners: winners,
                channelId: channel.id,
                endTime: endTime,
                entries: [],
                prizeMessage: null
            });

            await interaction.showModal(
                new GargoyleModalBuilder(this, 'setup')
                    .setTitle('Giveaway Setup')
                    .addComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId('body')
                                .setLabel('Prize Message')
                                .setPlaceholder('The prize message that will be shown in the giveaway')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                                .setMaxLength(1500)
                        )
                    )
            );
            return;
        }
    }

    public override async executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'setup') {
            const setup = this.giveawaySetups.get(interaction.user.id);
            if (!setup) {
                interaction.reply({ content: 'No giveaway setup found. Please run the command again.', flags: MessageFlags.Ephemeral });
                return;
            }

            const prizeMessage: string | null = interaction.fields.getTextInputValue('body') || null;
            setup.prizeMessage = prizeMessage;

            const giveaway = new databaseGiveaway({
                guildId: interaction.guildId,
                channelId: setup.channelId,
                messageId: 'temp', // Will be updated later
                endTime: new Date(setup.endTime),
                entries: setup.entries,
                prize: setup.prizeMessage || 'No prize specified'
            });

            await giveaway.save().catch(async (err: Error) => {
                client.logger.error(`Failed to save giveaway to database: ${err.stack}`);
                await interaction.reply({
                    content: 'Failed to save giveaway to database. Please try again later.',
                    flags: MessageFlags.Ephemeral
                });
                this.giveawaySetups.delete(interaction.user.id);
                return;
            });

            this.giveawaySetups.delete(interaction.user.id);

            const giveawayMessage = await this.giveawayMessage(interaction.user.id);
            const message = await sendAsServer(giveawayMessage, client.channels.cache.get(setup.channelId) as TextChannel);

            if (!message) {
                await interaction.reply({ content: 'Failed to send giveaway message.', flags: MessageFlags.Ephemeral });
                return;
            }

            giveaway.messageId = message.id;
            await giveaway.save().catch((err: Error) => {
                client.logger.error(`Failed to update giveaway message ID in database: ${err.stack}`);
                message.delete().catch(() => {});
            });

            await interaction.reply({ content: `Giveaway started in <#${setup.channelId}>!`, flags: MessageFlags.Ephemeral });
            this.giveawaySetups.delete(interaction.user.id);
            return;
        }
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'enter') {
            if (client.db === null) {
                await interaction.reply({ content: 'Database connection not established, please try again later.', flags: MessageFlags.Ephemeral });
                return;
            }

            const giveawayEntry = await databaseGiveaway.findOne({ messageId: interaction.message.id });

            // Check if giveaway has ended
            if (!giveawayEntry || giveawayEntry.endTime.getTime() < Date.now()) {
                await interaction.reply({ content: 'This giveaway has already ended.', flags: MessageFlags.Ephemeral });

                await editAsServer(
                    { components: [new GargoyleContainerBuilder('Giveaway ended')], flags: MessageFlags.IsComponentsV2 },
                    interaction.message.channel as TextChannel,
                    interaction.message.id
                ).catch(() => {
                    interaction.message.delete().catch(() => {});
                });

                return;
            }

            // Check if user has already entered
            const existingEntry = giveawayEntry.entries.find((entry) => entry === interaction.user.id);
            if (existingEntry) {
                giveawayEntry.entries = giveawayEntry.entries.filter((entry) => entry !== interaction.user.id);
                await giveawayEntry.save().catch((err: Error) => {
                    client.logger.error(`Failed to remove giveaway entry from database: ${err.stack}`);
                });

                await interaction.reply({ content: 'You have removed your entry from the giveaway.', flags: MessageFlags.Ephemeral });
                return;
            }

            giveawayEntry.entries.push(interaction.user.id);
            await giveawayEntry.save().catch((err: Error) => {
                client.logger.error(`Failed to add giveaway entry to database: ${err.stack}`);
            });

            await interaction.reply({ content: 'You have entered the giveaway!', flags: MessageFlags.Ephemeral });
            return;
        }
    }

    private async giveawayMessage(userId: string, messageId?: string): Promise<MessageCreateOptions> {
        let giveaway = this.giveawaySetups.get(userId);

        if (!giveaway) {
            if (!messageId) throw new Error('No giveaway setup found for user ID.');

            let giveawayEntry = await databaseGiveaway.findOne({ messageId: messageId });

            if (giveawayEntry) {
                giveaway = {
                    winners: giveawayEntry.winners,
                    channelId: giveawayEntry.channelId,
                    endTime: giveawayEntry.endTime.getTime(),
                    entries: giveawayEntry.entries,
                    prizeMessage: giveawayEntry.prize
                };
            }

            if (!giveaway) {
                throw new Error('No giveaway setup found for user or message ID.');
            }
        }

        return {
            components: [
                new ContainerBuilder().addSectionComponents(
                    new SectionBuilder()
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'enter').setEmoji(this.giveawayEmojis.bookmarks).setStyle(ButtonStyle.Secondary)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `# ${this.giveawayEmojis.confetti} **${giveaway.winners > 1 ? `${giveaway.winners}x GIVEAWAY` : `GIVEAWAY`}** ${this.giveawayEmojis.confetti}` +
                                    `**Hosted by:** <@${userId}>` +
                                    (giveaway.prizeMessage ? `\n\n${giveaway.prizeMessage}` : '') +
                                    `\n-# **${giveaway.entries.length} Entries | Ends in:** <t:${Math.floor(giveaway.endTime / 1000)}:R>`
                            )
                        )
                )
            ],
            flags: [MessageFlags.IsComponentsV2]
        };
    }

    private giveawayEmojis = {
        confetti: `<:confetti:1424363941768986624>`,
        bookmarks: `<:bookmarks:1424365082112163852>`
    };
}

const giveawaySchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    channelId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    endTime: {
        type: Date,
        required: true
    },
    prize: {
        type: String,
        required: true
    },
    entries: {
        type: [String],
        default: []
    },
    winners: {
        type: Number,
        default: 1
    }
});

const databaseGiveaway = model('Giveaways', giveawaySchema);
