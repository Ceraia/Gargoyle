import TextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    InteractionContextType,
    Message,
    MessageCreateOptions,
    MessageEditOptions,
    MessagePayload,
    SlashCommandBuilder,
    TextChannel
} from 'discord.js';
export default class Ping extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommand = new SlashCommandBuilder()
        .setName('vc')
        .setDescription('Voicechat related commands.')
        .setContexts([InteractionContextType.Guild]);

    public override textCommand = new TextCommandBuilder()
        .setName('voice')
        .setDescription('Replies with Pong!')
        .addAlias('vc')
        .addAlias('voicechat')
        .setContexts([InteractionContextType.Guild]);

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

    private panelMessage: string | MessageEditOptions | MessageCreateOptions | MessagePayload = {
        content: null,
        embeds: [new GargoyleEmbedBuilder().setTitle('Voicechat Commands')],
        components: [new ActionRowBuilder<GargoyleButtonBuilder>().addComponents([new GargoyleButtonBuilder(this, 'lock')])]
    };
}
