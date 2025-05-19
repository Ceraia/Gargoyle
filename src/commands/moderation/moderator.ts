import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ChannelType,
    ChatInputCommandInteraction,
    Events,
    InteractionContextType,
    Message,
    MessageFlags,
    PermissionFlagsBits,
    TextChannel
} from 'discord.js';

export default class Moderator extends GargoyleCommand {
    public override category: string = 'moderation';

    public override slashCommands = [new GargoyleSlashCommandBuilder()
        .setName('ai')
        .addGuilds('750209335841390642', '324195889977622530')
        .setDescription('Experimental AI moderation tool')
        .addSubcommand((option) =>
            option
                .setName('enable')
                .setDescription('Whether to enable or disable AI moderation')
                .addStringOption((option) =>
                    option
                        .setName('state')
                        .setDescription('Whether it is enabled or disabled')
                        .setRequired(true)
                        .setChoices({ name: 'Enabled', value: 'enabled' }, { name: 'Disabled', value: 'disabled' })
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('channel')
                .setDescription('Set a channel for alerts')
                .addChannelOption((option) =>
                    option.setName('channel').setDescription('The channel to send alerts to').setRequired(true).addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommandGroup((subcommandGroup) =>
            subcommandGroup
                .setName('thresholds')
                .setDescription('Set the thresholds for the AI moderator')
                .addSubcommand((subcommand) => subcommand.setName('list').setDescription('List the current thresholds'))
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('toxicity')
                        .setDescription('Set the threshold for when alerts should be sent')
                        .addNumberOption((option) =>
                            option.setName('threshold').setDescription('The threshold').setMinValue(0).setMaxValue(1).setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('severe_toxicity')
                        .setDescription('Set the threshold for when alerts should be sent')
                        .addNumberOption((option) =>
                            option.setName('threshold').setDescription('The threshold').setMinValue(0).setMaxValue(1).setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('obscene')
                        .setDescription('Set the threshold for when alerts should be sent')
                        .addNumberOption((option) =>
                            option.setName('threshold').setDescription('The threshold').setMinValue(0).setMaxValue(1).setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('threat')
                        .setDescription('Set the threshold for when alerts should be sent')
                        .addNumberOption((option) =>
                            option.setName('threshold').setDescription('The threshold').setMinValue(0).setMaxValue(1).setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('insult')
                        .setDescription('Set the threshold for when alerts should be sent')
                        .addNumberOption((option) =>
                            option.setName('threshold').setDescription('The threshold').setMinValue(0).setMaxValue(1).setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('identity_attack')
                        .setDescription('Set the threshold for when alerts should be sent')
                        .addNumberOption((option) =>
                            option.setName('threshold').setDescription('The threshold').setMinValue(0).setMaxValue(1).setRequired(true)
                        )
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if(!client.db || client.db.readyState !== 1) return interaction.reply({ content: 'AI moderation is unavailable at this time.' });
        if (!process.env.DETOXIFY_API) return interaction.reply({ content: 'AI moderation is unavailable for this guild.' });
        if (interaction.user.id !== '244173330431737866')
            return interaction.reply({ content: 'Sorry, this command is currently only available for beta testers.' });
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const guildId = interaction.guildId;

        let guild = await aiModeratedGuild.findOne({ guildId });

        if (!guild) guild = await aiModeratedGuild.create({ guildId, enabled: false });

        if (!guild) return await interaction.editReply({ content: 'An unexpected issue has occured with the database.' });

        if (interaction.options.getSubcommand() === 'enable') {
            if (interaction.options.getString('state', true) === 'enabled') {
                guild.enabled = true;
                await guild.save();
                return interaction.editReply({ content: 'AI moderation enabled for this server.' });
            } else {
                guild.enabled = false;
                await guild.save();
                return interaction.editReply({ content: 'AI moderation disabled for this server.' });
            }
        } else if (interaction.options.getSubcommand() === 'channel') {
            guild.channelId = interaction.options.getChannel('channel', true).id;
            await guild.save();
            return interaction.editReply({
                content: `AI moderation ${guild.enabled ? 'enabled' : 'disabled'} for this server, with logs sent to <#${guild.channelId}>`
            });
        } else if (interaction.options.getSubcommandGroup() === 'thresholds') {
            if (interaction.options.getSubcommand() === 'list') {
                let thresholds = `AI Moderation Thresholds\n`;
                thresholds += `Toxicity Threshold \`${guild.thresholds.toxicity}\`\n`;
                thresholds += `Severe Toxicity Threshold \`${guild.thresholds.severe_toxicity}\`\n`;
                thresholds += `Obscenity Threshold \`${guild.thresholds.obscene}\`\n`;
                thresholds += `Threat Threshold \`${guild.thresholds.threat}\`\n`;
                thresholds += `Insult Threshold \`${guild.thresholds.insult}\`\n`;
                thresholds += `Identity Attacks Threshold \`${guild.thresholds.identity_attack}\``;

                return interaction.editReply({ content: thresholds });
            } else if (interaction.options.getSubcommand() === 'toxicity') {
                guild.thresholds.toxicity = interaction.options.getNumber('threshold', true);
                await guild.save();
                return interaction.editReply({ content: `Set the threshold for \`toxicity\` to \`${guild.thresholds.toxicity}\`` });
            } else if (interaction.options.getSubcommand() === 'severe_toxicity') {
                guild.thresholds.severe_toxicity = interaction.options.getNumber('threshold', true);
                await guild.save();
                return interaction.editReply({ content: `Set the threshold for \`severe_toxicity\` to \`${guild.thresholds.severe_toxicity}\`` });
            } else if (interaction.options.getSubcommand() === 'obscene') {
                guild.thresholds.obscene = interaction.options.getNumber('threshold', true);
                await guild.save();
                return interaction.editReply({ content: `Set the threshold for \`obscene\` to \`${guild.thresholds.obscene}\`` });
            } else if (interaction.options.getSubcommand() === 'threat') {
                guild.thresholds.threat = interaction.options.getNumber('threshold', true);
                await guild.save();
                return interaction.editReply({ content: `Set the threshold for \`threat\` to \`${guild.thresholds.threat}\`` });
            } else if (interaction.options.getSubcommand() === 'insult') {
                guild.thresholds.insult = interaction.options.getNumber('threshold', true);
                await guild.save();
                return interaction.editReply({ content: `Set the threshold for \`insult\` to \`${guild.thresholds.insult}\`` });
            } else if (interaction.options.getSubcommand() === 'identity_attack') {
                guild.thresholds.identity_attack = interaction.options.getNumber('threshold', true);
                await guild.save();
                return interaction.editReply({ content: `Set the threshold for \`identity_attack\` to \`${guild.thresholds.identity_attack}\`` });
            } else {
                return interaction.reply('An unexpected error occured with this command');
            }
        } else {
            return interaction.reply('An unexpected error occured with this command');
        }
    }

    public override events: GargoyleEvent[] = [new ModeratedMessage()];
}

class ModeratedMessage extends GargoyleEvent {
    public event = Events.MessageCreate as const;
    private hasErrored = false;

    public async execute(client: GargoyleClient, message: Message): Promise<void> {
        if(!client.db || client.db.readyState !== 1) return;
        if (!process.env.DETOXIFY_API) return;
        if (this.hasErrored) return;
        const moderatedGuild = await aiModeratedGuild.findOne({ guildId: message.guildId });
        if (!moderatedGuild || !moderatedGuild.enabled || !moderatedGuild.channelId) return;
        if (message.author.id === client.user?.id) return;

        let toModerate = message.content + ' ';
        toModerate += message.embeds.map((embed) =>
            [
                embed.description,
                embed.title,
                embed.footer?.text,
                embed.author?.name,
                ...(embed.fields?.map((field) => `${field.name} ${field.value}`) || [])
            ].join(' ')
        );

        const response = await fetch(process.env.DETOXIFY_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: toModerate
            })
        }).catch((error) => {
            console.error('Error fetching detoxify moderation:', error, 'Disabling AI moderation');
            this.hasErrored = true;
        });

        if (this.hasErrored || !response) return;

        try {
            const detoxify = DetoxifyResponseSchema.parse(await response.json()) as DetoxifyResponse;
            const flaggedCategories = Object.entries(detoxify).filter(([_, value]) => value > 0.8);

            if (
                moderatedGuild.thresholds.toxicity > detoxify.toxicity &&
                moderatedGuild.thresholds.severe_toxicity > detoxify.severe_toxicity &&
                moderatedGuild.thresholds.obscene > detoxify.obscene &&
                moderatedGuild.thresholds.threat > detoxify.threat &&
                moderatedGuild.thresholds.insult > detoxify.insult &&
                moderatedGuild.thresholds.identity_attack > detoxify.identity_attack
            )
                return;

            if (flaggedCategories.length > 0) {
                const alertChannel = (await client.channels.fetch(moderatedGuild.channelId)) as TextChannel;
                if (alertChannel?.isTextBased()) {
                    await alertChannel.send({
                        embeds: [
                            new GargoyleEmbedBuilder()
                                .setTitle('⚠️ Potentially Harmful Message Detected ⚠️')
                                .setColor('Yellow')
                                .setDescription(
                                    `**Author:** ${message.author.tag} (${message.author.id})\n**Categories:** ${flaggedCategories.map(([key, value]) => `${key} (${(value * 100).toFixed(2)}%)`).join(', ')}`
                                )
                        ],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder()
                                    .setLabel('View Message')
                                    .setStyle(5)
                                    .setURL(`https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`)
                            )
                        ]
                    });
                }
            }
        } catch (error) {
            console.error('Error parsing detoxify response:', error);
            return;
        }
    }
}

import { Schema, model } from 'mongoose';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { z } from 'zod';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import client from '@src/system/botClient.js';

const thresholdsSchema = new Schema(
    {
        toxicity: {
            type: Number,
            default: 0.8
        },
        severe_toxicity: {
            type: Number,
            default: 0.5
        },
        obscene: {
            type: Number,
            default: 0.8
        },
        threat: {
            type: Number,
            default: 0.5
        },
        insult: {
            type: Number,
            default: 0.8
        },
        identity_attack: {
            type: Number,
            default: 0.5
        }
    },
    { _id: false }
);

const aiModeratedGuildSchema = new Schema({
    guildId: String,
    channelId: String,
    enabled: {
        type: Boolean,
        default: false
    },
    thresholds: {
        type: thresholdsSchema,
        default: () => ({})
    }
});

const aiModeratedGuild = model('AIModeratedGuilds', aiModeratedGuildSchema);

const DetoxifyResponseSchema = z.object({
    toxicity: z.number(),
    severe_toxicity: z.number(),
    obscene: z.number(),
    threat: z.number(),
    insult: z.number(),
    identity_attack: z.number()
});
type DetoxifyResponse = z.infer<typeof DetoxifyResponseSchema>;
