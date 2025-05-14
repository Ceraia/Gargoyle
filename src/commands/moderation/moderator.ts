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

    public override slashCommand = new GargoyleSlashCommandBuilder()
        .setName('ai')
        .addGuilds('750209335841390642', '324195889977622530')
        .setDescription('Experimental AI moderation tool')
        .addChannelOption((option) =>
            option.setName('channel').setDescription('The channel to send alerts to').setRequired(true).addChannelTypes(ChannelType.GuildText)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder;

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (!process.env.DETOXIFY_API) return interaction.reply({ content: 'AI moderation is unavailable.' });
        if (interaction.user.id !== '244173330431737866')
            return interaction.reply({ content: 'Sorry, this command is currently only available for beta testers.' });
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const guildId = interaction.guildId;
        const guild = await aiModeratedGuild.findOne({ guildId });
        if (!guild) {
            await aiModeratedGuild.create({ guildId, enabled: true, channelId: interaction.options.getChannel('channel', true).id });
            return interaction.editReply({ content: 'AI moderation enabled for this server.' });
        } else {
            guild.enabled = !guild.enabled;
            guild.channelId = interaction.options.getChannel('channel', true).id;
            await guild.save();
            return interaction.editReply({
                content: `AI moderation ${guild.enabled ? 'enabled' : 'disabled'} for this server.`
            });
        }
    }

    public override events: GargoyleEvent[] = [new ReputationMessage()];
}

class ReputationMessage extends GargoyleEvent {
    public event = Events.MessageCreate as const;
    private hasErrored = false;

    public async execute(client: GargoyleClient, message: Message): Promise<void> {
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

            if (flaggedCategories.length > 0) {
                const alertChannel = (await client.channels.fetch(moderatedGuild.channelId)) as TextChannel;
                if (alertChannel?.isTextBased()) {
                    await alertChannel.send({
                        embeds: [
                            new GargoyleEmbedBuilder().setTitle('⚠️ Potentially Harmful Message Detected ⚠️').setColor('Yellow')
                                .setDescription(`**Author:** ${message.author.tag} (${message.author.id})\n**Categories:** ${flaggedCategories.map(([key, value]) => `${key} (${(value * 100).toFixed(2)}%)`).join(', ')}`)
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

const aiModeratedGuildSchema = new Schema({
    guildId: String,
    channelId: String,
    enabled: {
        type: Boolean,
        default: false
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
