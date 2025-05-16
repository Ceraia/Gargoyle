import GargoyleTextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    ContainerBuilder,
    EmbedBuilder,
    Guild,
    Message,
    MessageEditOptions,
    MessageFlags,
    MessageReplyOptions,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextDisplayBuilder
} from 'discord.js';
import { GargoyleStringSelectMenuBuilder } from '@builders/gargoyleSelectMenuBuilders.js';
import GargoyleSlashCommandBuilder from '../backend/builders/gargoyleSlashCommandBuilder.js';

export default class Help extends GargoyleCommand {
    override category: string = 'base';
    override slashCommands = [new GargoyleSlashCommandBuilder().setName('help').setDescription('Replies with bot information')];
    override textCommands = [new GargoyleTextCommandBuilder().setName('help').setDescription('Replies with bot information').addAlias('h')];
    private readonly selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new GargoyleStringSelectMenuBuilder(this, 'commands').addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Info Message').setValue('info'),
            new StringSelectMenuOptionBuilder().setLabel('Slash Commands').setValue('commands'),
            new StringSelectMenuOptionBuilder().setLabel('Text Commands').setValue('text')
        )
    );
    private readonly helpMessage: MessageEditOptions = {
        content: undefined,
        embeds: [],
        components: [
            new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    'A bot made by [Axodouble](https://axodouble.com).\n' +
                        'Distriobuted, hosted & developed by [Ceraia](https://ceraia.com).' +
                        'This bot is built on Gargoyle, a custom bot framework.\n\n' +
                        'This bot is still in very early development and major changes are expected,\n' +
                        'If you have any suggestions or issues, please contact Axodouble.'
                )
            ),
            this.selectMenu
        ],
        flags: [MessageFlags.IsComponentsV2]
    };

    override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        interaction.editReply(this.helpMessage);
    }

    override executeTextCommand(_client: GargoyleClient, message: Message) {
        message.reply(this.helpMessage as MessageReplyOptions);
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
        const container = new ContainerBuilder();

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('Slash Commands'));
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

        let commandText = ``;
        for (const command of client.commands) {
            for (const slashCommand of command.slashCommands) {
                if (slashCommand.private) continue;

                if (slashCommand.guilds && guild) {
                    if (!slashCommand.guilds.includes(guild.id)) continue;
                }
                commandText += `\`${slashCommand.name}\` \n> ${slashCommand.description}\n\n`;
            }
        }

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(commandText));

        return {
            components: [container, this.selectMenu],
            flags: [MessageFlags.IsComponentsV2]
        };
    }

    private async generateTextHelpMessage(client: GargoyleClient, guild?: Guild): Promise<object> {
        const container = new ContainerBuilder();

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('Text Commands'));
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

        let commandText = ``;
        for (const command of client.commands) {
            for (const textCommand of command.textCommands) {
                if (textCommand.private) continue;

                if (textCommand.guilds && guild) {
                    if (!textCommand.guilds.includes(guild.id)) continue;
                }
                commandText += `\`${textCommand.name}\` ${textCommand.aliases.length > 0 ? `(${textCommand.aliases.join('|')})` : null}\n> ${textCommand.description}\n\n`;
            }
        }

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(commandText));

        return {
            components: [container, this.selectMenu],
            flags: [MessageFlags.IsComponentsV2]
        };
    }
}
