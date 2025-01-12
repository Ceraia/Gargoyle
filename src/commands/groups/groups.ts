import GargoyleClient from "@classes/gargoyleClient.js";
import GargoyleCommand from "@classes/gargoyleCommand.js";

import GargoyleSlashCommandBuilder from "@src/system/backend/builders/gargoyleSlashCommandBuilder.js";

import {
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
} from "discord.js";
export default class Fun extends GargoyleCommand {
    public override category: string = "fun";
    public override slashCommand = new GargoyleSlashCommandBuilder()
        .setName("group")
        .setDescription("Group related commands.")
        .addSubcommandGroup((subcommandGroup) =>
            subcommandGroup
                .setName("admin")
                .setDescription("Admin commands for groups.")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("setup")
                        .setDescription("Setup group functionality for the server.")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("The category to create the group channels in.")
                                .addChannelTypes(ChannelType.GuildCategory)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("delete")
                        .setDescription("Delete a group.")
                        .addChannelOption((option) =>
                            option.setName("channel").setDescription("The group to delete.").setRequired(true).addChannelTypes(ChannelType.GuildText)
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create a group.")
                .addStringOption((option) => option.setName("name").setDescription("The name of the group.").setRequired(true))
        )
        .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder;

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        if (!subcommand) {
            return;
        }
        if (!client.user?.id) return;

        switch (subcommand) {
            case "setup": {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                    interaction.reply({ content: "You do not have permission to run this command.", ephemeral: true });
                    return;
                }
                let channel = interaction.options.getChannel("channel");
                if (!channel) {
                    const createdChannel = await interaction.guild?.channels.create({
                        name: "Groups",
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: [{ id: client.user?.id, allow: ["SendTTSMessages"] }]
                    });
                    if (createdChannel && createdChannel.type === ChannelType.GuildCategory) {
                        channel = createdChannel;
                    }
                }
                if (channel?.type !== ChannelType.GuildCategory) {
                    return;
                }

                await removeGuildGroupCategories(client, interaction.guild as Guild);
                await setGroupCategory(client, channel as GuildChannel);
                interaction.editReply("Group setup complete.");

                break;
            }
            case "delete": {
                interaction.deferReply({ flags: MessageFlags.Ephemeral });
                if (!interaction.guild) return;
                const channel = interaction.options.getChannel("channel");
                if (!channel) return;
                if (await isGroup(channel as GuildChannel)) {
                    if (
                        !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) &&
                        !(await isGroupOwner(channel as GuildChannel, interaction.member as GuildMember))
                    ) {
                        interaction.reply({ content: "You do not have permission to remove this group.", ephemeral: true });
                        return;
                    }
                    await (channel as GuildChannel).delete();
                    interaction.editReply("Group deleted.");
                } else {
                    interaction.editReply("Channel is not a group channel.");
                }
                break;
            }
            case "create": {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                if (!interaction.guild) return;
                const name = interaction.options.getString("name");
                if (!name) return;

                if (await hasGroup(client, interaction.guild as Guild, interaction.member as GuildMember)) {
                    interaction.editReply("You already have a group.");
                    return;
                }

                const channel = await createGroup(client, interaction.guild as Guild, name, interaction.member as GuildMember);
                if (!channel) {
                    interaction.editReply("Failed to create group.");
                    return;
                }
                interaction.editReply(`Group ${name} created.`);
                break;
            }
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
