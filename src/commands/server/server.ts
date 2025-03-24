import GargoyleModalBuilder from '@builders/gargoyleModalBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { editAsServer, sendAsServer } from '@src/system/backend/tools/server.js';
import client from '@src/system/botClient.js';
import {
    ActionRowBuilder,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
    Events,
    GuildMember,
    InteractionContextType,
    MessageContextMenuCommandInteraction,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    TextChannel,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';

export default class Server extends GargoyleCommand {
    public override category: string = 'server';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('server')
            .setDescription('Server / community commands')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('send')
                    .setDescription('Send things as the server')
                    .addSubcommand((subcommand) => subcommand.setName('message').setDescription('Send a message as the server'))
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('attachment')
                            .setDescription('Send an attachment as the server')
                            .addAttachmentOption((option) => option.setName('attachment').setDescription('Attachment to send').setRequired(true))
                    )
            )
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('invites')
                    .setDescription('Manage invites')
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('tracking')
                            .addBooleanOption((option) =>
                                option.setName('enabled').setDescription('Enable or disable invite tracking').setRequired(true)
                            )
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('track')
                            .setDescription('Track who invited a user')
                            .addUserOption((option) => option.setName('user').setDescription('User to track').setRequired(true))
                    )
            )
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];
    public override contextCommands = [
        new ContextMenuCommandBuilder()
            .setContexts(InteractionContextType.Guild)
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .setType(ApplicationCommandType.Message)
            .setName('Edit Server Message')
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === 'message') {
            await interaction.showModal(
                new GargoyleModalBuilder(this, 'message')
                    .setTitle('Send a message as the server')
                    .setComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId('message')
                                .setLabel('Message')
                                .setPlaceholder('Enter your message here')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        )
                    )
            );
        } else if (interaction.options.getSubcommand() === 'attachment') {
            await interaction.reply({ content: 'Sending attachment, one moment...', flags: MessageFlags.Ephemeral });
            return sendAsServer(client, { files: [interaction.options.getAttachment('attachment')!] }, interaction.channel as TextChannel);
        } else if (interaction.options.getSubcommand() === 'tracking') {
            if (!interaction.guildId)
                return await interaction.reply({
                    content: 'This does not appear to be a guild, you cannot toggle invite tracking.',
                    flags: MessageFlags.Ephemeral
                });

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (client.db === undefined || client.db === null)
                return interaction.editReply({ content: 'Database not connected, this feature is not available without database connectivity.' });

            client.db
                .getGuild(interaction.guildId)
                .then(async (databaseGuild) => {
                    databaseGuild.inviteTracking = interaction.options.getBoolean('enabled')!;
                    await databaseGuild.save();
                    return await interaction.editReply({
                        content: `Invite tracking is now ${databaseGuild.inviteTracking ? 'enabled' : 'disabled'}.`
                    });
                })
                .catch((err) => {
                    client.logger.error(err);
                    return interaction.editReply({ content: 'Failed to toggle invite tracking, please try again later.' });
                });
        } else if (interaction.options.getSubcommand() === 'track') {
            // #TODO: Implement invite tracking
        }
    }

    public override executeModalCommand(_client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        if (args[0] === 'message') {
            interaction.reply({ content: 'Sending message, one moment...', flags: MessageFlags.Ephemeral });
            sendAsServer(client, { content: interaction.fields.getTextInputValue('message') }, interaction.channel as TextChannel);
        } else if (args[0] === 'edit') {
            if (!interaction.channel) return;
            (interaction.channel as TextChannel).messages.fetch(args[1]).then((message) => {
                message
                    .edit(interaction.fields.getTextInputValue('message'))
                    .catch(() => {
                        editAsServer(
                            { content: interaction.fields.getTextInputValue('message') },
                            interaction.channel as TextChannel,
                            message.id
                        ).catch(() => {
                            interaction.reply({ content: 'Failed to edit message.', flags: MessageFlags.Ephemeral }).catch(() => {});
                        });
                    })
                    .then(() => {
                        interaction.reply({ content: 'Message edited.', flags: MessageFlags.Ephemeral }).catch(() => {});
                    });
            });
        }
    }

    public override executeContextMenuCommand(_client: GargoyleClient, interaction: MessageContextMenuCommandInteraction): void {
        if (interaction instanceof MessageContextMenuCommandInteraction) {
            interaction.showModal(
                new GargoyleModalBuilder(this, 'edit', interaction.targetMessage.id)
                    .setTitle('Edit Server Message')
                    .setComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId('message')
                                .setLabel('Message')
                                .setPlaceholder('Enter your message here')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                                .setValue(interaction.targetMessage.content)
                        )
                    )
            );
        }
    }

    public override events: GargoyleEvent[] = [new MemberJoin()];
}

class MemberJoin extends GargoyleEvent {
    public event = Events.GuildMemberAdd as const;

    public execute(_client: GargoyleClient, _member: GuildMember): void {
        // // Check what invite the user used to join the server
        // member.guild.fetchInvites().then((invites) => {
        //     const invite = invites.find((invite) => invite.uses! < invite.maxUses!);
        //     if (invite) {
    }
}
