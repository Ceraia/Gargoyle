import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import {
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    Events,
    GuildMember,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits
} from 'discord.js';

export default class Crustacean extends GargoyleCommand {
    public override category: string = 'server';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('crustacean')
            .setDescription('Crustacean invite system')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addSubcommand((subcommand) => subcommand.setName('info').setDescription('Get information about the crustacean system'))
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('enable')
                    .setDescription('Enable or disable the crustacean system')
                    .addBooleanOption((option) => option.setName('enable').setDescription('Enable or disable the system').setRequired(true))
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('channel')
                    .setDescription('Set the channel for the crustacean system')
                    .addChannelOption((option) =>
                        option.setName('channel').setDescription('Channel where invitees go').setRequired(true).addChannelTypes(ChannelType.GuildText)
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('role')
                    .setDescription('Set the role for the crustacean system')
                    .addRoleOption((option) => option.setName('role').setDescription('Role to give to invitees').setRequired(true))
            )
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('set')
                    .setDescription('Set certain values')
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('reputation')
                            .setDescription("Set a user's reputation")
                            .addUserOption((option) => option.setName('user').setDescription('Affected user').setRequired(true))
                            .addNumberOption((option) => option.setName('value').setDescription('Value to set').setRequired(true))
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('inviter')
                            .setDescription('Set the inviter of a user')
                            .addUserOption((option) => option.setName('user').setDescription('Affected user').setRequired(true))
                            .addUserOption((option) => option.setName('inviter').setDescription('Inviter').setRequired(true))
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('tree')
                    .setDescription('Get the invite tree')
                    .addUserOption((option) => option.setName('user').setDescription('User to get the tree of').setRequired(true))
            )
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === 'info') {
            return interaction.reply({
                embeds: [
                    new GargoyleEmbedBuilder()
                        .setTitle('Crustacean Invite System')
                        .setDescription(
                            'Crustacean is a custom invite & invite tracking system for your server.\n' +
                                'Crustacean is a W.I.P system to allow you to more accurately "whitelist" who gets access to your server, primarily meant for communities who value reputation of members.\n' +
                                'Crustacean is not meant to replace the default Discord invite system, but rather to supplement it.\n' +
                                "In short, as people's minds have atrophied and cannot be bothered to read all text;\n\n" +
                                '- Track invitations, and see who invited who. \n' +
                                '- Track reputation of members, and add merit accordingly. \n' +
                                '- Track in-game names of members (for whitelisting for minecraft for example). \n\n' +
                                '-# Crustacean is a work in progress, and may not work as expected, any bugs and feature requests can be forwarded to `@axodouble.`' +
                                '-# This idea is based off of the lobste.rs invite system.'
                        )
                ]
            });
        }

        const guildId = interaction.guildId;
        if (!guildId) return interaction.reply({ content: 'This command can only be used in a guild', flags: MessageFlags.Ephemeral });
        const guild = await getCrustaceanGuild(guildId);

        if (interaction.options.getSubcommand() === 'enable') {
            if (guild.enabled === interaction.options.getBoolean('enable', true)) {
                return interaction.reply({
                    content: `Crustacean system is already ${guild.enabled ? 'enabled' : 'disabled'}\n-# Make sure you do have a channel selected, with \`/crustacean channel\``,
                    flags: MessageFlags.Ephemeral
                });
            }

            guild.enabled = !guild.enabled;
            await guild.save();

            return interaction.reply({
                content: `Crustacean system has been ${guild.enabled ? 'enabled' : 'disabled'}`,
                flags: MessageFlags.Ephemeral
            });
        } else if (interaction.options.getSubcommand() === 'channel') {
            const channel = interaction.options.getChannel('channel', true);

            guild.channel = channel.id;
            await guild.save();

            return interaction.reply({ content: `Crustacean channel has been set to ${channel}`, flags: MessageFlags.Ephemeral });
        } else if (interaction.options.getSubcommand() === 'role') {
            const role = interaction.options.getRole('role', true);

            guild.role = role.id;
            await guild.save();

            return interaction.reply({ content: `Crustacean role has been set to ${role}`, flags: MessageFlags.Ephemeral });
        } else if (interaction.options.getSubcommandGroup() === 'set') {
            if (interaction.options.getSubcommand() === 'reputation') {
                const user = interaction.options.getUser('user', true);
                const value = interaction.options.getNumber('value', true);
                let oldValue = 0;

                const crustaceanUser = await getCrustaceanUser(user.id, guildId);

                if (crustaceanUser.reputation) oldValue = crustaceanUser.reputation;
                crustaceanUser.reputation = value;
                await crustaceanUser.save();

                return interaction.reply({
                    content: `Reputation of ${user} has been set to ${value} from ${oldValue}`,
                    flags: MessageFlags.Ephemeral
                });
            } else if (interaction.options.getSubcommand() === 'inviter') {
                const user = interaction.options.getUser('user', true);
                const inviter = interaction.options.getUser('inviter', true);

                const crustaceanUser = await getCrustaceanUser(user.id, guildId);
                crustaceanUser.inviterId = inviter.id;
                await crustaceanUser.save();

                return interaction.reply({ content: `${inviter} has been set as the inviter of ${user}`, flags: MessageFlags.Ephemeral });
            }
        } else if (interaction.options.getSubcommand() === 'tree') {
            const user = interaction.options.getUser('user', true);
            const tree = await generateFullInviteTree(guildId, user.id);

            return interaction.reply({ content: `${user}\n${tree}`, flags: MessageFlags.Ephemeral });
        }

        return interaction.reply({ content: 'Not implemented yet, sorry.', flags: MessageFlags.Ephemeral });
    }

    public override async executeButtonCommand(_client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (interaction.guild === null) return;

        if (args[0] === 'invite') {
            const userId = args[1];

            const crustaceanInvitee = await getCrustaceanUser(userId, interaction.guild.id);
            crustaceanInvitee.inviterId = interaction.user.id;
            await crustaceanInvitee.save();

            await interaction.update({
                components: [
                    new ActionRowBuilder<GargoyleButtonBuilder>().addComponents(
                        new GargoyleButtonBuilder(this)
                            .setLabel(`Invited by ${interaction.user.displayName}`)
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true)
                    )
                ]
            });

            await interaction.reply({ content: 'You have now invited this user to the guild.', flags: MessageFlags.Ephemeral });
            return;
        }
    }

    public override events: GargoyleEvent[] = [new MemberJoin()];
}

class MemberJoin extends GargoyleEvent {
    public event = Events.GuildMemberAdd as const;

    public async execute(_client: GargoyleClient, member: GuildMember): Promise<void> {
        const crustaceanGuild = await getCrustaceanGuild(member.guild.id);
        if (!crustaceanGuild.enabled) return;

        let crustaceanChannel = member.guild.channels.cache.get(crustaceanGuild.channel);

        if (!crustaceanChannel) {
            crustaceanGuild.enabled = false;
            await crustaceanGuild.save();
            return;
        }

        if (crustaceanChannel.isSendable()) {
            crustaceanChannel.send({
                content: `Welcome to the server, ${member}!`,
                components: [
                    new ActionRowBuilder<GargoyleButtonBuilder>().addComponents(
                        new GargoyleButtonBuilder(new Crustacean(), 'invite', member.id).setLabel('Invite').setStyle(ButtonStyle.Secondary)
                    )
                ]
            }); // #TODO Add multiple invite messages for variance, or custom set.
        }
    }
}

import { Schema, model } from 'mongoose';

const crustaceanGuildSchema = new Schema({
    guildId: String,
    enabled: {
        type: Boolean,
        default: false
    },
    channel: {
        type: String,
        default: null
    },
    role: {
        type: String,
        default: null
    }
});

const crustaceanUserSchema = new Schema({
    userId: String,
    guildId: String, // Users are unique per guild
    inviterId: {
        type: String, // The user who "invited" the user to the guild, or accepted the joinee
        default: null // this can be null to account for users who are not invited yet or have no logged invitee.
    },
    reputation: {
        type: Number,
        default: 0
    }
});

const databaseCrustaceanGuild = model('CrustaceanGuilds', crustaceanGuildSchema);
const databaseCrustaceanUser = model('CrustaceanUsers', crustaceanUserSchema);

async function getCrustaceanGuild(guildId: string) {
    let crustaceanGuild = await databaseCrustaceanGuild.findOne({ guildId: guildId });
    if (!crustaceanGuild) {
        crustaceanGuild = new databaseCrustaceanGuild({ guildId: guildId });
        await crustaceanGuild.save();
    }

    return crustaceanGuild;
}

async function getCrustaceanUser(userId: string, guildId: string) {
    let crustaceanUser = await databaseCrustaceanUser.findOne({ userId: userId, guildId: guildId });
    if (!crustaceanUser) {
        crustaceanUser = new databaseCrustaceanUser({
            userId: userId,
            guildId: guildId
        });
        await crustaceanUser.save();
    }

    return crustaceanUser;
}

async function generateInviteTree(guildId: string, userId: string, maxDepth = 5, depth = 0, prefix = ''): Promise<string> {
    if (depth > maxDepth) return '';

    const invitees = await databaseCrustaceanUser.find({ guildId, inviterId: userId });

    if (invitees.length === 0) return '';

    let tree = '';

    for (let i = 0; i < invitees.length; i++) {
        const isLast = i === invitees.length - 1;
        const branch = isLast ? '└── ' : '├── ';
        const inviteeId = invitees[i].userId ?? 'UnknownUser'; // Ensure it's always a string

        tree += `${prefix}${branch}<@${inviteeId}>\n`;
        tree += await generateInviteTree(guildId, inviteeId, maxDepth, depth + 1, prefix + (isLast ? '    ' : '│   '));
    }

    return tree;
}

async function generateFullInviteTree(guildId: string, userId: string, maxDepth = 5): Promise<string> {
    interface CrustaceanUser {
        userId: string;
        inviterId?: string | null;
    }

    // Upwards
    let tree = '';
    let currentUserId: string | null = userId;
    let depth = 0;

    while (currentUserId && depth < maxDepth) {
        const currentUser: CrustaceanUser | null = await databaseCrustaceanUser.findOne({ guildId, userId: currentUserId });

        if (!currentUser || !currentUser.inviterId) break; // Stop if no inviter

        currentUserId = currentUser.inviterId;
        tree = `↑ <@${currentUserId}>\n` + tree; // Prepend upwards
        depth++;
    }

    // Downwards
    tree += `<@${userId}>\n`;
    tree += await generateInviteTree(guildId, userId, maxDepth, 0, '');

    return tree;
}
