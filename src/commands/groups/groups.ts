import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import { GargoyleStringSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import client from '@src/system/botClient.js';

import {
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
    CategoryChannel,
    ChannelType,
    ChatInputCommandInteraction,
    Guild,
    GuildChannel,
    GuildMember,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits
} from 'discord.js';

export default class Groups extends GargoyleCommand {
    public override category: string = 'fun';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('group')
            .setDescription('Group related commands.')
            .addGuild('1009048008857493624')
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
                                option
                                    .setName('channel')
                                    .setDescription('The group to delete.')
                                    .setRequired(true)
                                    .addChannelTypes(ChannelType.GuildText)
                            )
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('create')
                    .setDescription('Create a group.')
                    .addStringOption((option) => option.setName('name').setDescription('The name of the group.').setRequired(true))
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        if (!subcommand) return;

        if (!client.user?.id) {
            interaction.reply({ content: 'Bot user not available.', flags: MessageFlags.Ephemeral });
            return;
        }

        switch (subcommand) {
            case 'setup': {
                if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                    interaction.reply({ content: 'You do not have permission to run this command.', ephemeral: true });
                    return;
                }
                try {
                    // Your setup logic here
                } catch (error) {
                    client.logger.error(`Error executing ${subcommand} command:`, error as string);
                    interaction.reply({ content: 'An error occurred while processing your request.', flags: MessageFlags.Ephemeral });
                }
                break;
            }
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

    private async getGroupCategory(client: GargoyleClient, guild: Guild): Promise<GuildChannel | null> {
        try {
            const channels = await guild.channels.fetch();
            return Array.from(channels.values()).find(async (channel) => await this.isGroupCategory(channel as GuildChannel)) as GuildChannel;
        } catch (error) {
            client.logger.error(`Failed to get group category for ${guild.id}:`, error as string);
            return null;
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

    private async hasGroup(client: GargoyleClient, guild: Guild, member: GuildMember): Promise<boolean> {
        try {
            const channels = await guild.channels.fetch();
            return Array.from(channels.values()).some(async (channel) => await this.isGroup(channel as GuildChannel));
        } catch (error) {
            client.logger.error(`Failed to check if ${member.id} has a group in ${guild.id}:`, error as string);
            return false;
        }
    }

    private async getGroups(client: GargoyleClient, guild: Guild): Promise<GuildChannel[]> {
        try {
            const channels = await guild.channels.fetch();
            return Array.from(channels.values()).filter(async (channel) => await this.isGroup(channel as GuildChannel)) as GuildChannel[];
        } catch (error) {
            client.logger.error(`Failed to get groups for ${guild.id}:`, error as string);
            return [];
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
        }
    }

    private async setGroupCategory(client: GargoyleClient, channel: GuildChannel): Promise<boolean> {
        try {
            const fetchedChannel = await client.channels.fetch(channel.id);
            if (fetchedChannel?.type === ChannelType.GuildCategory) {
                await fetchedChannel.permissionOverwrites.create(client.user!.id, { UseExternalStickers: true });
                return true;
            }
        } catch (error) {
            client.logger.error(`Failed to set group category for ${channel.id}:`, error as string);
        }
        return false;
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

    private async removeGroupCategory(client: GargoyleClient, channel: GuildChannel): Promise<boolean> {
        try {
            // Remove the permission overwrite for the bot
            const permissionOverwrite = channel.permissionOverwrites.cache.get(client.user?.id ?? '');
            if (permissionOverwrite) {
                await permissionOverwrite.delete();
            }
            return true;
        } catch (error) {
            client.logger.error(`Failed to remove group category for ${channel.id}:`, error as string);
            return false;
        }
    }

    private async removeGuildGroupCategories(client: GargoyleClient, guild: Guild): Promise<boolean> {
        try {
            const channels = await guild.channels.fetch();
            await Promise.all(
                Array.from(channels.values()).map(async (channel) => {
                    if (channel && (await this.isGroupCategory(channel))) {
                        await this.removeGroupCategory(client, channel as GuildChannel);
                    }
                })
            );
            return true;
        } catch (error) {
            client.logger.error(`Failed to remove group categories for ${guild.id}:`, error as string);
            return false;
        }
    }
}
