import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import {
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
} from 'discord.js';
import { Ollama } from 'ollama';

export default class Moderator extends GargoyleCommand {
    public override category: string = 'moderation';

    public override slashCommand = new GargoyleSlashCommandBuilder()
        .setName('ai')
        .addGuild('750209335841390642')
        .setDescription('Experimental AI moderation tool')
        .addStringOption((option)=>option.setName("content").setDescription("The content to check").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder;

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
                    content: 'You are an AI content moderation assistant. If a message is inappropriate, offensive, spam, or harmful, respond with "Flagged". Otherwise, respond with "Safe".',
                },
                { role: 'user', content: interaction.options.getString('content', true) },
            ],
        });

        return await interaction.editReply({ content: `AI Review: **${response.message.content.trim()}**` });
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
