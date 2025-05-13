import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ChatInputCommandInteraction,
    Events,
    InteractionContextType,
    Message,
    MessageFlags,
    PermissionFlagsBits,
    TextChannel
} from 'discord.js';
import { Ollama } from 'ollama';

export default class Moderator extends GargoyleCommand {
    public override category: string = 'moderation';

    public override slashCommand = new GargoyleSlashCommandBuilder()
        .setName('ai')
        .addGuilds('750209335841390642', '324195889977622530')
        .setDescription('Experimental AI moderation tool')
        .addStringOption((option) =>
            option
                .setName('type')
                .setDescription('The moderator type')
                .setRequired(true)
                .addChoices({ name: 'Detox (Faster)', value: 'detox' }, { name: 'Ollama', value: 'ollama' })
        )
        .addStringOption((option) => option.setName('content').setDescription('The content to check').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder;

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.user.id !== '244173330431737866')
            return interaction.reply({ content: 'Sorry, this command is currently only available for beta testers.' });
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (interaction.options.getString('type', true) === 'detox') {
            // Toggle the AI moderation for the guild
            const guildId = interaction.guildId;
            const guild = await aiModeratedGuild.findOne({ guildId });
            if (!guild) {
                await aiModeratedGuild.create({ guildId, enabled: true });
                return interaction.editReply({ content: 'AI moderation enabled for this server.' });
            } else {
                guild.enabled = !guild.enabled;
                await guild.save();
                return interaction.editReply({
                    content: `AI moderation ${guild.enabled ? 'enabled' : 'disabled'} for this server.`
                });
            }
        } else {
            const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
            const model = 'gemma:2b'; // Gemma 2b seems the most promising for efficient / fast AI moderation of messages

            if (!(await modelInstalled(ollama, model))) {
                await interaction.editReply({ content: `Model \`${model}\` is not installed. Installing now...` });
                const success = await installMissing(ollama, model);
                if (!success) {
                    return interaction.editReply({ content: 'Failed to install model. Please check Ollama setup.' });
                }
            }

            const response = await ollama.chat({
                model,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an AI content moderation assistant. If a message is inappropriate, offensive, spam, or harmful, respond with "Flagged". Otherwise, respond with "Safe".'
                    },
                    { role: 'user', content: interaction.options.getString('content', true) }
                ]
            });

            return await interaction.editReply({ content: `AI Review: **${response.message.content.trim()}**` });
        }
    }

    public override events: GargoyleEvent[] = [new ReputationMessage()];
}

class ReputationMessage extends GargoyleEvent {
    public event = Events.MessageCreate as const;

    public async execute(client: GargoyleClient, message: Message): Promise<void> {
        const moderatedGuild = await aiModeratedGuild.findOne({ guildId: message.guildId });
        if (!moderatedGuild) return;
        if (!moderatedGuild.enabled) return;
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

        const response = await fetch('localhost:8000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: toModerate
            })
        });

        try {
            const toxicity = ToxicitySchema.parse(await response.json()) as Toxicity;
            const flaggedCategories = Object.entries(toxicity).filter(([_, value]) => value > 0.8);

            if (flaggedCategories.length > 0) {
                const alertChannel = (await client.channels.fetch('1371902057132462141')) as TextChannel;
                if (alertChannel?.isTextBased()) {
                    await alertChannel.send({
                        embeds: [
                            new GargoyleEmbedBuilder().setTitle('⚠️ Potentially Harmful Message Detected ⚠️').setColor('Yellow')
                                .setDescription(`**Author:** ${message.author.tag} (${message.author.id})\n
                                **Categories:** ${flaggedCategories.map(([key, value]) => `${key} (${(value * 100).toFixed(2)}%)`).join(', ')}`)
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
            console.error('Error parsing toxicity response:', error);
            return;
        }
    }
}

async function modelInstalled(ollamaClient: Ollama, modelName: string): Promise<boolean> {
    try {
        const models = await ollamaClient.list();
        return models.models.some((m) => m.name === modelName);
    } catch (error) {
        console.error('Error checking installed models:', error);
        return false;
    }
}

async function installMissing(ollamaClient: Ollama, modelName: string): Promise<boolean> {
    try {
        await ollamaClient.pull({ model: modelName });
        return true;
    } catch (error) {
        console.error(`Error installing model "${modelName}":`, error);
        return false;
    }
}

import { Schema, model } from 'mongoose';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { z } from 'zod';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';

const aiModeratedGuildSchema = new Schema({
    guildId: String,
    enabled: {
        type: Boolean,
        default: false
    }
});

const aiModeratedGuild = model('AIModeratedGuilds', aiModeratedGuildSchema);

const ToxicitySchema = z.object({
    toxicity: z.number(),
    severe_toxicity: z.number(),
    obscene: z.number(),
    threat: z.number(),
    insult: z.number(),
    identity_attack: z.number()
});
type Toxicity = z.infer<typeof ToxicitySchema>;
