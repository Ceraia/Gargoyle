import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleTextCommandBuilder from '@src/system/backend/builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { editAsServer, sendAsServer } from '@src/system/backend/tools/server.js';
import client from '@src/system/botClient.js';
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    Events,
    GuildMember,
    InteractionContextType,
    Message,
    MessageFlags,
    PermissionFlagsBits,
    TextChannel
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
                            .addUserOption((option) => option.setName('inviter').setDescription('Inviter').setRequired(false))
                    )
            )
            .addSubcommand((subcommand) => subcommand.setName('missing').setDescription('Get a list of users who are missing an inviter'))
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('tree')
                    .setDescription('Get the invite tree')
                    .addUserOption((option) => option.setName('user').setDescription('User to get the tree of').setRequired(true))
            )
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override textCommands = [
        new GargoyleTextCommandBuilder().setName('tree').setDescription('Get the crustacean invite tree').setContexts([InteractionContextType.Guild])
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (!client.db || (client.db.readyState !== 1 && client.db.readyState !== 0)) {
            await interaction.reply({ content: 'Sorry, this is unavailable at this time.' });
            return;
        }
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
        } else if (interaction.options.getSubcommand() === 'missing') {
            if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a guild', flags: MessageFlags.Ephemeral });

            // Get all members in the guild who do not have an entry in the database
            const members = await interaction.guild.members.fetch();

            let missingStr = '';

            for (const member of members) {
                if (member[1].user.bot) continue;
                const crustaceanMember = await getCrustaceanUser(client, member[0], guildId);

                if (!crustaceanMember.inviterId) {
                    missingStr += `<@!${member[0]}>, `;
                }
            }

            return interaction.reply({ content: `Missing invitees: ${missingStr}`, flags: MessageFlags.Ephemeral });
        } else if (interaction.options.getSubcommandGroup() === 'set') {
            if (interaction.options.getSubcommand() === 'reputation') {
                const user = interaction.options.getUser('user', true);
                const value = interaction.options.getNumber('value', true);
                let oldValue = 0;

                const crustaceanUser = await getCrustaceanUser(client, user.id, guildId);

                if (crustaceanUser.reputation) oldValue = crustaceanUser.reputation;
                crustaceanUser.reputation = value;
                await crustaceanUser.save();

                return interaction.reply({
                    content: `Reputation of ${user} has been set to ${value} from ${oldValue}`,
                    flags: MessageFlags.Ephemeral
                });
            } else if (interaction.options.getSubcommand() === 'inviter') {
                const user = interaction.options.getUser('user', true);
                const inviter = interaction.options.getUser('inviter', false);

                const crustaceanUser = await getCrustaceanUser(client, user.id, guildId);

                if (inviter) {
                    const crustaceanInviter = await getCrustaceanUser(client, inviter?.id ?? '', guildId);

                    if (inviter.id === user.id) {
                        return interaction.reply({ content: 'You cannot set a user as the inviter of themselves', flags: MessageFlags.Ephemeral });
                    }

                    // Check if any of the parents of the inviter are the user
                    let currentUserId = crustaceanInviter.userId;
                    while (currentUserId) {
                        if (currentUserId === user.id) {
                            return interaction.reply({
                                content: 'You cannot set a user as the inviter of their inviter',
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        const currentUser = await getCrustaceanUser(client, currentUserId, guildId);
                        currentUserId = currentUser.inviterId;
                    }
                }

                crustaceanUser.inviterId = inviter ? inviter.id : null;
                await crustaceanUser.save();

                return interaction.reply({ content: `${inviter} has been set as the inviter of ${user}`, flags: MessageFlags.Ephemeral });
            }
        } else if (interaction.options.getSubcommand() === 'tree') {
            const user = interaction.options.getUser('user', true);

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const tree = await generateFullInviteTree(guildId, user.id, true).catch((err) => {
                client.logger.error(err.stack);
                return interaction.editReply({ content: 'An error occurred generating the tree, please try again later.' });
            });

            if (tree.toString().length > 2000) {
                // Send it as a file instead
                let content = tree
                    .toString()
                    // Remove code blocks
                    .replace(/`/g, '')
                    // Remove all suffixes and prefixes used in the tree text
                    .replace(/\[\d+(;\d+)*m/g, '');

                const buffer = Buffer.from(content, 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: 'message.txt' });

                return await interaction.editReply({ content: 'The tree is too long, sending as a file.', files: [attachment] }).catch(() => {});
            } else return interaction.editReply({ content: `${tree}` });
        }

        return interaction.reply({ content: 'Not implemented yet, sorry.', flags: MessageFlags.Ephemeral });
    }

    public override async executeTextCommand(client: GargoyleClient, message: Message<boolean>): Promise<void> {
        if (!client.db || (client.db.readyState !== 1 && client.db.readyState !== 0)) {
            await message.reply({ content: 'Sorry, this is unavailable at this time.' });
            return;
        }
        if (!message.guild) {
            await message.reply('This command can only be used in a guild');
            return;
        }

        const user = message.mentions.members?.first()?.user ?? message.author;

        const tree = await generateFullInviteTree(message.guild.id, user.id, true).catch(async (err) => {
            client.logger.error(err.stack);
            return await message.reply({ content: 'An error occurred generating the tree, please try again later.' }).catch(() => {});
        });

        await message.reply({ content: `${tree}` }).catch(() => {});
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (!client.db || (client.db.readyState !== 1 && client.db.readyState !== 0)) {
            await interaction.reply({ content: 'Sorry, this is unavailable at this time.' });
            return;
        }
        if (interaction.guild === null) return;

        if (args[0] === 'invite') {
            const userId = args[1];

            const crustaceanInvitee = await getCrustaceanUser(client, userId, interaction.guild.id);
            crustaceanInvitee.inviterId = interaction.user.id;
            await crustaceanInvitee.save();

            const crustaceanGuild = await getCrustaceanGuild(interaction.guild.id);

            if (!crustaceanGuild.role) {
                await interaction.reply({ content: 'The role set for the crustacean system was not found, please set it again.' });
                return;
            }

            const role = interaction.guild.roles.cache.get(crustaceanGuild.role);
            if (!role) {
                crustaceanGuild.role = null;
                await crustaceanGuild.save();

                await interaction.reply({ content: 'The role set for the crustacean system was not found, please set it again.' });
                return;
            }

            if (interaction.user.id === userId) {
                await interaction.reply({
                    content: 'You cannot invite yourself, wait for who invited you to claim the invite.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const guildMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
            if (!guildMember?.roles.cache.has(crustaceanGuild.role)) {
                await interaction.reply({ content: 'You do not have permission to claim an invite.', flags: MessageFlags.Ephemeral });
                return;
            }

            await interaction.guild.members.fetch(userId).then((member) => {
                member.roles.add(role).catch(async () => {
                    await interaction.reply({
                        content: 'An error occurred giving the user the role, the role may be above my highest role.'
                    });
                });
            });

            await interaction
                .update({
                    content: interaction.message.content + `\n-# Invited by ${interaction.user.displayName} (<@!${interaction.user.id}>)`,
                    components: []
                })
                .catch((err) => {
                    client.logger.error('Failed to edit message as interaction, resorting to editing as server.', err.stack);
                    editAsServer(
                        {
                            content: interaction.message.content + `\n-# Invited by ${interaction.user.displayName} (<@!${interaction.user.id}>)`,
                            components: []
                        },
                        interaction.channel as TextChannel,
                        interaction.message.id
                    );
                });

            await interaction.reply({ content: 'You have now invited this user to the guild.', flags: MessageFlags.Ephemeral });
        }
    }

    public override events: GargoyleEvent[] = [new MemberJoin(), new ReputationMessage(), new MemberLeave()];
}

function inviteMessage(): string {
    const inviteMessages = [
        'Brace yourself, {member} has joined the server!',
        "Look who's here! It's {member}!",
        'Welcome to the server, {member}!',
        "It's dangerous to go alone, take {member}!",
        'Swoooosh. {member} just landed.',
        'Hello {member}, welcome to the server!',
        'Everyone welcome {member}!',
        "Glad you're here, {member}!",
        '{member} has joined the server! Everyone, look busy!',
        '{member} joined the party.',
        '{member} just slid into the server.',
        'A wild {member} appeared.'
    ];

    return inviteMessages[Math.floor(Math.random() * inviteMessages.length)];
}

function leaveMessage(): string {
    const leaveMessages = [
        '{member} has left the server.',
        '{member} has left the building.',
        '{member} has left the chat.',
        'Sad to see {member} go.',
        '{member} has left the server. Was it something we said?',
        "{member} has left the server. We'll miss you!",
        '{member} touched grass and left the server.',
        "We've lost {member}."
    ];

    return leaveMessages[Math.floor(Math.random() * leaveMessages.length)];
}

class MemberLeave extends GargoyleEvent {
    public event = Events.GuildMemberRemove as const;

    public async execute(client: GargoyleClient, member: GuildMember): Promise<void> {
        if (!client.db || (client.db.readyState !== 1 && client.db.readyState !== 0)) return;
        try {
            const crustaceanUser = await getCrustaceanUser(client, member.id, member.guild.id);

            let banned = await client.guilds.cache
                .get(member.guild.id)
                ?.bans.fetch(member.id)
                .catch(() => null);
            if ((banned && banned !== null) || banned !== undefined) crustaceanUser.state = 'banned';
            else crustaceanUser.state = 'left';

            await crustaceanUser.save();

            const crustaceanGuild = await getCrustaceanGuild(member.guild.id);
            if (!crustaceanGuild.enabled) return;

            const crustaceanChannel = member.guild.channels.cache.get(crustaceanGuild.channel);

            if (crustaceanChannel && crustaceanChannel.isSendable()) {
                sendAsServer(
                    {
                        content: leaveMessage().replace('{member}', `<@!${member.id}>`)
                    },
                    crustaceanChannel as TextChannel
                );
            }
        } catch (err) {}
    }
}

class MemberJoin extends GargoyleEvent {
    public event = Events.GuildMemberAdd as const;

    public async execute(_client: GargoyleClient, member: GuildMember): Promise<void> {
        if (!client.db || (client.db.readyState !== 1 && client.db.readyState !== 0)) return;
        const crustaceanGuild = await getCrustaceanGuild(member.guild.id);
        if (!crustaceanGuild.enabled) return;

        const crustaceanChannel = member.guild.channels.cache.get(crustaceanGuild.channel);

        const crustaceanUser = await getCrustaceanUser(client, member.id, member.guild.id);
        if (crustaceanUser.state === 'banned' || crustaceanUser.state === 'left') {
            crustaceanUser.state = 'member';
        }

        if (!crustaceanChannel) {
            return;
        }

        crustaceanUser.joinedDate = member.joinedAt || new Date();
        await crustaceanUser.save();

        if (crustaceanChannel.isSendable()) {
            sendAsServer(
                {
                    content: inviteMessage().replace('{member}', `<@!${member.id}>`),
                    components: [
                        new ActionRowBuilder<GargoyleButtonBuilder>().addComponents(
                            new GargoyleButtonBuilder(new Crustacean(), 'invite', member.id).setLabel('Claim Invite').setStyle(ButtonStyle.Secondary)
                        )
                    ]
                },
                crustaceanChannel as TextChannel
            );
        }
    }
}

async function getReputationTotal(client: GargoyleClient, userId: string, guildId: string): Promise<number> {
    if (!client.db || (client.db.readyState !== 1 && client.db.readyState !== 0)) return 0;
    const crustaceanUser = await getCrustaceanUser(client, userId, guildId);
    let total = crustaceanUser.reputation;

    const invitees = await databaseCrustaceanUser.find({ guildId, inviterId: userId });

    for (const invitee of invitees) {
        if (invitee.state === 'banned') {
            total -= 1;
        }

        if (invitee.state === 'left') {
            total -= 0;
        }

        if (invitee.state === 'member') {
            total += 1;
        }
    }

    if (crustaceanUser.joinedDate) {
        const diff = Date.now() - crustaceanUser.joinedDate.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        total += Math.floor(days / 7);
    }

    return total;
}

class ReputationMessage extends GargoyleEvent {
    public event = Events.MessageCreate as const;

    private thanksCache = new Map<string, Date>();

    public async execute(client: GargoyleClient, message: Message): Promise<void> {
        if (!client.db || (client.db.readyState !== 1 && client.db.readyState !== 0)) return;
        if (message.author.bot) return;
        if (message.channel.type !== ChannelType.GuildText) return;

        if (!message.guild) return;

        const guildId = message.guild.id;
        const userId = message.author.id;

        const crustaceanGuild = await getCrustaceanGuild(guildId);
        if (!crustaceanGuild.enabled) return;

        const crustaceanUser = await getCrustaceanUser(client, userId, guildId);
        crustaceanUser.cachedName = message.member?.displayName ?? message.author.displayName;
        await crustaceanUser.save();

        if (message.mentions.users.size > 0 && containsThanks(message.content)) {
            await message.react('❤️').catch(() => {});

            // Check if the author has thanked someone in the last 12 hours
            if (this.thanksCache.has(message.author.id)) {
                const lastThanks = this.thanksCache.get(message.author.id);
                if (lastThanks && Date.now() - lastThanks.getTime() < 12 * 60 * 60 * 1000) {
                    return; // User has thanked someone in the last 12 hours
                }
            }

            // User has not thanked someone in the last 12 hours
            this.thanksCache.set(message.author.id, new Date());

            message.mentions.users.forEach(async (user) => {
                if (user.id === message.author.id) return;

                const thankedUser = await getCrustaceanUser(client, user.id, guildId);
                thankedUser.reputation += 1;
                await thankedUser.save();
            });
        }
    }
}

function containsThanks(message: string): boolean {
    return (
        message.toLowerCase().includes('thanks') ||
        message.toLowerCase().includes('thank ') ||
        message.toLowerCase().includes('thx') ||
        message.toLowerCase().includes('tysm') ||
        message.toLowerCase().includes('dankje') ||
        message.toLowerCase().includes('danku') ||
        message.toLowerCase().includes('danke') ||
        message.toLowerCase().includes('gracias') ||
        message.toLowerCase().includes('merci')
    );
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
    role: String
});

const crustaceanUserSchema = new Schema({
    userId: String,
    cachedName: String,
    guildId: String, // Users are unique per guild
    inviterId: String,
    lastCache: Date,
    joinedDate: Date,
    state: {
        type: String,
        default: 'member'
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

async function getCrustaceanUser(client: GargoyleClient, userId: string, guildId: string, cache: boolean = true) {
    let crustaceanUser = await databaseCrustaceanUser.findOne({ userId: userId, guildId: guildId });

    if (!crustaceanUser) {
        const user = await client.users.fetch(userId);
        const guild = client.guilds.cache.get(guildId);
        const member = await guild?.members.fetch(userId);
        crustaceanUser = new databaseCrustaceanUser({
            userId: userId,
            cachedName: member?.displayName ?? user.displayName,
            joinedDate: member?.joinedAt || new Date(),
            guildId: guildId
        });
        await crustaceanUser.save();
    }

    if (crustaceanUser.inviterId === crustaceanUser.userId) {
        crustaceanUser.inviterId = null;
        await crustaceanUser.save();
    }

    if (cache)
        if (
            !crustaceanUser.joinedDate || // If a join date is missing, update it
            !crustaceanUser.lastCache ||
            Date.now() - crustaceanUser.lastCache.getTime() > 1000 * 60 * 60 * 24
        ) {
            crustaceanUser.lastCache = new Date();
            crustaceanUser.save();

            await updateCrustaceanUserCache(userId, guildId);
        }

    return crustaceanUser;
}

async function updateCrustaceanUserCache(userId: string, guildId: string) {
    client.logger.trace(`Updating cache for user ${userId} in guild ${guildId}`);
    const crustaceanUser = await getCrustaceanUser(client, userId, guildId, false);

    const user = await client.users.fetch(userId);
    const guild = client.guilds.cache.get(guildId);
    const member = await guild?.members.fetch(userId).catch(() => null);

    crustaceanUser.lastCache = new Date();

    if (!member) {
        crustaceanUser.cachedName = user.displayName;
        crustaceanUser.joinedDate = new Date();

        const guild = client.guilds.cache.get(guildId);

        let banned = await guild?.bans.fetch(user.id).catch(() => null);
        if ((banned && banned !== null) || banned !== undefined) crustaceanUser.state = 'banned';
        else crustaceanUser.state = 'left';
    } else {
        crustaceanUser.cachedName = member.displayName;

        crustaceanUser.joinedDate = member.joinedAt;
    }

    await crustaceanUser.save();
}

async function generateInviteTree(rich: boolean = false, guildId: string, userId: string, maxDepth = 5, depth = 0, prefix = ''): Promise<string> {
    if (depth > maxDepth) return '';

    const invitees = await databaseCrustaceanUser.find({ guildId, inviterId: userId });

    if (invitees.length === 0) return '';

    let tree = '';

    for (let i = 0; i < invitees.length; i++) {
        const isLast = i === invitees.length - 1;
        const branch = isLast ? '└── ' : '├── ';
        const inviteeId = invitees[i].userId ?? 'UnknownUser'; // Ensure it's always a string
        const inviteeCachedName = invitees[i].cachedName ?? `<@${inviteeId}>?`;

        let statePrefix = '[2;32m';
        let stateSuffix = '[0m';
        if (invitees[i].state === 'banned') {
            statePrefix = '[2;41m';
            stateSuffix = '[0m';
        } else if (invitees[i].state === 'left') {
            statePrefix = '[2;33m';
            stateSuffix = '[0m';
        }

        const reputation = await getReputationTotal(client, inviteeId, guildId);

        tree += `${prefix}${branch}${rich ? statePrefix : ''}${inviteeCachedName} (${reputation})${rich ? stateSuffix : ''}\n`;
        tree += await generateInviteTree(rich, guildId, inviteeId, maxDepth, depth + 1, prefix + (isLast ? '    ' : '│   '));
    }

    return tree;
}

async function generateFullInviteTree(guildId: string, userId: string, rich: boolean = false, maxDepth = 5): Promise<string> {
    client.logger.trace(`Generating invite tree for user ${userId} in guild ${guildId} ${rich ? 'with' : 'without'} rich formatting`);

    // Upwards
    let upwardsTree: string[] = [];
    let currentUserId: string | null = userId;
    let rootUserId: string | null = null; // Keep track of the very first inviter

    const user = await getCrustaceanUser(client, userId, guildId);

    while (currentUserId) {
        let currentUser = await getCrustaceanUser(client, currentUserId, guildId);

        if (!currentUser || !currentUser.inviterId) break; // Stop if no inviter

        currentUserId = currentUser.inviterId;

        currentUser = await getCrustaceanUser(client, currentUserId, guildId);

        let prefix = '[2;32m';
        let suffix = '[0m';
        if (currentUser.state === 'banned') {
            prefix = '[2;41m';
            suffix = '[0m';
        } else if (currentUser.state === 'left') {
            prefix = '[2;33m';
            suffix = '[0m';
        }

        const reputation = await getReputationTotal(client, currentUserId, guildId);

        upwardsTree.push(`${rich ? prefix : ''}${currentUser.cachedName ?? `<@${currentUserId}>`}  (${reputation})${rich ? suffix : ''}`);
        rootUserId = currentUserId; // Update root user
    }

    // Trim the middle if the upwards chain is too long
    if (upwardsTree.length > maxDepth) {
        const first = upwardsTree[0];
        const last = upwardsTree[upwardsTree.length - 1];
        upwardsTree = [first, '...', last];
    }

    // ```ansi
    // This [2;41mword[0m has a red colored background
    // This [2;32mword[0m has a tinted text blue
    // This [2;33mword[0m has a tinted text yellow
    // ```

    const upwardsStr = upwardsTree.length > 0 ? `${upwardsTree.join(' ← ')}\n` : '';

    const downwardsTree = await generateInviteTree(rich, guildId, userId, maxDepth, 0, '    ');

    const reputation = await getReputationTotal(client, userId, guildId);

    const firstUserPrefix = rootUserId ? '└── ' : '';
    return `${rich ? '```ansi\n' : ''}${upwardsStr}${firstUserPrefix}${user.cachedName ?? `<@${currentUserId}>?`} (${reputation})\n${downwardsTree}${rich ? '```' : ''}`;
}
