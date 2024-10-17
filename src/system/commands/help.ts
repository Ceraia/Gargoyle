import TextCommandBuilder from '@src/system/builders/textCommandBuilder.js';
import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/classes/gargoyleCommand.js';
import { ButtonInteraction, ChatInputCommandInteraction, Message, SlashCommandBuilder } from 'discord.js';

export default class Help extends GargoyleCommand {
    public override category: string = 'base';
    public override slashCommand = new SlashCommandBuilder().setName('help').setDescription('Replies with bot information');
    public override textCommand = new TextCommandBuilder().setName('help').setDescription('Replies with bot information').addAlias('h');

    public override executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        interaction.reply({ content: 'Pong!', components: [] });
    }

    public override executeTextCommand(_client: GargoyleClient, message: Message) {
        message.reply('Pong!');
    }

    public override executeButtonCommand(_client: GargoyleClient, _argument: string, _interaction: ButtonInteraction): void {

    }
}
