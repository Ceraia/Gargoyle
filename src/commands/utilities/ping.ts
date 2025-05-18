import GargoyleTextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import { ChatInputCommandInteraction, InteractionContextType, Message, TextChannel } from 'discord.js';
export default class Ping extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('ping')
            .setDescription('Replies with Pong!')
            .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM])
    ];
    public override textCommands = [
        new GargoyleTextCommandBuilder()
            .setName('ping')
            .setDescription('Replies with Pong!')
            .addAlias('p')
            .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM])
    ];

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
