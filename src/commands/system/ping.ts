import TextCommandBuilder from '@src/system/builders/textCommandBuilder.js';
import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/classes/gargoyleCommand.js';
import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from 'discord.js';

export default class Ping extends GargoyleCommand {
    public override category: string = 'system';
    public override slashCommand = new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!');
    public override textCommand = new TextCommandBuilder().setName('ping').setDescription('Replies with Pong!').addAlias('p');

    public override executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        interaction.reply('Pong!');
    }

    public override executeTextCommand(client: GargoyleClient, message: Message) {
        message.reply('Pong!');
    }

}