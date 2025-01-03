import TextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import {
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    InteractionContextType,
    InteractionReplyOptions,
    Message,
    MessageCreateOptions,
    MessageEditOptions,
    MessagePayload,
    PermissionFlagsBits,
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
        (message.channel as TextChannel).send(this.panelMessage as MessageCreateOptions);
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        interaction.deferReply({ ephemeral: true });

        if (!interaction.guildId || !interaction.user.id) return;
        if (client.user === null) return;

        const vc = (await (await client.guilds.fetch(interaction.guildId)).members.fetch(interaction.user.id)).voice.channel;

        if (!vc) {
            await interaction
                .editReply({ content: 'You need to be in a voice channel to use this button!' })
                .catch(() =>
                    interaction
                        .editReply({ content: 'You need to be in a voice channel to use this button!' })
                        .catch(() => interaction.reply({ content: 'You need to be in a voice channel to use this button!' }))
                );
            return;
        }

        if (
            !vc.permissionOverwrites.resolve(client.user.id) ||
            !vc.permissionOverwrites.resolve(client.user.id)?.allow.has(PermissionFlagsBits.AttachFiles)
        ) {
            interaction
                .editReply({ content: 'This is not a dynamic vc!' })
                .catch(() =>
                    interaction.reply({
                        content: 'This is not a dynamic vc!',
                        ephemeral: true
                    })
                );
            return;
        }

        switch (args[0]) {
            case 'lock':

                break;
        }
        interaction.update(this.panelMessage as MessageEditOptions);
    }

    private panelMessage: string | InteractionReplyOptions | MessageEditOptions | MessageCreateOptions | MessagePayload = {
        content: null,
        embeds: [new GargoyleEmbedBuilder().setTitle('Voicechat Commands')],
        components: [
            new ActionRowBuilder<GargoyleButtonBuilder>().addComponents([
                new GargoyleButtonBuilder(this, 'lock').setLabel('Lock').setStyle(ButtonStyle.Secondary)
            ])
        ]
    };
}
