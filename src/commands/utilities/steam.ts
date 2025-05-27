import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleSlashCommandBuilder from '@builders/gargoyleSlashCommandBuilder.js';
import { ChatInputCommandInteraction, InteractionContextType } from 'discord.js';
import SteamAPI from 'steamapi';

export default class Steam extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('steam')
            .setDescription('Steam related commands')
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('64id')
                    .setDescription('Resolve a users steam64id from a link')
                    .addStringOption((option) => option.setName('user').setDescription('The user to resolve').setRequired(true))
            )
            .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM]) as GargoyleSlashCommandBuilder
    ];
    public override textCommands = [];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === '64id') {
            if (!process.env.STEAM_API) {
                await interaction.reply({
                    content: 'This command is unavailable as no Steam API key has been set for this bot, contact the owner / developer'
                });
                return;
            }

            await interaction.deferReply();

            const steam = new SteamAPI(process.env.STEAM_API);

            try {
                const resolved = await steam.resolve(interaction.options.getString('64id', true));
                await interaction.editReply({
                    content: `
                [${resolved}](https://steamcommunity.com/profiles/${resolved})`
                });
            } catch (err) {
                await interaction.editReply(`Failed to resolve input: ${err as string}`);
            }
        }
    }
}
