import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import { ChatInputCommandInteraction, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
export default class Fun extends GargoyleCommand {
    public override category: string = 'fun';
    public override slashCommand = new SlashCommandBuilder()
        .setName('fun')
        .setDescription('Fun related commands!')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('aesthetic')
                .setDescription('Change text to look like ｔｈｉｓ.')
                .addStringOption((option) =>
                    option
                        .setName('text')
                        .setDescription('The text to change.')
                        .setRequired(true)
                        .setMaxLength(2000)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('upside-down')
                .setDescription('Flip text.')
                .addStringOption((option) =>
                    option
                        .setName('text')
                        .setDescription('The text to flip.')
                        .setRequired(true)
                        .setMaxLength(2000)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('uwu')
                .setDescription('UwUify text.')
                .addStringOption((option) =>
                    option
                        .setName('text')
                        .setDescription('The text to UwUify.')
                        .setRequired(true)
                        .setMaxLength(2000)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('mock')
                .setDescription('Mock text.')
                .addStringOption((option) =>
                    option
                        .setName('text')
                        .setDescription('The text to mock.')
                        .setRequired(true)
                        .setMaxLength(2000)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('clap')
                .setDescription('Clap text.')
                .addStringOption((option) =>
                    option
                        .setName('text')
                        .setDescription('The text to clap.')
                        .setRequired(true)
                        .setMaxLength(2000)
                )
        )
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM]) as SlashCommandBuilder;

    public override executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();

        const text = interaction.options.getString('text');

        if(!text) return null;

        if (subcommand === 'aesthetic') {
            return interaction.reply({
                content: text
                    .replace(/ /g, '　')
                    .replace(/a/g, 'ａ')
                    .replace(/b/g, 'ｂ')
                    .replace(/c/g, 'ｃ')
                    .replace(/d/g, 'ｄ')
                    .replace(/e/g, 'ｅ')
                    .replace(/f/g, 'ｆ')
                    .replace(/g/g, 'ｇ')
                    .replace(/h/g, 'ｈ')
                    .replace(/i/g, 'ｉ')
                    .replace(/j/g, 'ｊ')
                    .replace(/k/g, 'ｋ')
                    .replace(/l/g, 'ｌ')
                    .replace(/m/g, 'ｍ')
                    .replace(/n/g, 'ｎ')
                    .replace(/o/g, 'ｏ')
                    .replace(/p/g, 'ｐ')
                    .replace(/q/g, 'ｑ')
                    .replace(/r/g, 'ｒ')
                    .replace(/s/g, 'ｓ')
                    .replace(/t/g, 'ｔ')
                    .replace(/u/g, 'ｕ')
                    .replace(/v/g, 'ｖ')
                    .replace(/w/g, 'ｗ')
                    .replace(/x/g, 'ｘ')
                    .replace(/y/g, 'ｙ')
                    .replace(/z/g, 'ｚ')
                    .replace(/A/g, 'Ａ')
                    .replace(/B/g, 'Ｂ')
                    .replace(/C/g, 'Ｃ')
                    .replace(/D/g, 'Ｄ')
                    .replace(/E/g, 'Ｅ')
                    .replace(/F/g, 'Ｆ')
                    .replace(/G/g, 'Ｇ')
                    .replace(/H/g, 'Ｈ')
                    .replace(/I/g, 'Ｉ')
                    .replace(/J/g, 'Ｊ')
                    .replace(/K/g, 'Ｋ')
                    .replace(/L/g, 'Ｌ')
                    .replace(/M/g, 'Ｍ')
                    .replace(/N/g, 'Ｎ')
                    .replace(/O/g, 'Ｏ')
                    .replace(/P/g, 'Ｐ')
                    .replace(/Q/g, 'Ｑ')
                    .replace(/R/g, 'Ｒ')
                    .replace(/S/g, 'Ｓ')
                    .replace(/T/g, 'Ｔ')
                    .replace(/U/g, 'Ｕ')
                    .replace(/V/g, 'Ｖ')
                    .replace(/W/g, 'Ｗ')
                    .replace(/X/g, 'Ｘ')
                    .replace(/Y/g, 'Ｙ')
                    .replace(/Z/g, 'Ｚ'),
                flags: MessageFlags.Ephemeral
            } );
        }
        if (subcommand === 'upside-down') {
            return interaction.reply({
                content: text
                    .split('')
                    .reverse()
                    .join('')
                    .replace(/a/g, 'ɐ')
                    .replace(/b/g, 'q')
                    .replace(/c/g, 'ɔ')
                    .replace(/e/g, 'ǝ')
                    .replace(/f/g, 'ɟ')
                    .replace(/g/g, 'ƃ')
                    .replace(/h/g, 'ɥ')
                    .replace(/i/g, 'ᴉ')
                    .replace(/j/g, 'ɾ')
                    .replace(/k/g, 'ʞ')
                    .replace(/m/g, 'ɯ')
                    .replace(/p/g, 'd')
                    .replace(/q/g, 'b')
                    .replace(/r/g, 'ɹ')
                    .replace(/t/g, 'ʇ')
                    .replace(/u/g, '⋳')
                    .replace(/n/g, 'u')
                    .replace(/⋳/g, 'n')
                    .replace(/v/g, 'ʌ')
                    .replace(/w/g, 'ʍ')
                    .replace(/y/g, 'ʎ')
                    .replace(/A/g, '∀')
                    .replace(/B/g, 'q')
                    .replace(/C/g, 'Ɔ')
                    .replace(/D/g, 'p')
                    .replace(/d/g, 'p')
                    .replace(/E/g, 'Ǝ')
                    .replace(/F/g, 'Ⅎ')
                    .replace(/G/g, 'פ')
                    .replace(/J/g, 'ſ')
                    .replace(/K/g, 'ʞ')
                    .replace(/L/g, '˥')
                    .replace(/M/g, 'W')
                    .replace(/P/g, 'Ԁ')
                    .replace(/R/g, 'ɹ')
                    .replace(/T/g, '┴')
                    .replace(/U/g, '∩')
                    .replace(/V/g, 'Λ')
                    .replace(/W/g, 'M')
                    .replace(/Y/g, '⅄'), flags: MessageFlags.Ephemeral
            });
        }
        if (subcommand === 'uwu') {
            return interaction.reply({
                content: text
                    .replace(/(?:r|l)/g, 'w')
                    .replace(/(?:R|L)/g, 'W')
                    .replace(/n([aeiou])/g, 'ny$1')
                    .replace(/N([aeiou])/g, 'Ny$1')
                    .replace(/N([AEIOU])/g, 'Ny$1')
                    .replace(/ove/g, 'uv')
                    .replace(/th/g, 'd')
                    .replace(/Th/g, 'D')
                    .replace(/TH/g, 'D')
                    .replace(/ove/g, 'uv'), flags: MessageFlags.Ephemeral
            });
        }
        if (subcommand === 'mock') {
            return interaction.reply({
                content: text
                    .split('')
                    .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
                    .join(''), flags: MessageFlags.Ephemeral
            });
        }
        if (subcommand === 'clap') {
            return interaction.reply({ content: text.replace(/ /g, ' 👏 '), flags: MessageFlags.Ephemeral });
        }

        return interaction.reply({ content: text });
    }
}
