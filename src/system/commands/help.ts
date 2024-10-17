import TextCommandBuilder from '@src/system/builders/textCommandBuilder.js';
import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/classes/gargoyleCommand.js';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from 'discord.js';
import GargoyleButtonBuilder from '../builders/gargoyleButtonBuilder.js';

export default class Help extends GargoyleCommand {
    public override category: string = 'base';
    public override slashCommand = new SlashCommandBuilder().setName('help').setDescription('Replies with bot information');
    public override textCommand = new TextCommandBuilder().setName('help').setDescription('Replies with bot information').addAlias('h');

    public override executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        interaction.reply({
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
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new GargoyleButtonBuilder(this, 'Commands').setStyle(ButtonStyle.Danger))]
        });
    }

    public override executeTextCommand(_client: GargoyleClient, message: Message) {
        message.reply('Pong!');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public override executeButtonCommand(client: GargoyleClient, argument: string, _interaction: ButtonInteraction): void {
        if (argument === 'commands') {
            client.logger.trace('Commands button pressed');
        }
    }
}
