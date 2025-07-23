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
    NonThreadGuildBasedChannel
} from 'discord.js';
import { model, Schema } from 'mongoose';

export default class Ceraia extends GargoyleCommand {
    public override category: string = 'server';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('backup')
            .setDescription('Backup and restore server data')
            .setContexts(InteractionContextType.Guild)
            .addSubcommand((subcommand) =>
                subcommand.setName('create').setDescription('Create a backup of the server')
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

                if (await createBackup(interaction.guild)) {
                    interaction.editReply({
                        files: [
                            {
                                name: `backup-${interaction.guild.id}.json`,
                                attachment: Buffer.from(
                                    JSON.stringify({
                                        roles: await getRoles(interaction.guild),
                                        channels: await getChannels(interaction.guild)
                                    })
                                )
                            }
                        ]
                    });
                } else {
                    interaction.editReply({ content: 'Failed to create backup.' });
                }
            }
        }
    }
}

async function createBackup(guild: Guild): Promise<boolean> {
    return true;
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
    roles: [
        {
            roleId: String,
            name: String,
            permissions: Number,
            position: Number,
            color: String,
            mentionable: Boolean
        }
    ],
    channels: {
        categories: [
            {
                id: String,
                name: String,
                permissionOverwrites: [
                    {
                        id: String,
                        type: String,
                        allow: String,
                        deny: String
                    }
                ],
                children: [{ id: String }],
                position: Number
            }
        ],
        channels: [
            {
                id: String,
                name: String,
                description: String,
                permissionOverwrites: [
                    {
                        id: String,
                        type: String,
                        allow: String,
                        deny: String
                    }
                ],
                type: String,
                position: Number,
                parentId: String
            }
        ]
    }
});

const guildBackups = model('GuildBackups', guildBackupSchema);
