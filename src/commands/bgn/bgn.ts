import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import {
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ContainerBuilder,
    GuildMember,
    MessageCreateOptions,
    MessageFlags,
    PermissionFlagsBits,
    PrivateThreadChannel,
    Role,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextChannel,
    TextDisplayBuilder
} from 'discord.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import client from '@src/system/botClient.js';
import GargoyleButtonBuilder, { GargoyleURLButtonBuilder } from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import { sendAsServer } from '@src/system/backend/tools/server.js';

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
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# 📦 Staff Matters\n> Applications, reports & questions relating to staff.')
                        )
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'staff', '1160189039454982316')
                                .setLabel('Staff Matters')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('📦')
                        )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# 🔨 Ban Appeals\n> For if you want to appeal or question an in-game ban.')
                        )
                        .setButtonAccessory(
                            new GargoyleButtonBuilder(this, 'ban').setLabel('Ban Appeals').setStyle(ButtonStyle.Secondary).setEmoji('🔨')
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
        } else if (args[0] === 'archive') {
            const member = await interaction.guild.members.fetch(interaction.user.id);

            if (!interaction.channel.isThread()) {
                await interaction.editReply({ content: 'This is only available in threads.' });
                return;
            }

            if (!member.roles.cache.has(args[1])) {
                await interaction.editReply({ content: 'You do not have permission to archive this ticket.' });
                return;
            }

            await (interaction.channel as PrivateThreadChannel).setArchived(true);
            await interaction.editReply({ content: 'Ticket archived.' });
            return;
        }

        if (interaction.channel.type !== ChannelType.GuildText) {
            await interaction.editReply({ content: 'This command is only available in guild message channels.' });
            return;
        }

        if (args.length > 0) {
            const role = interaction.guild.roles.cache.find((role) => role.name.toLowerCase() === args[0].toLowerCase());

            const extraRole = interaction.guild.roles.cache.get(args[1]);

            const member = await interaction.guild.members.fetch(interaction.user.id);

            const ticket = await this.makeTicketThread(interaction.channel, args[0], {
                members: [member],
                roles: role ? [role, extraRole].filter((r): r is Role => r !== null && r !== undefined) : []
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
                                    .join(', ')}${access.roles ? access.roles.map((entry) => `<@&${entry.id}>`).join('') : ''}
                                    ) : ''}.`
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
