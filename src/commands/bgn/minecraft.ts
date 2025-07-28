import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import { GargoyleStringSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import { createBanner, FontWeight } from '@src/system/backend/tools/banners.js';
import { channel } from 'diagnostics_channel';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ContainerBuilder,
    InteractionEditReplyOptions,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageActionRowComponentBuilder,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    TextChannel,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import { model, Schema } from 'mongoose';
import { title } from 'process';

const minecraftBgnGuild = '1039152052644880435';

export default class Ceraia extends GargoyleCommand {
    public override category: string = 'bgn';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('minecraft')
            .setDescription('BGN\s Minecraft commands')
            .addGuild(minecraftBgnGuild)
            .addSubcommand((subcommand) => subcommand.setName('vote').setDescription('Make a new vote'))
            .addSubcommand((subcommand) =>
                subcommand.setName('clearnicks').setDescription('Clears all nicknames in the guild')
            ) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'minecraft') {
            if (interaction.options.getSubcommand() === 'clearnicks') {
                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                client.logger.info(`Clearing all nicknames in guild ${interaction.guildId}`);
                const members = await interaction.guild!.members.fetch();

                for (const member of members) {
                    const [memberId, memberData] = member;
                    if (memberData.nickname) {
                        try {
                            await memberData.setNickname(null);
                        } catch (error) {}
                    }
                }

                await interaction.editReply({
                    content: 'All nicknames have been cleared.'
                });
            } else if (interaction.options.getSubcommand() === 'vote') {
                interaction.showModal(
                    new GargoyleModalBuilder(this, 'vote')
                        .setTitle('Create a vote')
                        .addComponents(
                            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                new TextInputBuilder().setCustomId('title').setLabel('Vote Title').setStyle(TextInputStyle.Short).setRequired(true)
                            ),
                            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('description')
                                    .setLabel('Vote Description')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('options')
                                    .setLabel('Vote Options (semicolon separated)')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('time')
                                    .setLabel('Vote Duration (in hours)')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        )
                );
            }
        }
    }

    public override async executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'vote') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const options = interaction.fields
                .getTextInputValue('options')
                .split(';')
                .map((option) => option.trim());
            const duration = parseInt(interaction.fields.getTextInputValue('time'), 10);

            const message = await (interaction.channel as TextChannel).send({
                components: [
                    new ContainerBuilder().setAccentColor(0x00d2ff).addTextDisplayComponents(new TextDisplayBuilder().setContent('One moment...'))
                ],
                flags: MessageFlags.IsComponentsV2
            });

            const endDate = new Date(Date.now() + duration * 60 * 60 * 1000);
            const voteData = {
                ownerId: interaction.user.id,
                title: title,
                description: description,
                options: options,
                channelId: interaction.channelId,
                messageId: message.id,
                votes: [],
                endDate
            };

            const newVote = new databaseMinecraftVote(voteData);
            await newVote.save();

            message.edit(await this.createMinecraftVoteMessage(message.id));

            await interaction.editReply('Vote created successfully!');
        }
    }

    public override async executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): Promise<void> {
        const selectedOption = interaction.values[0];
        const voteData = await databaseMinecraftVote.findOne({ messageId: interaction.message.id });
        if (!voteData) throw new Error('Vote not found');

        const userVote = voteData.votes.find((vote) => vote.userId === interaction.user.id);
        if (userVote) {
            userVote.vote = parseInt(selectedOption, 10);
        } else {
            voteData.votes.push({ userId: interaction.user.id, vote: parseInt(selectedOption, 10) });
        }

        await voteData.save();

        const updatedMessage = await this.createMinecraftVoteMessage(interaction.message.id);
        await interaction.update(updatedMessage);
        await interaction.followUp({
            content: 'Your vote has been recorded!',
            flags: [MessageFlags.Ephemeral]
        });
    }

    private async createMinecraftVoteMessage(messageId: string) {
        const voteData = await databaseMinecraftVote.findOne({ messageId });
        if (!voteData) throw new Error('Vote not found');

        const interactionEditReply: InteractionEditReplyOptions = {
            components: [
                new ContainerBuilder()
                    .setAccentColor(0x00d2ff)
                    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://vote.png`)))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `${voteData.description}` + `\n\nVote ends: <t:${Math.floor(voteData.endDate.getTime() / 1000)}:R>`
                        )
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                            new GargoyleStringSelectMenuBuilder(this, 'vote').addOptions(
                                voteData.options.map((option, index) => ({
                                    label: option.substring(0, 25),
                                    value: `${index}`
                                }))
                            )
                        )
                    )
            ],
            files: [
                await createBanner(voteData.title!, {
                    fillStyle: '#00d2ff',
                    textStyle: '#ffffff',
                    width: 1080,
                    height: 56,
                    fontSize: 48,
                    fontWeight: FontWeight.Bold,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    bannerStyle: 'filled',
                    fileName: `vote`
                })
            ],
            flags: [MessageFlags.IsComponentsV2]
        };

        return interactionEditReply;
    }
}

const minecraftVoteSchema = new Schema({
    ownerId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    votes: [
        {
            userId: String,
            vote: Number
        }
    ],
    endDate: {
        type: Date,
        required: true
    }
});

const databaseMinecraftVote = model('MinecraftVotes', minecraftVoteSchema);
