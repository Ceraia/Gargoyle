import TextCommandBuilder from '@src/system/backend/builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import { ChatInputCommandInteraction, Message, SlashCommandBuilder, TextChannel } from 'discord.js';

export default class Ping extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommand = new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!');
    public override textCommand = new TextCommandBuilder().setName('ping').setDescription('Replies with Pong!').addAlias('p');

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        const start = Date.now();
        await interaction.reply('Pong!');
        const end = Date.now();
        await interaction.editReply(`Pong! Latency is ${end - start}ms.`);
    }

    public override executeTextCommand(_client: GargoyleClient, message: Message) {
        (message.channel as TextChannel).send('Pong!').then((sentMessage) => {
            const start = message.createdTimestamp;
            const end = sentMessage.createdTimestamp;
            sentMessage.edit(`Pong! Latency is ${end - start}ms.`);
        });
    }
}
