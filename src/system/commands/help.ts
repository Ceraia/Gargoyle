import TextCommandBuilder from '@builders/textCommandBuilder.js';
import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/classes/gargoyleCommand.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Message,
    SlashCommandBuilder
} from 'discord.js';
import GargoyleButtonBuilder from '@builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@builders/gargoyleEmbedBuilder.js';

export default class Help extends GargoyleCommand {
    public override category: string = 'base';
    public override slashCommand = new SlashCommandBuilder().setName('help').setDescription('Replies with bot information');
    public override textCommand = new TextCommandBuilder().setName('help').setDescription('Replies with bot information').addAlias('h');
    private readonly helpMessage = {
        embeds: [
            new EmbedBuilder()
                .setTitle('Gargoyle')
                .setColor(0x2b2d31)
                .setDescription(
                    'A bot made by [Axodouble](https://axodouble.com).\n' +
                        'Distriobuted, hosted & developed by [Ceraia](https://ceraia.com).' +
                        'This bot is built on the Gargoyle, a custom bot framework.\n\n' +
                        'This bot is still in very early development and major changes are expected,\n' +
                        'If you have any suggestions or issues, please contact Axodouble.'
                )
        ],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new GargoyleButtonBuilder(this, 'Commands').setStyle(ButtonStyle.Secondary))]
    };

    public override executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        interaction.reply(this.helpMessage);
    }

    public override executeTextCommand(_client: GargoyleClient, message: Message) {
        message.reply(this.helpMessage);
    }

    public override async executeButtonCommand(client: GargoyleClient, argument: string, interaction: ButtonInteraction): Promise<void> {
        if (argument === 'commands') {
            const message = await this.generateSlashHelpMessage(client);
            await interaction.update(message);
        } else if (argument === 'text') {
            const message = await this.generateTextHelpMessage(client);
            await interaction.update(message);
        }
    }

    private async generateSlashHelpMessage(client: GargoyleClient): Promise<object> {
        const embed = new GargoyleEmbedBuilder().setTitle('Slash Commands');
        await client.commands.forEach((command) => {
            if (command.slashCommand) embed.addFields({ name: command.slashCommand?.name, value: command.slashCommand?.description });
        });

        return {
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new GargoyleButtonBuilder(this, 'commands').setStyle(ButtonStyle.Primary).setLabel('Slash Commands'),
                    new GargoyleButtonBuilder(this, 'text').setStyle(ButtonStyle.Secondary).setLabel('Text Commands')
                )
            ]
        };
    }

    private async generateTextHelpMessage(client: GargoyleClient): Promise<object> {
        const embed = new GargoyleEmbedBuilder().setTitle('Text Commands');
        await client.commands.forEach((command) => {
            if (command.textCommand) {
                let name = command.textCommand.name;
                if (command.textCommand?.aliases) {
                    name += `(${command.textCommand.aliases.join(', ')})`;
                }
                embed.addFields({ name: name, value: command.textCommand.description });
            }
        });

        return {
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new GargoyleButtonBuilder(this, 'commands').setStyle(ButtonStyle.Secondary).setLabel('Slash Commands'),
                    new GargoyleButtonBuilder(this, 'text').setStyle(ButtonStyle.Primary).setLabel('Text Commands')
                )
            ]
        };
    }
}
