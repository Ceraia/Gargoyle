import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import {
    CategoryChannel,
    ChannelType,
    ChatInputCommandInteraction,
    Collection,
    Guild,
    InteractionContextType,
    MessageFlags,
    NonThreadGuildBasedChannel,
    PermissionFlagsBits
} from 'discord.js';
import { model, Schema } from 'mongoose';

export default class Ceraia extends GargoyleCommand {
    public override category: string = 'server';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('backup')
            .setDescription('Backup and restore server data')
            .setContexts(InteractionContextType.Guild)
            .addSubcommand((subcommand) => subcommand.setName('create').setDescription('Create a backup of the server'))
            .addSubcommand((subcommand) =>
                subcommand.setName('list').setDescription('List all backups for the server')
            ) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'backup') {
            if (interaction.options.getSubcommand() === 'create') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                if (!interaction.guild) {
                    interaction.editReply({ content: 'This command can only be used in a server.' });
                    return;
                }

                if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                    interaction.editReply({ content: 'You do not have permission to manage the server.' });
                    return;
                }

                if (!client.db) {
                    interaction.editReply({ content: 'Database connection is not available.' });
                    return;
                }

                await interaction.editReply({ content: await createBackup(client, interaction.guild) });
            } else if (interaction.options.getSubcommand() === 'list') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                if (!interaction.guild) {
                    interaction.editReply({ content: 'This command can only be used in a server.' });
                    return;
                }

                if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                    interaction.editReply({ content: 'You do not have permission to manage the server.' });
                    return;
                }

                if (!client.db) {
                    interaction.editReply({ content: 'Database connection is not available.' });
                    return;
                }

                const backups = await guildBackups.find({ guildId: interaction.guild.id });

                if (backups.length === 0) {
                    interaction.editReply({ content: 'No backups found for this server.' });
                    return;
                }

                const backupList = backups.map((backup) => `Backup ID: ${backup.backupId}, Created on: ${backup.dateCreated}`).join('\n');
                interaction.editReply({ content: `Backups for this server:\n${backupList}` });
            }
        }
    }
}

async function createBackup(client: GargoyleClient, guild: Guild): Promise<string> {
    if (!client.db) return 'Database connection is not available.';
    const roles = await getRoles(guild);
    const channels = await getChannels(guild);
    const backupId = `backup-${guild.id}-${Date.now()}`;

    // Create a clean backup data object
    const backupData = {
        ownerId: guild.ownerId,
        guildId: guild.id,
        backupId: backupId,
        dateCreated: new Date(),
        roles: roles,
        channels: {
            categories: channels.categories,
            channels: channels.channels
        }
    };

    try {
        await guildBackups.create(backupData);
        return `Backup created successfully with ID: ${backupId}`;
    } catch (error) {
        client.logger.error(`Error when creating backup for guild ${guild.id}:`, `${error}`);
        return `Failed to create backup: ${error}`;
    }
}

async function getRoles(guild: Guild) {
    const roles = await guild.roles.fetch();

    return roles.map((role) => ({
        roleId: role.id,
        name: role.name,
        permissions: `${role.permissions.bitfield}`,
        position: role.position,
        color: role.color.toString(),
        mentionable: role.mentionable
    }));
}

async function getChannels(guild: Guild) {
    let channels = await guild.channels.fetch();

    const categoryChannels: Collection<string, CategoryChannel> = channels.filter(
        (channel): channel is CategoryChannel => channel !== null && channel.type === ChannelType.GuildCategory
    );

    const otherChannels: Collection<string, NonThreadGuildBasedChannel> = channels.filter(
        (channel): channel is NonThreadGuildBasedChannel => channel !== null && channel.type !== ChannelType.GuildCategory
    );

    const sortedCategoryChannels = categoryChannels.sort((a, b) => a.position - b.position);
    const sortedOtherChannels = otherChannels.sort((a, b) => a.position - b.position);

    return {
        categories: sortedCategoryChannels.map((channel) => ({
            id: channel.id,
            name: channel.name,
            children: channel.children.cache.map((child) => ({
                id: child.id
            })),
            permissionOverwrites: channel.permissionOverwrites.cache.map((overwrite) => ({
                id: overwrite.id,
                type: overwrite.type,
                allow: overwrite.allow.bitfield.toString(),
                deny: overwrite.deny.bitfield.toString()
            })),
            position: channel.position
        })),
        channels: sortedOtherChannels.map((channel) => ({
            id: channel.id,
            name: channel.name,
            description: 'description' in channel ? channel.description || '' : '',
            type: channel.type,
            permissionOverwrites: channel.permissionOverwrites.cache.map((overwrite) => ({
                id: overwrite.id,
                type: overwrite.type,
                allow: overwrite.allow.bitfield.toString(),
                deny: overwrite.deny.bitfield.toString()
            })),
            position: channel.position,
            parentId: channel.parentId
        }))
    };
}

const permissionOverwriteSchema = new Schema(
    {
        id: { type: String, required: true },
        type: { type: Number, required: true },
        allow: { type: String, required: true },
        deny: { type: String, required: true }
    },
    { _id: false }
);

const childChannelSchema = new Schema(
    {
        id: { type: String, required: true }
    },
    { _id: false }
);

const categorySchema = new Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        permissionOverwrites: [permissionOverwriteSchema],
        children: [childChannelSchema],
        position: { type: Number, required: true }
    },
    { _id: false }
);

const channelSchema = new Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, default: '' },
        permissionOverwrites: [permissionOverwriteSchema],
        type: { type: Number, required: true },
        position: { type: Number, required: true },
        parentId: { type: String, default: null }
    },
    { _id: false }
);

const roleSchema = new Schema(
    {
        roleId: { type: String, required: true },
        name: { type: String, required: true },
        permissions: { type: String, required: true },
        position: { type: Number, required: true },
        color: { type: String, required: true },
        mentionable: { type: Boolean, required: true }
    },
    { _id: false }
);

const guildBackupSchema = new Schema({
    ownerId: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    backupId: {
        type: String,
        unique: true,
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now,
        required: true
    },
    roles: [roleSchema],
    categories: [categorySchema],
    channels: [channelSchema]
});

const guildBackups = model('GuildBackups', guildBackupSchema);
