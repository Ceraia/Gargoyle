import GargoyleModalBuilder from '@builders/gargoyleModalBuilder.js';
import { GargoyleRoleSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { editAsServer, sendAsServer } from '@src/system/backend/tools/server.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    APIGuildMember,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    ContainerBuilder,
    ContextMenuCommandBuilder,
    Events,
    GuildMember,
    InteractionContextType,
    MessageActionRowComponentBuilder,
    MessageContextMenuCommandInteraction,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    TextChannel,
    TextDisplayBuilder,
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
                    .addSubcommand((subcommand) => subcommand.setName('auto').setDescription('Set a role to be given automatically to new members'))
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
            const user = interaction.options.getUser('user');

            if (!interaction.guild) return;

            const member: GuildMember | APIGuildMember | null =
                interaction.guild.members.cache.get(user?.id!) || (await interaction.guild.members.fetch(interaction.user.id).catch(() => null));

            if (!member) return interaction.reply({ content: 'Member not found', flags: MessageFlags.Ephemeral }).catch(() => {});

            if (interaction.options.getSubcommand() === 'give') {
                const role = interaction.options.getRole('role', true);
                if (typeof member === 'string')
                    return interaction.reply({ content: 'Member not found', flags: MessageFlags.Ephemeral }).catch(() => {});

                const resolvedRole = interaction.guild?.roles.cache.get(role.id);
                if (!resolvedRole)
                    return interaction.reply({ content: 'Role not found in the guild.', flags: MessageFlags.Ephemeral }).catch(() => {});
                member.roles.add(resolvedRole).then(() => {
                    interaction.reply({ content: `Role ${role.name} given to ${member.displayName}`, flags: MessageFlags.Ephemeral }).catch(() => {});
                });
            } else if (interaction.options.getSubcommand() === 'take') {
                const role = interaction.options.getRole('role', true);
                const resolvedRole = interaction.guild?.roles.cache.get(role.id);
                if (!resolvedRole)
                    return interaction.reply({ content: 'Role not found in the guild.', flags: MessageFlags.Ephemeral }).catch(() => {});
                member.roles.remove(resolvedRole).then(() => {
                    interaction
                        .reply({ content: `Role ${role.name} taken from ${member.displayName}`, flags: MessageFlags.Ephemeral })
                        .catch(() => {});
                });
            } else if (interaction.options.getSubcommand() === 'auto') {
                if (!client.db)
                    return interaction.reply({ content: 'Database not available, please try again later', flags: MessageFlags.Ephemeral });
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const dbGuild = await client.db.getGuild(interaction.guildId!);
                const guildRoles = interaction.guild.roles.cache;

                dbGuild.autoRoles = dbGuild.autoRoles.filter((r) => guildRoles.has(r));
                await dbGuild.save();

                interaction.editReply({
                    components: [
                        new ContainerBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent('Select roles to automatically assign on member join'))
                            .addActionRowComponents(
                                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                                    new GargoyleRoleSelectMenuBuilder(this, 'autoroles')
                                        .setDefaultRoles(dbGuild.autoRoles)
                                        .setPlaceholder('Select roles to auto assign')
                                        .setMaxValues(25)
                                        .setMinValues(0)
                                )
                            )
                    ],
                    flags: [MessageFlags.IsComponentsV2]
                });
            }
        }
    }

    public override async executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'autoroles') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            if (!interaction.guild) return;
            if (!client.db) {
                interaction.editReply({ content: 'Database not available, please try again later' });
                return;
            }

            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
                interaction.editReply({ content: 'You do not have permission to manage roles.' });
                return;
            }

            const selectedRoles = interaction.values;
            const guildRoles = interaction.guild.roles.cache;

            for (const role of selectedRoles) {
                const rolePosition = guildRoles.get(role)?.position ?? 0;
                if ((interaction.member as GuildMember).roles.highest.position <= rolePosition) {
                    interaction.editReply({ content: 'You cannot select roles higher than your highest role.' });
                    return;
                }
            }

            const dbGuild = await client.db.getGuild(interaction.guildId!);
            dbGuild.autoRoles = selectedRoles.filter((r) => guildRoles.has(r));
            try {
                await dbGuild.save();
                interaction.editReply({ content: 'Auto roles saved successfully.' }).catch(() => {});
            } catch {
                interaction.editReply({ content: 'Failed to save auto roles.' }).catch(() => {});
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

    public override events: GargoyleEvent[] = [new MemberJoin()];
}

class MemberJoin extends GargoyleEvent {
    public override event = Events.GuildMemberAdd as const;
    public override async execute(client: GargoyleClient, member: GuildMember) {
        if (!client.db) return;
        const dbGuild = await client.db.getGuild(member.guild.id);
        if (dbGuild.autoRoles.length > 0) {
            const rolesToAdd = dbGuild.autoRoles.filter((roleId) => member.guild.roles.cache.has(roleId));
            if (rolesToAdd.length > 0) {
                try {
                    await member.roles.add(rolesToAdd);
                } catch (error) {}
            }
        }
    }
}
