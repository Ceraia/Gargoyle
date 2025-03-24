import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ChatInputCommandInteraction, Events, GuildMember, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';

export default class Server extends GargoyleCommand {
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
                    .addChannelOption((option) => option.setName('channel').setDescription('Channel where invitees go').setRequired(true))
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
        }

        return interaction.reply({ content: 'Not implemented yet, sorry.', flags: MessageFlags.Ephemeral });
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
