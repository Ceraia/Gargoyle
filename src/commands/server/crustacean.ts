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
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === 'info') {
            return interaction.reply({
                embeds: [
                    new GargoyleEmbedBuilder()
                        .setTitle('Crustacean Invite System')
                        .setDescription(
                            `Crustacean is a custom invite & invite tracking system for your server.\n` +
                                `Crustacean is a W.I.P system to allow you to more accurately "whitelist" who gets access to your server, primarily meant for communities who value reputation of members.\n` +
                                `Crustacean is not meant to replace the default Discord invite system, but rather to supplement it.\n` +
                                `In short, as people's minds have atrophied and cannot be bothered to read all text;\n\n` +
                                `- Track invitations, and see who invited who. \n` +
                                `- Track reputation of members, and add merit accordingly. \n` +
                                `- Track in-game names of members (for whitelisting for minecraft for example). \n\n` +
                                `-# Crustacean is a work in progress, and may not work as expected, any bugs and feature requests can be forwarded to \`@axodouble.\``
                        )
                ],
                flags: MessageFlags.Ephemeral
            });
        } else if (interaction.options.getSubcommand() === 'enable') {
            const guildId = interaction.guildId;
            if (!guildId) return interaction.reply({ content: `This command can only be used in a guild`, flags: MessageFlags.Ephemeral });
            let guild = await getCrustaceanGuild(guildId);

            if (guild.enabled == interaction.options.getBoolean('enable', true)) {
                return interaction.reply({
                    content: `Crustacean system is already ${guild.enabled ? 'enabled' : 'disabled'}`,
                    flags: MessageFlags.Ephemeral
                });
            }

            guild.enabled = !guild.enabled;
            await guild.save();

            return interaction.reply({
                content: `Crustacean system has been ${guild.enabled ? 'enabled' : 'disabled'}`,
                flags: MessageFlags.Ephemeral
            });
        } else {
            return interaction.reply({ content: `Not implemented yet, sorry.`, flags: MessageFlags.Ephemeral });
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
        value: {
            type: Number,
            default: 0
        },
        log: [
            {
                userId: String, // User who caused the reputation value increase
                value: Number, // The value it would have increased by
                reason: String, // Reason for the increase, admin or user
                timestamp: Date // When the increase happened
            }
        ]
    }
});

const databaseCrustaceanGuild = model('CrustaceanGuilds', crustaceanGuildSchema);
const databaseCrustaceanUser = model('CrustaceanUsers', crustaceanUserSchema);

async function getCrustaceanGuild(guildId: string) {
    let crustaceanGuild = await databaseCrustaceanGuild.findOne({ guildId: guildId });
    if (!crustaceanGuild) {
        crustaceanGuild = new databaseCrustaceanGuild({
            guildId: guildId
        });
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
