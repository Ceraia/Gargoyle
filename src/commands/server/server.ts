import GargoyleModalBuilder from '@builders/gargoyleModalBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import { editAsServer, sendAsServer } from '@src/system/backend/tools/server.js';
import {
    ActionRowBuilder,
    APIGuildMember,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
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
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('prefix')
                    .setDescription('Set the server prefix')
                    .addStringOption((option) => option.setName('prefix').setDescription('Prefix to set').setRequired(true))
            )
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('send')
                    .setDescription('Send things as the server')
                    .addSubcommand((subcommand) => subcommand.setName('message').setDescription('Send a message as the server'))
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('attachment')
                            .setDescription('Send an attachment as the server')
                            .addAttachmentOption((option) => option.setName('attachment0').setDescription('Attachment to send').setRequired(true))
                            .addAttachmentOption((option) =>
                                option.setName('attachment1').setDescription('Another attachment to send').setRequired(false)
                            )
                            .addAttachmentOption((option) =>
                                option.setName('attachment3').setDescription('Another attachment to send').setRequired(false)
                            )
                            .addAttachmentOption((option) =>
                                option.setName('attachment4').setDescription('Another attachment to send').setRequired(false)
                            )
                            .addAttachmentOption((option) =>
                                option.setName('attachment5').setDescription('Another attachment to send').setRequired(false)
                            )
                            .addAttachmentOption((option) =>
                                option.setName('attachment6').setDescription('Another attachment to send').setRequired(false)
                            )
                            .addAttachmentOption((option) =>
                                option.setName('attachment7').setDescription('Another attachment to send').setRequired(false)
                            )
                            .addAttachmentOption((option) =>
                                option.setName('attachment8').setDescription('Another attachment to send').setRequired(false)
                            )
                            .addAttachmentOption((option) =>
                                option.setName('attachment9').setDescription('Another attachment to send').setRequired(false)
                            )
                    )
            )
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('role')
                    .setDescription('Give roles to users')
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('give')
                            .setDescription('Give a role to a user')
                            .addUserOption((option) => option.setName('user').setDescription('User to give the role to').setRequired(true))
                            .addRoleOption((option) => option.setName('role').setDescription('Role to give'))
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('take')
                            .setDescription('Take a role from a user')
                            .addUserOption((option) => option.setName('user').setDescription('User to take the role from').setRequired(true))
                            .addRoleOption((option) => option.setName('role').setDescription('Role to take'))
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('all')
                            .setDescription('Give a role to all users')
                            .addRoleOption((option) => option.setName('role').setDescription('Role to give').setRequired(true))
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
        } else if (interaction.options.getSubcommand().startsWith('attachment')) {
            await interaction.reply({ content: 'Sending attachment, one moment...', flags: MessageFlags.Ephemeral });
            const attachments = [
                interaction.options.getAttachment('attachment0', true),
                interaction.options.getAttachment('attachment1'),
                interaction.options.getAttachment('attachment2'),
                interaction.options.getAttachment('attachment3'),
                interaction.options.getAttachment('attachment4'),
                interaction.options.getAttachment('attachment5'),
                interaction.options.getAttachment('attachment6'),
                interaction.options.getAttachment('attachment7'),
                interaction.options.getAttachment('attachment8'),
                interaction.options.getAttachment('attachment9')
            ];
            return sendAsServer(
                {
                    files: [...attachments.filter((attachment) => attachment !== null)]
                },
                interaction.channel as TextChannel
            );
        } else if (interaction.options.getSubcommand() === 'prefix') {
            const prefix = interaction.options.getString('prefix');
            if (!prefix) return;

            if (!client.db) return interaction.reply({ content: 'Database not available, please try again later', flags: MessageFlags.Ephemeral });

            let guildDb = await client.db.getGuild(interaction.guildId!);

            guildDb.prefix = prefix;
            await guildDb
                .save()
                .catch(() => {
                    interaction.reply({ content: 'Failed to set prefix.', flags: MessageFlags.Ephemeral }).catch(() => {});
                })
                .then(() => {
                    interaction.reply({ content: `Server prefix set to \`${prefix}\``, flags: MessageFlags.Ephemeral }).catch(() => {});
                });
        } else if (interaction.options.getSubcommandGroup() === 'role') {
            const role = interaction.options.getRole('role', true);
            const user = interaction.options.getUser('user');

            if (!role) return;

            if (!interaction.guild) return;

            const member: GuildMember | APIGuildMember | null =
                (await interaction.guild.members.cache.get(user?.id!)) ||
                (await interaction.guild.members.fetch(interaction.user.id).catch(() => null));

            if (!member) return interaction.reply({ content: 'Member not found', flags: MessageFlags.Ephemeral }).catch(() => {});

            if (interaction.options.getSubcommand() === 'give') {
                if (typeof member === 'string')
                    return interaction.reply({ content: 'Member not found', flags: MessageFlags.Ephemeral }).catch(() => {});

                const resolvedRole = interaction.guild?.roles.cache.get(role.id);
                if (!resolvedRole)
                    return interaction.reply({ content: 'Role not found in the guild.', flags: MessageFlags.Ephemeral }).catch(() => {});
                member.roles.add(resolvedRole).then(() => {
                    interaction.reply({ content: `Role ${role.name} given to ${member.displayName}`, flags: MessageFlags.Ephemeral }).catch(() => {});
                });
            } else if (interaction.options.getSubcommand() === 'take') {
                const resolvedRole = interaction.guild?.roles.cache.get(role.id);
                if (!resolvedRole)
                    return interaction.reply({ content: 'Role not found in the guild.', flags: MessageFlags.Ephemeral }).catch(() => {});
                member.roles.remove(resolvedRole).then(() => {
                    interaction
                        .reply({ content: `Role ${role.name} taken from ${member.displayName}`, flags: MessageFlags.Ephemeral })
                        .catch(() => {});
                });
            } else if (interaction.options.getSubcommand() === 'all') {
                interaction.deferReply({ flags: MessageFlags.Ephemeral });
                interaction.guild.members.fetch().then(async (members) => {
                    const resolvedRole = interaction.guild?.roles.cache.get(role.id);
                    if (!resolvedRole) {
                        await interaction.reply({ content: 'Role not found in the guild.', flags: MessageFlags.Ephemeral }).catch(() => {});
                        return;
                    }

                    for (const member of members.values()) {
                        try {
                            await member.roles.add(resolvedRole);
                        } catch {
                            // Handle individual member role addition failure silently
                        }
                    }

                    await interaction.reply({ content: `Role ${role.name} given to all users`, flags: MessageFlags.Ephemeral }).catch(() => {});
                });
            }
        }
    }

    public override executeModalCommand(_client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        if (args[0] === 'message') {
            interaction.reply({ content: 'Sending message, one moment...', flags: MessageFlags.Ephemeral });
            sendAsServer({ content: interaction.fields.getTextInputValue('message') }, interaction.channel as TextChannel);
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
