import TextCommandBuilder from '@src/system/builders/textCommandBuilder.js';
import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/classes/gargoyleCommand.js';
import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Message, SlashCommandBuilder } from 'discord.js';
import GargoyleButtonBuilder from '../builders/gargoyleButtonBuilder.js';

export default class Help extends GargoyleCommand {
    public override category: string = 'base';
    public override slashCommand = new SlashCommandBuilder().setName('help').setDescription('Replies with bot information');
    public override textCommand = new TextCommandBuilder().setName('help').setDescription('Replies with bot information').addAlias('h');
    public override buttonPrefix = 'help';
    public override buttons = [new GargoyleButtonBuilder().setCustomId('help-commands').setLabel('Commands').setStyle(ButtonStyle.Primary)];

    public override executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        interaction.reply('Pong!');
    }

    public override executeTextCommand(_client: GargoyleClient, message: Message) {
        message.reply('Pong!');
    }

    public override executeButtonCommand(_client: GargoyleClient, _interaction: ButtonInteraction): void {}
}
