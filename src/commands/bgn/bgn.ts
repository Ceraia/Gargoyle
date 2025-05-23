import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ContainerBuilder,
    GuildMember,
    MessageCreateOptions,
    MessageEditOptions,
    MessageFlags,
    PermissionFlagsBits,
    PrivateThreadChannel,
    Role,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
    TextChannel,
    TextDisplayBuilder,
    UserSelectMenuBuilder
} from 'discord.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import client from '@src/system/botClient.js';
import GargoyleButtonBuilder, { GargoyleURLButtonBuilder } from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import { editAsServer, sendAsServer } from '@src/system/backend/tools/server.js';
import { GargoyleStringSelectMenuBuilder, GargoyleUserSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';

export default class Brads extends GargoyleCommand {
    public override category: string = 'bgn';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('bgn')
            .setDescription("A command for Brad's RP")
            .addGuild('324195889977622530')
            .addSubcommand((subcommand) => subcommand.setName('panel').setDescription('Send the BGN panel')) as GargoyleSlashCommandBuilder
    ];
    private panelMessage = {
        components: [
            new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '# Staff, Support & Appeals' +
                            '\n> Click the buttons below to get support, be it to report an issue, apply for staff or appeal a ban, if you just have a question feel free to open a ticket.'
                    )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# 📩 Support Ticket\n> Support with purchases, reports or other general inqueries')
                        )
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'support').setLabel('Support').setStyle(ButtonStyle.Secondary).setEmoji('📩')
                        )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# 📝 Staff Reports\n> Reports & questions relating to staff.'))
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'staff', '1160189039454982316')
                                .setLabel('Staff Reports')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('📝')
                        )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# 🚪 Staff Applications\n> Apply to staff.'))
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'apply').setLabel('Staff Applications').setStyle(ButtonStyle.Secondary).setEmoji('🚪')
                        )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# 🔨 Ban Appeals\n> For if you want to appeal or question an in-game ban.')
                        )
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'ban', '1160189039454982316')
                                .setLabel('Ban Appeals')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🔨')
                        )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent("# 🛒 Store\n> For if you want to donate to Brad's Network"))
                        .setButtonAccessory(
                            new GargoyleURLButtonBuilder('https://store.bradsnetwork.com/')
                                .setLabel('Donate')
                                .setStyle(ButtonStyle.Link)
                                .setEmoji('🛒')
                        )
                )
                .setAccentColor(0x0ed6ff)
        ],
        flags: [MessageFlags.IsComponentsV2]
    } as MessageCreateOptions;

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'panel') {
            if (!interaction.channel) {
                interaction.reply('You can only use this interaction in channels.');
                return;
            }
            const channel = (await client.channels.fetch(interaction.channel.id)) as TextChannel;

            if (!channel) {
                interaction.reply('I cannot find the channel to send this to');
                return;
            }

            try {
                await sendAsServer(client, this.panelMessage, channel);
                await interaction.reply({ content: 'Sent the panel to the channel.', flags: [MessageFlags.Ephemeral] });
            } catch (err) {
                client.logger.error(err as string);
                await interaction.reply({ content: 'Failed to send the panel.', flags: [MessageFlags.Ephemeral] });
            }
        }
    }

    public override async executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'remove') {
            await interaction.deferUpdate();
            for (const userId of interaction.values) {
                await (interaction.channel as PrivateThreadChannel).members.remove(userId).catch(() => {});
            }
            interaction.editReply({ content: 'Removed all of the selected members.', components: [] });
        }
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!interaction.guild || !interaction.channel) {
            interaction.editReply({ content: 'This can only be used in a guild channel.' });
            return;
        }
        if (args[0] === 'archive') {
            const member = await interaction.guild.members.fetch(interaction.user.id);

            if (!interaction.channel.isThread()) {
                await interaction.editReply({ content: 'This is only available in threads.' });
                return;
            }

            await interaction.channel.send({ content: `<@!${interaction.user.id}> is closing the ticket.` }).catch((err) => client.logger.error(err));

            if (member.roles.cache.has(args[1])) {
                await (interaction.channel as PrivateThreadChannel).setArchived(true);
                await interaction.editReply({ content: 'Ticket archived.' });
            } else {
                for (const member of await (interaction.channel as PrivateThreadChannel).members.fetch()) {
                    client.guilds.cache.get(interaction.guild.id)?.members.cache.get(member[0])?.roles.cache.has(args[1])
                        ? null
                        : await member[1].remove().catch((err) => {
                              client.logger.error(err);
                          });
                }
            }

            return;
        } else if (args[0] === 'lock') {
            if (!interaction.channel.isThread()) {
                await interaction.editReply({ content: 'This is only available in threads.' });
                return;
            }

            await (interaction.channel as PrivateThreadChannel).setInvitable(!(interaction.channel as PrivateThreadChannel).invitable);
            await interaction.editReply({
                content: `${(interaction.channel as PrivateThreadChannel).invitable ? 'Unlocked' : 'Locked'} the thread.`
            });
            return;
        } else if (args[0] === 'kick') {
            const member = await interaction.guild.members.fetch(interaction.user.id);

            if (!interaction.channel.isThread() || !interaction.guild) {
                await interaction.editReply({ content: 'This is only available in threads.' });
                return;
            }

            if (member.roles.cache.has(args[1])) {
                const options = (await (interaction.channel as PrivateThreadChannel).members.fetch())
                    .filter((user) => !user.user?.bot)
                    .map((user) => {
                        return {
                            label:
                                user.guildMember?.displayName ||
                                user.user?.displayName ||
                                interaction.guild?.members.cache.get(user.id)?.displayName ||
                                client.users.cache.get(user.id)?.displayName ||
                                user.id,
                            value: user.id
                        };
                    }); // A carefully designed monster to just add everyone who is not a member of that role

                await interaction.editReply({
                    content: null,
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                            new GargoyleStringSelectMenuBuilder(this, 'remove')
                                .setPlaceholder('Members to remove')
                                .setMaxValues(options.length > 25 ? 25 : options.length)
                                .setOptions(options)
                        )
                    ]
                });
            } else {
                await interaction.editReply({ content: 'You do not have permission to remove people from this ticket.' });
            }

            return;
        }

        if (interaction.channel.type !== ChannelType.GuildText) {
            await interaction.editReply({ content: 'This command is only available in guild message channels.' });
            return;
        }

        if (args.length > 0) {
            await interaction.message.edit(this.panelMessage as MessageEditOptions).catch(async () => {
                await editAsServer(this.panelMessage, interaction.channel as TextChannel, interaction.message.id);
            });

            const role = interaction.guild.roles.cache.find((role) => role.name.toLowerCase() === args[0].toLowerCase());

            const roleOverride = interaction.guild.roles.cache.get(args[1]);

            const member = await interaction.guild.members.fetch(interaction.user.id);

            const ticket = await this.makeTicketThread(interaction.channel, args[0], {
                members: [member],
                roles: roleOverride ? [roleOverride] : role ? [role] : []
            });

            if (typeof ticket === 'string') {
                await interaction.editReply({ content: `Failed to create a ticket: ${ticket}` });
                return;
            }

            await interaction.editReply({ content: `Ticket has been made, you can view it here <#${ticket.id}>` });
            return;
        }
    }

    private async makeTicketThread(
        channel: TextChannel,
        category: string,
        access: { members: GuildMember[]; roles?: Role[] }
    ): Promise<PrivateThreadChannel | string> {
        if (access.members.length === 0) return 'No members were supplied when opening a ticket.';
        try {
            const threadName = `${category}-${access.members[0].user.username}`;
            const hasThread = channel.threads.cache.filter((thread) => thread.name === threadName && !thread.locked && !thread.archived);

            if (hasThread) {
                const fetch = await channel.threads.fetchActive(true);
                if (fetch.threads.find((thread) => thread.name === threadName && !thread.locked && !thread.archived)) {
                    return `User already has a thread, <#${hasThread.first()!.id}>`;
                }
            }

            const thread = (await channel.threads
                .create({
                    reason: `Ticket opened by ${access.members[0].user.username}`,
                    name: threadName,
                    type: ChannelType.PrivateThread,
                    invitable: true,
                    autoArchiveDuration: 1440 // 1 day
                })
                .catch((err) => {
                    return null;
                })) as PrivateThreadChannel | null;

            if (!thread) return `Failed to create thread, likely no permissions.`;

            const message = {
                flags: [MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(
                                        '### Archive Ticket\n> Close the ticket and archive it if it is no longer needed.'
                                    )
                                )
                                .setButtonAccessory(
                                    new GargoyleButtonBuilder(
                                        this,
                                        'archive',
                                        access.roles && access.roles.length > 0 ? access.roles[0].id : channel.guild.roles.everyone.id
                                    )
                                        .setLabel('Archive Ticket')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setEmoji('📦')
                                )
                        )
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(new TextDisplayBuilder().setContent('### Kick User\n> Kick a user from the ticket.'))
                                .setButtonAccessory(
                                    new GargoyleButtonBuilder(
                                        this,
                                        'kick',
                                        access.roles && access.roles.length > 0 ? access.roles[0].id : channel.guild.roles.everyone.id
                                    )
                                        .setLabel('Kick Members')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setEmoji('🥾')
                                )
                        )
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent('### Lock Ticket\n> Lock the ticket to prevent adding new members.')
                                )
                                .setButtonAccessory(
                                    new GargoyleButtonBuilder(this, 'lock').setLabel('Lock Ticket').setStyle(ButtonStyle.Secondary).setEmoji('🔒')
                                )
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '### Add Participants\n> To add participants to the ticket, you can mention them in the channel.'
                            )
                        )
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `-# Initially involved parties ${access.members
                                    .map((entry) => {
                                        return `<@!${entry.id}>`;
                                    })
                                    .join(', ')}${access.roles ? access.roles.map((entry) => `<@&${entry.id}>`).join('') : ''}`
                            )
                        )
                ]
            } as MessageCreateOptions;

            await sendAsServer(client, { ...message, allowedMentions: {} }, thread);

            /*
             * This might look odd, but mentioning a user in a webhook does not add them to a thread.
             **/
            await thread.send(message).then((msg) => msg.delete());

            return thread;
        } catch (err) {
            client.logger.error(err as string);
            return 'An unknown error occured';
        }
    }

    private async isTicketChannel(client: GargoyleClient, channelInput: TextChannel): Promise<boolean> {
        if (!client.user) return false;
        const channel = (await client.channels.fetch(channelInput.id)) as TextChannel;
        if (
            channel.permissionOverwrites.resolve(client.user) &&
            channel.permissionOverwrites.resolve(client.user)?.allow.has(PermissionFlagsBits.SendTTSMessages) &&
            channel.permissionOverwrites.resolve(client.user)?.allow.has(PermissionFlagsBits.SendVoiceMessages)
        ) {
            return true;
        }
        return false;
    }
    private async makeTicketChannel(client: GargoyleClient, category: string, member: GuildMember): Promise<TextChannel | null> {
        try {
            const parent = await member.guild.channels.fetch(category);

            if (!parent) return null;

            return await member.guild.channels.create({
                name: `${parent.name}-${member.displayName}`,
                type: ChannelType.GuildText,
                parent: parent.id,
                permissionOverwrites: [{ id: member.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }]
            });
        } catch (err) {
            return null;
        }
    }
}
