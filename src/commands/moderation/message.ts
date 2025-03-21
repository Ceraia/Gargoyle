import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import client from '@src/system/botClient.js';
import {
    ApplicationCommandType,
    ButtonInteraction,
    CacheType,
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
    public override slashCommand = new GargoyleSlashCommandBuilder()
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

        .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder;
    public override contextCommands = [
        // new ContextMenuCommandBuilder()
        //     .setContexts(InteractionContextType.Guild)
        //     .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        //     .setType(ApplicationCommandType.Message)
        //     .setName('Delete messages till here')
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() == 'delete') {
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
                    interaction.editReply({ content: `Deleted ${amount} messages.` });
                })
                .catch((err) => {
                    client.logger.error(err);
                    interaction.editReply({ content: `Failed deleting ${amount} messages.` });
                });
        }
        return;
    }

    override executeButtonCommand(_client: GargoyleClient, _interaction: ButtonInteraction<CacheType>, ..._args: string[]): void {}

    public override executeContextMenuCommand(_client: GargoyleClient, _interaction: MessageContextMenuCommandInteraction): void {}
}
