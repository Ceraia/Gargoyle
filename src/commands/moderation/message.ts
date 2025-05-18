import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import client from '@src/system/botClient.js';
import {
    ApplicationCommandType,
    ChannelType,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
    InteractionContextType,
    MessageContextMenuCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    TextChannel
} from 'discord.js';

export default class Moderation extends GargoyleCommand {
    public override category: string = 'moderation';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('messages')
            .setDescription('Message moderation commands')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('delete')
                    .setDescription('Delete a certain amount of messages')
                    .addNumberOption((option) =>
                        option.setName('amount').setDescription('The amount of messages to delete').setRequired(true).setMaxValue(50)
                    )
            )
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override contextCommands = [
        new ContextMenuCommandBuilder()
            .setContexts(InteractionContextType.Guild)
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
            .setType(ApplicationCommandType.Message)
            .setName('Delete messages till here')
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === 'delete') {
            interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const amount = interaction.options.getNumber('amount', true);

            const channel = (await interaction.channel?.fetch()) as TextChannel;

            if (!channel || channel.type !== ChannelType.GuildText)
                return interaction.editReply({
                    content: 'Channel not found ? Or is not a text channel? This is unexpected. Please try again later.'
                });

            channel
                .bulkDelete(amount)
                .then(() => {
                    return interaction.editReply({ content: `Deleted ${amount} messages.` });
                })
                .catch((err) => {
                    client.logger.error(err);
                    return interaction.editReply({
                        content: `Failed deleting ${amount} messages.\n-# You can only bulk-delete messages that are under 14 days old, this is a limitation presented by Discord themselves unfortunately.`
                    });
                });
        }

        return interaction.reply({ content: 'Invalid subcommand.' });
    }

    public override async executeContextMenuCommand(_client: GargoyleClient, interaction: MessageContextMenuCommandInteraction) {
        if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) return;
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.channel as TextChannel;
        const clickedMessage = await interaction.channel.messages.fetch(interaction.targetId);
        if (!clickedMessage) return interaction.editReply({ content: 'Could not find the selected message.' });

        try {
            const messages = await channel.messages.fetch({ after: clickedMessage.id, limit: 100 });
            const deletableMessages = messages.filter((msg) => !msg.pinned && msg.createdTimestamp > clickedMessage.createdTimestamp);

            if (deletableMessages.size === 0) {
                return interaction.editReply({ content: 'No messages found to delete.' });
            }

            await channel.bulkDelete(deletableMessages, true);
            return interaction.editReply({ content: `Deleted ${deletableMessages.size} messages.` });
        } catch (error) {
            client.logger.error(error as Error);
            return interaction.editReply({ content: 'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.' });
        }
    }
}
