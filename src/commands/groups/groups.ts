import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
<<<<<<< Updated upstream
=======
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import { GargoyleStringSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
>>>>>>> Stashed changes

import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';

import {
<<<<<<< Updated upstream
=======
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
>>>>>>> Stashed changes
    CategoryChannel,
    Channel,
    ChannelType,
    ChatInputCommandInteraction,
    Guild,
    GuildChannel,
    GuildMember,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    TextChannel
} from 'discord.js';
export default class Fun extends GargoyleCommand {
    public override category: string = 'fun';
    public override slashCommand = new GargoyleSlashCommandBuilder()
        .setName('group')
        .setDescription('Group related commands.')
        .addSubcommandGroup((subcommandGroup) =>
            subcommandGroup
                .setName('admin')
                .setDescription('Admin commands for groups.')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('setup')
                        .setDescription('Setup group functionality for the server.')
                        .addChannelOption((option) =>
                            option
                                .setName('channel')
                                .setDescription('The category to create the group channels in.')
                                .addChannelTypes(ChannelType.GuildCategory)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('delete')
                        .setDescription('Delete a group.')
                        .addChannelOption((option) =>
                            option.setName('channel').setDescription('The group to delete.').setRequired(true).addChannelTypes(ChannelType.GuildText)
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('create')
                .setDescription('Create a group.')
                .addStringOption((option) => option.setName('name').setDescription('The name of the group.').setRequired(true))
        )
        .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder;

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        if (!subcommand) {
            return;
        }
        if (!client.user?.id) return;

        switch (subcommand) {
        case 'setup': {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                interaction.reply({ content: 'You do not have permission to run this command.', ephemeral: true });
                return;
            }
<<<<<<< Updated upstream
            let channel = interaction.options.getChannel('channel');
            if (!channel) {
                const createdChannel = await interaction.guild?.channels.create({
                    name: 'Groups',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [{ id: client.user?.id, allow: ['SendTTSMessages'] }]
                });
                if (createdChannel && createdChannel.type === ChannelType.GuildCategory) {
                    channel = createdChannel;
                }
=======
        } catch (error) {
            client.logger.error(`Error executing ${subcommand} command:`, error as string);
            interaction.reply({ content: 'An error occurred while processing your request.', flags: MessageFlags.Ephemeral });
        }
    }

    public override executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): void {
        const subcommand = args[0];
        if (!subcommand) return;

        if (!client.user?.id) {
            interaction.reply({ content: 'Bot user not available.', flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            switch (subcommand) {
                case 'invite':
                    break;
                case 'kick':
                    break;
                case 'promote':
                    break;
                case 'leave':
                    break;
            }
        } catch (error) {
            client.logger.error(`Error executing ${subcommand} command:`, error as string);
            interaction.reply({ content: 'An error occurred while processing your request.', flags: MessageFlags.Ephemeral });
        }
    }

    private async createGroup(client: GargoyleClient, guild: Guild, name: string, owner: GuildMember): Promise<GuildChannel | null> {
        try {
            const category = await this.getGroupCategory(client, guild);
            if (!category) return null;

            const permissionOverwrites = category.permissionOverwrites.cache.map((permission) => ({
                id: permission.id,
                allow: permission.allow.toArray(),
                deny: permission.deny.toArray()
            }));

            const channel = await guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    { id: owner.id, allow: [PermissionFlagsBits.UseExternalStickers] },
                    ...permissionOverwrites,
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }
                ]
            });

            channel.send({
                content: `Welcome to ${name}!`,
                embeds: [new GargoyleEmbedBuilder().setTitle(`${name}`).setDescription(`This group was created by <@!${owner.id}>\n`)],
                components: [
                    new ActionRowBuilder<GargoyleButtonBuilder>().addComponents(
                        new GargoyleButtonBuilder(this, 'invite').setLabel('Invite').setStyle(ButtonStyle.Secondary),
                        new GargoyleButtonBuilder(this, 'kick').setLabel('Kick').setStyle(ButtonStyle.Secondary),
                        new GargoyleButtonBuilder(this, 'promote').setLabel('Promote').setStyle(ButtonStyle.Secondary),
                        new GargoyleButtonBuilder(this, 'leave').setLabel('Leave').setStyle(ButtonStyle.Secondary)
                    )
                ]
            });

            return channel;
        } catch (error) {
            client.logger.error(`Failed to create group ${name}:`, error as string);
            return null;
        }
    }

    private async handleSetup(client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            interaction.editReply('You do not have permission to run this command.');
            return;
        }

        const channel =
            interaction.options.getChannel('channel') ||
            (await interaction.guild?.channels.create({
                name: 'Groups',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [{ id: client.user?.id ?? '', allow: [PermissionFlagsBits.UseExternalStickers] }]
            }));

        if (!channel || channel.type !== ChannelType.GuildCategory) {
            interaction.editReply('Invalid channel specified.');
            return;
        }

        await this.removeGuildGroupCategories(client, interaction.guild as Guild);
        await this.setGroupCategory(client, channel as GuildChannel);
        for (const childChannel of (channel as CategoryChannel).children.cache.values()) {
            childChannel.delete().catch(() => {});
        }

        await interaction.guild?.channels
            .create({
                name: 'Groups',
                type: ChannelType.GuildText,
                parent: channel.id,
                permissionOverwrites: [{ id: client.user?.id ?? '', allow: [PermissionFlagsBits.UseExternalStickers] }]
            })
            .then(async (channel) => {
                channel.send({
                    content: 'Groups',
                    embeds: [new GargoyleEmbedBuilder().setTitle('Groups').setDescription('Select a group to view.')],
                    components: [
                        new ActionRowBuilder<GargoyleStringSelectMenuBuilder>().addComponents(
                            new GargoyleStringSelectMenuBuilder(this, 'group').addOptions(
                                (await this.getGroups(client, interaction.guild as Guild)).map((channel) => ({
                                    label: channel.name,
                                    value: channel.id
                                }))
                            )
                        )
                    ]
                });
            });

        interaction.editReply('Group setup complete.');
    }

    private async handleDelete(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = interaction.options.getChannel('channel');
        if (!channel || channel.type !== ChannelType.GuildText) {
            interaction.editReply('Invalid channel specified.');
            return;
        }

        if (!interaction.guild || !(await this.isGroup(channel as GuildChannel))) {
            interaction.editReply('Channel is not a group channel.');
            return;
        }

        const isOwner = await this.isGroupOwner(channel as GuildChannel, interaction.member as GuildMember);
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) && !isOwner) {
            interaction.editReply('You do not have permission to delete this group.');
            return;
        }

        await (channel as GuildChannel).delete();
        interaction.editReply('Group deleted.');
    }

    private async handleCreate(client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const name = interaction.options.getString('name');
        if (!name || !interaction.guild) {
            interaction.editReply('Invalid group name or guild context.');
            return;
        }

        if (await this.hasGroup(client, interaction.guild, interaction.member as GuildMember)) {
            interaction.editReply('You already have a group.');
            return;
        }

        const channel = await this.createGroup(client, interaction.guild, name, interaction.member as GuildMember);
        interaction.editReply(channel ? `Group ${name} created.` : 'Failed to create group.');
    }

    private async setGroupCategory(client: GargoyleClient, channel: GuildChannel): Promise<boolean> {
        try {
            const fetchedChannel = await client.channels.fetch(channel.id);
            if (fetchedChannel?.type === ChannelType.GuildCategory) {
                await fetchedChannel.permissionOverwrites.create(client.user!.id, { UseExternalStickers: true });
                return true;
>>>>>>> Stashed changes
            }
            if (channel?.type !== ChannelType.GuildCategory) {
                return;
            }

            await removeGuildGroupCategories(client, interaction.guild as Guild);
            await setGroupCategory(client, channel as GuildChannel);

            break;
        }
        case 'delete': {
            interaction.deferReply({ flags: MessageFlags.Ephemeral });
            if (!interaction.guild) return;
            const channel = interaction.options.getChannel('channel');
            if (!channel) return;
            if (await isGroup(channel as GuildChannel)) {
                if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) && !await isGroupOwner(channel as GuildChannel, interaction.member as GuildMember)) {
                    interaction.reply({ content: 'You do not have permission to remove this group.', ephemeral: true });
                    return;
                }
                await (channel as GuildChannel).delete();
                interaction.editReply('Group deleted.');
            } else {
                interaction.editReply('Channel is not a group channel.');
            }
            break;
        }
        case 'create': {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            if (!interaction.guild) return;
            const name = interaction.options.getString('name');
            if (!name) return;

            if (await hasGroup(client, interaction.guild as Guild, interaction.member as GuildMember)) {
                interaction.editReply('You already have a group.');
                return;
            }

            const channel = await createGroup(client, interaction.guild as Guild, name, interaction.member as GuildMember);
            if (!channel) {
                interaction.editReply('Failed to create group.');
                return;
            }
            interaction.editReply(`Group ${name} created.`);
            break;
        }
<<<<<<< Updated upstream
=======
    }

    private isGroupCategory(channel: GuildChannel): Promise<boolean> {
        const permissionOverwrite = channel.permissionOverwrites.cache.get(client.user?.id ?? '');
        return Promise.resolve(
            channel.type === ChannelType.GuildCategory &&
                channel.permissionOverwrites.cache.has(client.user?.id ?? '') &&
                (permissionOverwrite?.allow.has(PermissionFlagsBits.UseExternalStickers) ?? false)
        );
    }

    private async isGroup(channel: GuildChannel): Promise<boolean> {
        const parentIsGroupCategory = channel.parent ? await this.isGroupCategory(channel.parent) : false;
        return channel.type === ChannelType.GuildText && parentIsGroupCategory;
    }

    private isGroupIndex(channel: GuildChannel): Promise<boolean> {
        const permissionOverwrite = channel.permissionOverwrites.cache.get(client.user?.id ?? '');
        return Promise.resolve(
            channel.type === ChannelType.GuildText &&
                channel.permissionOverwrites.cache.has(client.user?.id ?? '') &&
                (permissionOverwrite?.allow.has(PermissionFlagsBits.UseExternalStickers) ?? false)
        );
    }

    private isGroupOwner(channel: GuildChannel, member: GuildMember): Promise<boolean> {
        const permissions = channel.permissionOverwrites.cache.get(member.id);
        return Promise.resolve(permissions?.allow.has(PermissionFlagsBits.UseExternalStickers) || false);
    }

    private async hasGroup(client: GargoyleClient, guild: Guild, member: GuildMember): Promise<boolean> {
        try {
            const channels = await guild.channels.fetch();
            return (
                await Promise.all(
                    Array.from(channels.values()).map(
                        async (channel) => (await this.isGroup(channel as GuildChannel)) && (await this.isGroupOwner(channel as GuildChannel, member))
                    )
                )
            ).some(Boolean);
        } catch (error) {
            client.logger.error(`Failed to check group ownership for ${member.id}:`, error as string);
            return false;
>>>>>>> Stashed changes
        }
    }

    private async getGroups(client: GargoyleClient, guild: Guild): Promise<GuildChannel[]> {
        try {
            const groupCategory = await this.getGroupCategory(client, guild);
            if (!groupCategory) return [];

            return Array.from(groupCategory.children.cache.values()).filter((channel) => this.isGroup(channel as GuildChannel));
        } catch (error) {
            client.logger.error(`Failed to get groups for guild ${guild.id}:`, error as string);
            return [];
        }
    }
}

async function setGroupCategory(client: GargoyleClient, channel: GuildChannel): Promise<boolean> {
    const fetchedChannel = await client.channels.fetch(channel.id);

    if (!fetchedChannel || fetchedChannel.type !== ChannelType.GuildCategory) {
        return false;
    }

    if (!client.user) {
        return false;
    }

    (fetchedChannel as CategoryChannel).permissionOverwrites.create(client.user, { SendTTSMessages: true }).then(() => {
        return true;
    });

    return false;
}

async function getGroupCategory(client: GargoyleClient, guild: Guild): Promise<CategoryChannel | null> {
    const fetchedChannels = await guild.channels.fetch();
    if (!fetchedChannels) {
        return null;
    }

    if (!client.user) {
        return null;
    }

    for (const channel of fetchedChannels) {
        if (!channel) continue;
        const fetchedChannel = await client.channels.fetch(channel[0]);

        if (!fetchedChannel) continue;

        if (!isGroupCategory(fetchedChannel)) continue;

        return fetchedChannel as CategoryChannel;
    }

    return null;
}

async function removeGuildGroupCategories(client: GargoyleClient, guild: Guild): Promise<boolean> {
    const fetchedChannels = await guild.channels.fetch();
    if (!fetchedChannels) {
        return false;
    }

    if (!client.user) {
        return false;
    }

    for (const channel of fetchedChannels) {
        if (!channel) continue;
        const fetchedChannel = await client.channels.fetch(channel[0]);

        if (!fetchedChannel) continue;

        if (!isGroupCategory(fetchedChannel)) continue;

        (fetchedChannel as CategoryChannel).permissionOverwrites.create(client.user, { SendTTSMessages: false });
    }

    return true;
}

async function isGroupCategory(channel: Channel): Promise<boolean> {
    const fetchedChannel = await channel.fetch();
    if (fetchedChannel.type !== ChannelType.GuildCategory) return false;

    // Check if the channel has tts permissions for the bot
    if (!fetchedChannel.permissionOverwrites.cache.get(fetchedChannel.guild.id)) return false;
    const permissions = fetchedChannel.permissionOverwrites.cache.get(fetchedChannel.guild.id);
    if (permissions && permissions.allow.has(PermissionFlagsBits.SendTTSMessages)) return true;
    return false;
}

async function isGroup(channel: GuildChannel): Promise<boolean> {
    const fetchedChannel = await channel.fetch();
    if (!fetchedChannel) return false;

    if (fetchedChannel.type !== ChannelType.GuildText) return false;

    if (!fetchedChannel.parent) return false;

    if (fetchedChannel.parent.type !== ChannelType.GuildCategory) return false;

    if (!isGroupCategory(fetchedChannel.parent)) return false;
    return true;
}

async function isGroupOwner(channel: GuildChannel, member: GuildMember): Promise<boolean> {
    const fetchedChannel = await channel.fetch();
    if (!fetchedChannel) return false;

    if (!isGroup(fetchedChannel)) return false;

    if (!fetchedChannel.permissionOverwrites.cache.get(member.id)) return false;
    const permissions = fetchedChannel.permissionOverwrites.cache.get(member.id);
    if (permissions && permissions.allow.has(PermissionFlagsBits.SendTTSMessages)) return true;
    return false;
}

async function hasGroup(client: GargoyleClient, guild: Guild, member: GuildMember): Promise<boolean> {
    const fetchedChannels = await guild.channels.fetch();
    if (!fetchedChannels) return false;

    for (const channel of fetchedChannels) {
        if (!channel) continue;
        const fetchedChannel = await client.channels.fetch(channel[0]);

        if (!fetchedChannel) continue;

        if (!isGroup(fetchedChannel as TextChannel)) continue;

        if (await isGroupOwner(fetchedChannel as TextChannel, member)) return true;
    }

    return false;
}

async function createGroup(client: GargoyleClient, guild: Guild, name: string, owner: GuildMember): Promise<GuildChannel | null> {
    const category = await getGroupCategory(client, guild);
    if (!category) return null;

    const channel = await guild.channels.create({ name: name, type: ChannelType.GuildText });
    if (!channel) return null;

    await channel.permissionOverwrites.create(owner, { SendTTSMessages: true });

    return channel;
}