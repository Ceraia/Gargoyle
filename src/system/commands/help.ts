import GargoyleTextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Guild,
    Message,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from 'discord.js';
import GargoyleEmbedBuilder from '@builders/gargoyleEmbedBuilder.js';
import { GargoyleStringSelectMenuBuilder } from '@builders/gargoyleSelectMenuBuilders.js';
import GargoyleSlashCommandBuilder from '../backend/builders/gargoyleSlashCommandBuilder.js';

export default class Help extends GargoyleCommand {
    override category: string = 'base';
    override slashCommand = new GargoyleSlashCommandBuilder().setName('help').setDescription('Replies with bot information');
    override textCommand = new GargoyleTextCommandBuilder().setName('help').setDescription('Replies with bot information').addAlias('h');
    private readonly selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new GargoyleStringSelectMenuBuilder(this, 'commands').addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Info Message').setValue('info'),
            new StringSelectMenuOptionBuilder().setLabel('Slash Commands').setValue('commands'),
            new StringSelectMenuOptionBuilder().setLabel('Text Commands').setValue('text')
        )
    );
    private readonly helpMessage = {
        embeds: [
            new EmbedBuilder()
                .setTitle('Gargoyle')
                .setColor(0x2b2d31)
                .setDescription(
                    'A bot made by [Axodouble](https://axodouble.com).\n' +
                        'Distriobuted, hosted & developed by [Ceraia](https://ceraia.com).' +
                        'This bot is built on Gargoyle, a custom bot framework.\n\n' +
                        'This bot is still in very early development and major changes are expected,\n' +
                        'If you have any suggestions or issues, please contact Axodouble.'
                )
        ],
        components: [this.selectMenu]
    };

    override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        interaction.followUp(this.helpMessage);
    }

    override executeTextCommand(_client: GargoyleClient, message: Message) {
        message.reply(this.helpMessage);
    }

    override async executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...argument: string[]): Promise<void> {
        if (argument[0] === 'commands') {
            if (interaction.values[0] === 'commands') {
                const message = await this.generateSlashHelpMessage(client, interaction.guild ? interaction.guild : undefined);
                await interaction.update(message);
            } else if (interaction.values[0] === 'text') {
                const message = await this.generateTextHelpMessage(client, interaction.guild ? interaction.guild : undefined);
                await interaction.update(message);
            } else {
                await interaction.update(this.helpMessage);
            }
        }
    }

    override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...argument: string[]): Promise<void> {
        if (argument[0] === 'commands') {
            const message = await this.generateSlashHelpMessage(client, interaction.guild ? interaction.guild : undefined);
            await interaction.update(message);
        } else if (argument[0] === 'text') {
            const message = await this.generateTextHelpMessage(client, interaction.guild ? interaction.guild : undefined);
            await interaction.update(message);
        }
    }

    private async generateSlashHelpMessage(client: GargoyleClient, guild?: Guild): Promise<object> {
        const embed = new GargoyleEmbedBuilder().setTitle('Slash Commands');
        await client.commands.forEach((command) => {
            if (command.slashCommand) {
                if (!command.slashCommand.private) return;

                if (command.slashCommand.guilds && guild) {
                    if (!command.slashCommand.guilds.includes(guild.id)) return;
                }

                embed.addFields({ name: command.slashCommand?.name, value: command.slashCommand?.description });
            }

            if (command.slashCommands) {
                command.slashCommands.forEach((slashCommand) => {
                    if (slashCommand.private) return;

                    if (slashCommand.guilds && guild) {
                        if (!slashCommand.guilds.includes(guild.id)) return;
                    }

                    embed.addFields({ name: slashCommand.name, value: slashCommand.description });
                });
            }
        });

        return {
            embeds: [embed],
            components: [this.selectMenu]
        };
    }

    private async generateTextHelpMessage(client: GargoyleClient, guild?: Guild): Promise<object> {
        const embed = new GargoyleEmbedBuilder().setTitle('Text Commands');
        await client.commands.forEach((command) => {
            if (command.textCommand) {
                if (command.textCommand.private) return;

                if (command.textCommand.guilds && guild) {
                    if (!command.textCommand.guilds.includes(guild.id)) return;
                }

                let name = command.textCommand.name;
                if (command.textCommand?.aliases) {
                    name += command.textCommand.aliases.length > 0 ? ` (${command.textCommand.aliases.join(', ')})` : '';
                }
                embed.addFields({ name: name, value: command.textCommand.description });
            } else if (command.textCommands) {
                command.textCommands.forEach((textCommand) => {
                    if (textCommand.private) return;

                    if (textCommand.guilds && guild) {
                        if (!textCommand.guilds.includes(guild.id)) return;
                    }

                    let name = textCommand.name;
                    if (textCommand.aliases) {
                        name += textCommand.aliases.length > 0 ? ` (${textCommand.aliases.join(', ')})` : '';
                    }
                    embed.addFields({ name: name, value: textCommand.description });
                });
            }
        });

        return {
            embeds: [embed],
            components: [this.selectMenu]
        };
    }
}
