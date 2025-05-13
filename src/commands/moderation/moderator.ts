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
        .addGuild("750209335841390642")
        .setDescription('Experimental AI features')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder;

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })
        const response = await ollama.chat({
          model: 'llama3.1',
          messages: [{ role: 'user', content: 'Why is the sky blue?' }],
        })
        interaction.editReply({content: response.message.content })
    }
}
