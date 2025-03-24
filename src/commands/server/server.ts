import GargoyleModalBuilder from '@builders/gargoyleModalBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import { editAsServer, sendAsServer } from '@src/system/backend/tools/server.js';
import client from '@src/system/botClient.js';
import {
    ActionRowBuilder,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
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
}
