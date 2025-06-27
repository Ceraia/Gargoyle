import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleSlashCommandBuilder from '@builders/gargoyleSlashCommandBuilder.js';
import { ChatInputCommandInteraction, InteractionContextType, MessageFlags } from 'discord.js';
import { Ollama } from 'ollama';

export default class Steam extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('ollama')
            .setDescription('Ollama related commands')
            .addGuild('750209335841390642')
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('question')
                    .setDescription('Ask a question to qwen3:0.6b')
                    .addStringOption((option) => option.setName('question').setDescription('User prompt').setRequired(true))
                    .addStringOption((option) => option.setName('system').setDescription('System prompt').setRequired(false))
            )
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];
    private ollama = new Ollama({
        host: process.env.OLLAMA_HOST || 'http://ollama:11434'
    });

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (interaction.options.getSubcommand() === 'question') {
            const question = interaction.options.getString('question', true);
            const systemPrompt = interaction.options.getString('system');

            const models = await this.ollama.list();

            if (!models.models.some((model) => model.name === 'qwen3:0.6b')) {
                await interaction.editReply({
                    content: 'The model `qwen3:0.6b` is not yet loaded, it will download and load it now. This may take a while.'
                });
                await this.ollama.pull({ model: 'qwen3:0.6b' }).catch((err) => {
                    interaction.editReply(`Failed to pull model: ${err as string}`);
                    return;
                });
            }

            let messages = [{ role: 'user', content: question }];
            if (systemPrompt) {
                messages.unshift({ role: 'system', content: systemPrompt });
            }

            try {
                const response = await this.ollama.chat({
                    model: 'qwen3:0.6b',
                    messages: messages,
                    stream: false
                });

                await interaction.editReply({
                    content: response.message.content
                });
            } catch (err) {
                await interaction.editReply(`Failed to get response: ${err as string}`);
            }
        }
    }
}
