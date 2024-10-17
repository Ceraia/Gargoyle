import TextCommandBuilder from '@src/system/builders/textCommandBuilder.js';
import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/classes/gargoyleCommand.js';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ChatInputCommandInteraction, Message, SlashCommandBuilder } from 'discord.js';
import GargoyleButtonBuilder from '../builders/gargoyleButtonBuilder.js';

export default class Help extends GargoyleCommand {
    public override category: string = 'base';
    public override slashCommand = new SlashCommandBuilder().setName('help').setDescription('Replies with bot information');
    public override textCommand = new TextCommandBuilder().setName('help').setDescription('Replies with bot information').addAlias('h');

    public override executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        interaction.reply({
            content: 'Pong!',
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new GargoyleButtonBuilder(this, 'Commands'))]
        });
    }

    public override executeTextCommand(_client: GargoyleClient, message: Message) {
        message.reply('Pong!');
    }

    public override executeButtonCommand(client: GargoyleClient, argument: string, _interaction: ButtonInteraction): void {
        if (argument === 'Commands') {
            client.logger.trace('Commands button pressed');
        }
    }
}
