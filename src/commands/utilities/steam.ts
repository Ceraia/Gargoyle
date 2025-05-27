import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleSlashCommandBuilder from '@builders/gargoyleSlashCommandBuilder.js';
import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    InteractionContextType,
    SectionBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder
} from 'discord.js';
import SteamAPI from 'steamapi';
import { GargoyleURLButtonBuilder } from '@src/system/backend/builders/gargoyleButtonBuilder.js';

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
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('profile')
                    .setDescription('View someones steam profile')
                    .addStringOption((option) => option.setName('user').setDescription('The user whose profile to view').setRequired(true))
            )
            .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM]) as GargoyleSlashCommandBuilder
    ];
    public override textCommands = [];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (!process.env.STEAM_API) {
            await interaction.reply({
                content: 'This command is unavailable as no Steam API key has been set for this bot, contact the owner / developer'
            });
            return;
        }

        await interaction.deferReply();
        const steam = new SteamAPI(process.env.STEAM_API);
        if (interaction.options.getSubcommand() === '64id') {
            try {
                const resolved = await steam.resolve(interaction.options.getString('user', true));
                await interaction.editReply({
                    content: `
                [${resolved}](https://steamcommunity.com/profiles/${resolved})`
                });
            } catch (err) {
                await interaction.editReply(`Failed to resolve input: ${err as string}`);
            }
        } else if (interaction.options.getSubcommand() === 'profile') {
            try {
                const resolved = await steam.getUserSummary(interaction.options.getString('user', true));

                await interaction.editReply({
                    components: [
                        new ContainerBuilder().addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(
                                        `#${resolved.nickname}` + 
                                        resolved.realName ? `> - Name : ${resolved.realName}` : `` +
                                        resolved.lastLogOffAt ? `> - Last Seen : ${resolved.lastLogOffAt}` : `` +
                                        resolved.countryCode ? `> - Country Code : ${resolved.countryCode}` : `` +
                                        resolved.createdAt ? `> - Created at : ${resolved.createdAt}` : `` +
                                        resolved.steamID ? `> - Steam ID : ${resolved.steamID}` : `` 
                                    )
                                ).setButtonAccessory(new GargoyleURLButtonBuilder(resolved.url).setLabel('Profile Link'))
                                .setThumbnailAccessory(new ThumbnailBuilder().setURL(resolved.avatar.medium).setDescription(`${resolved.nickname}`))
                        )
                    ]
                });
            } catch (err) {
                await interaction.editReply(`Failed to resolve input: ${err as string}`);
            }
        }
    }
}
