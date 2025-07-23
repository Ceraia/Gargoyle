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
    InteractionContextType,
    MessageActionRowComponentBuilder,
    MessageCreateOptions,
    MessageEditOptions,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    PrivateThreadChannel,
    Role,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
    TextChannel,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
    ThreadChannel
} from 'discord.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import client from '@src/system/botClient.js';
import GargoyleButtonBuilder, { GargoyleURLButtonBuilder } from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import { editAsServer, sendAsServer } from '@src/system/backend/tools/server.js';
import { GargoyleStringSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import { int } from 'zod/v4';

export default class Brads extends GargoyleCommand {
    public override category: string = 'bgn';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('bgn')
            .setDescription("A command for Brad's RP")
            .addGuild('324195889977622530')
            .addSubcommand((subcommand) => subcommand.setName('panel').setDescription('Send the BGN panel')) as GargoyleSlashCommandBuilder,
        new GargoyleSlashCommandBuilder()
            .setName('transcripts')
            .setDescription('Get transcripts of a ticket')
            .setContexts(InteractionContextType.Guild)
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addSubcommand((subcommand) => subcommand.setName('recent').setDescription('Get recent tickets'))
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('user')
                    .setDescription('Get recent transcripts of a user')
                    .addUserOption((option) => option.setName('user').setDescription('The user to get transcripts for').setRequired(true))
            ) as GargoyleSlashCommandBuilder
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
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# If you are having the "missing asset" or "server is running a different version of:" error please try the following.\n` +
                            `\n` +
                            `> 1. Unsubscribe from all mods via Steam.\n` +
                            `> 2. Delete 304390 folder (SteamLibrary -> steamapps -> workshop -> content).\n` +
                            `> 3. Delete appworkshop_304930.acf (SteamLibrary -> steamapps -> workshop).\n` +
                            `> 4. Delete Unturned_Data folder  (SteamLibrary -> steamapps -> common -> Unturned).\n` +
                            `> 5. Verify integrity of Unturned.\n` +
                            `> 6. Start game and try again.\n`
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
        } else if (interaction.options.getSubcommand() === 'recent') {
            await interaction.deferReply({});
            if (!interaction.guild || !interaction.channel) {
                await interaction.editReply({ content: 'This can only be used in a guild channel.' });
                return;
            }

            const ticketChannel = interaction.guild.channels.cache.find(
                (channel) => channel.name === 'support' && channel.type === ChannelType.GuildText
            );

            if (!ticketChannel) {
                await interaction.editReply({ content: 'Could not find the "support" channel.' });
                return;
            }

            const threads = await (ticketChannel as TextChannel).threads.fetchArchived({
                type: 'private',
                limit: 10
            });

            if (threads.threads.size === 0) {
                await interaction.editReply({ content: 'No recent tickets found.' });
                return;
            }

            await interaction.editReply({
                components: [
                    new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent('### Recent Tickets')).addSectionComponents(
                        threads.threads.map((thread) => {
                            const threadMembers = thread.members.cache.filter((m) => !m.user!.bot).map((m) => m);
                            const member = threadMembers[0];

                            return new SectionBuilder()
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(
                                        `- ${member ? `<@!${member.id}>` : thread.name.split('-')[1]}${
                                            thread.createdAt ? ` on <t:${Math.floor(thread.createdAt.getTime() / 1000)}:f>` : ``
                                        }`
                                    )
                                )
                                .setButtonAccessory(
                                    new GargoyleURLButtonBuilder(`https://discord.com/channels/${interaction.guild!.id}/${thread.id}`).setLabel(
                                        'Get Transcript'
                                    )
                                );
                        })
                    )
                ],
                flags: [MessageFlags.IsComponentsV2],
                allowedMentions: { parse: [] }
            });
        } else if (interaction.options.getSubcommand() === 'user') {
            await interaction.deferReply({});
            if (!interaction.guild || !interaction.channel) {
                await interaction.editReply({ content: 'This can only be used in a guild channel.' });
                return;
            }

            const user = interaction.options.getUser('user', true);
            const ticketChannel = interaction.guild.channels.cache.find(
                (channel) => channel.name === 'support' && channel.type === ChannelType.GuildText
            );

            if (!ticketChannel) {
                await interaction.editReply({ content: 'Could not find the "support" channel.' });
                return;
            }

            const threads = await (ticketChannel as TextChannel).threads.fetchArchived({
                type: 'private',
                limit: 100
            });

            const userThreads = threads.threads.filter((thread) => thread.members.cache.has(user.id));

            if (userThreads.size === 0) {
                await interaction.editReply({ content: `No recent tickets found for ${user.username}.` });
                return;
            }

            const limitedUserThreads = userThreads.first(10);

            await interaction.editReply({
                components: [
                    new ContainerBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Recent Tickets for ${user.username}`))
                        .addSectionComponents(
                            limitedUserThreads.map((thread) => {
                                const threadMembers = thread.members.cache.filter((m) => !m.user!.bot).map((m) => m);
                                const member = threadMembers[0];

                                return new SectionBuilder()
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder().setContent(
                                            `- ${member ? `<@!${member.id}>` : thread.name.split('-')[1]}${
                                                thread.createdAt ? ` on <t:${Math.floor(thread.createdAt.getTime() / 1000)}:f>` : ``
                                            }`
                                        )
                                    )
                                    .setButtonAccessory(
                                        new GargoyleURLButtonBuilder(`https://discord.com/channels/${interaction.guild!.id}/${thread.id}`).setLabel(
                                            'Get Transcript'
                                        )
                                    );
                            })
                        )
                ],
                flags: [MessageFlags.IsComponentsV2],
                allowedMentions: { parse: [] }
            });
        }
    }

    public override async executeSelectMenuCommand(_client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'remove') {
            await interaction.deferUpdate();
            for (const userId of interaction.values) {
                await (interaction.channel as PrivateThreadChannel).members.remove(userId).catch(() => {});
            }
            interaction.editReply({ content: 'Removed all of the selected members.', components: [] });
        }
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'apply') {
            const member = await interaction.guild!.members.fetch(interaction.user.id).catch(() => null);
            if (!member) {
                await interaction.reply({ content: 'You must be a member of the server to apply for staff.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (member.roles.cache.some((role) => role.name.toLowerCase().includes('staff blacklist'))) {
                await interaction.reply({ content: 'You are blacklisted from applying for staff.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (args.length === 1) {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                await interaction.editReply({
                    components: [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    'You can apply for staff by clicking the button below. You will be asked to fill out a form with some questions, please answer them as best as you can.'
                                ),
                                new TextDisplayBuilder().setContent(
                                    '## Requirements' +
                                        '\n> - You must be at least 15 years old.' +
                                        '\n> - You must have at least had 50 hours of gameplay on the server.' +
                                        '\n> - You must have linked steam with your discord account.' +
                                        '\n> - You must have a good understanding of the rules.' +
                                        '\n> - You must not have received any form of punishment 2 weeks before/after applying.' +
                                        '\n> - You must not be on a Permanent ban agreement when applying, You may apply once it is over.'
                                )
                            )
                            .addActionRowComponents(
                                new ActionRowBuilder<GargoyleButtonBuilder>().addComponents(
                                    new GargoyleButtonBuilder(this, 'apply', 'apply')
                                        .setLabel('Apply for Staff')
                                        .setStyle(ButtonStyle.Primary)
                                        .setEmoji('🚪')
                                )
                            )
                    ],
                    flags: [MessageFlags.IsComponentsV2]
                });
            } else {
                await interaction
                    .showModal(
                        new GargoyleModalBuilder(this, 'apply')
                            .setTitle('Staff Application')
                            .setComponents(
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                                    new TextInputBuilder()
                                        .setLabel('Steam Profile Link')
                                        .setCustomId('steam')
                                        .setStyle(TextInputStyle.Short)
                                        .setPlaceholder('https://steamcommunity.com/profiles/1234567890')
                                ),
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                                    new TextInputBuilder()
                                        .setLabel('What timezone are you in?')
                                        .setCustomId('timezone')
                                        .setStyle(TextInputStyle.Short)
                                        .setPlaceholder('Amsterdam, Berlin, Rome, Stockholm, Vienna (UTC+1)')
                                ),
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                                    new TextInputBuilder()
                                        .setLabel('Do you have other staff experience?')
                                        .setCustomId('other')
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setPlaceholder('If so, please list them here and explain your role in them.')
                                ),
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                                    new TextInputBuilder()
                                        .setLabel('Why do you want to be staff?')
                                        .setCustomId('reason')
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setPlaceholder('Please explain why you want to be staff.')
                                ),
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                                    new TextInputBuilder()
                                        .setLabel('What makes you stand out?')
                                        .setCustomId('stand')
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setPlaceholder('Please explain what makes you stand out from other applicants.')
                                )
                            )
                    )
                    .catch((err) => {
                        client.logger.error(`Failed to show application modal : ${err.stack}`);
                    });
            }
            return;
        } else if (args[0] === 'discuss') {
            // Args[1] is the user ID of the person who applied, so we can use it to send a message to them later
            // Args[2] is the channel ID of the panel where the thread can be made
            await interaction.deferUpdate();

            if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
                await interaction.followUp({ content: 'This can only be used in a guild channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            const member = await interaction.guild.members.fetch(args[1]);
            if (!member) {
                await interaction.followUp({ content: 'Could not find the member to discuss their application.', flags: MessageFlags.Ephemeral });
                return;
            }
            const channel = interaction.guild.channels.cache.get(args[2]) as TextChannel | undefined;
            if (!channel || channel.type !== ChannelType.GuildText) {
                await interaction.followUp({ content: 'Could not find the channel to discuss the application.', flags: MessageFlags.Ephemeral });
                return;
            }

            const staffRoles = interaction.guild.roles.cache.filter(
                (role) => role.name.toLowerCase().includes('staff supervisor') || role.name.toLowerCase().includes('head of staff')
            );

            let thread: ThreadChannel | undefined = undefined;
            try {
                thread = await channel.threads.create({
                    name: `staff-discussion-${member.user.username}`,
                    type: ChannelType.PrivateThread,
                    invitable: true,
                    autoArchiveDuration: 1440 // 1 day
                });
            } catch (error) {
                await interaction.followUp({ content: `Failed to create a discussion thread: ${error}`, flags: MessageFlags.Ephemeral });
            }

            if (thread) {
                await thread.members.add(member.id).catch(() => {});
                await thread.members.add(interaction.user.id).catch(() => {});
                await thread.send({
                    components: [
                        new ContainerBuilder().addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `### Discussion Thread for ${member.user.username}'s Staff Application\n-# ${staffRoles.map((role) => `<@&${role.id}>`).join(' ')}`
                            )
                        )
                    ],
                    flags: [MessageFlags.IsComponentsV2]
                });
                await interaction.followUp({ content: `Discussion thread created: <#${thread.id}>`, flags: MessageFlags.Ephemeral });
            }
            return;
        }

        if (args[0] === 'accept') {
            await interaction.showModal(
                // Args[1] is the user ID of the person who applied, so we can use it to send a message to them later
                new GargoyleModalBuilder(this, 'accept', args[1], interaction.message.id)
                    .setTitle('Reason for Accepting')
                    .setComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setStyle(TextInputStyle.Paragraph)
                                .setCustomId('reason')
                                .setLabel('Reason for Accepting')
                                .setPlaceholder('Please explain why you are accepting this application.')
                        )
                    )
            );
            return;
        } else if (args[0] === 'deny') {
            await interaction.showModal(
                // Args[1] is the user ID of the person who applied, so we can use it to send a message to them later
                new GargoyleModalBuilder(this, 'deny', args[1], interaction.message.id)
                    .setTitle('Reason for Denying')
                    .setComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setStyle(TextInputStyle.Paragraph)
                                .setCustomId('reason')
                                .setLabel('Reason for Denying')
                                .setPlaceholder('Please explain why you are denying this application.')
                        )
                    )
            );
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!interaction.guild || !interaction.channel) {
            interaction.editReply({ content: 'This can only be used in a guild channel.' });
            return;
        }

        if (args[0] === 'archive') {
            if (!interaction.channel.isThread()) {
                await interaction.editReply({ content: 'This is only available in threads.' });
                return;
            }

            await interaction.channel.send({ content: `<@!${interaction.user.id}> is closing the ticket.` }).catch((err) => client.logger.error(err));

            await (interaction.channel as PrivateThreadChannel).setArchived(true);
            await interaction.editReply({ content: 'Ticket archived.' });

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
        } else if ((args[0] === 'ban' || args[0] === 'staff') && args.length === 2) {
            if (!interaction.guild || !interaction.channel) {
                await interaction.editReply({ content: 'This can only be used in a guild channel.' });
                return;
            }
            
        }

        if (interaction.channel.type !== ChannelType.GuildText) {
            await interaction.editReply({ content: 'This command is only available in guild message channels.' });
            return;
        }

        if (args.length > 0) {
            if (
                interaction.guild?.members.cache
                    .get(interaction.user.id)
                    ?.roles.cache.some((role) => role.name.toLowerCase().includes(`${args[0].toLowerCase()} blacklist`))
            ) {
                await interaction.editReply({
                    content: `You are blacklisted from using any ${args[0].toLowerCase()} commands.`
                });
                return;
            }

            await interaction.message.edit(this.panelMessage as MessageEditOptions).catch(async () => {
                await editAsServer(this.panelMessage, interaction.channel as TextChannel, interaction.message.id);
            });

            const role = interaction.guild.roles.cache.find((role) => role.name.toLowerCase() === args[0].toLowerCase());

            const roleOverride = interaction.guild.roles.cache.get(args[1]);

            const member = await interaction.guild.members.fetch(interaction.user.id);

            const ticket = await this.makeTicketThread(
                interaction.channel,
                args[0],
                args[0] === 'ban'
                    ? {
                          content:
                              `Staff member who banned you : \n` +
                              `In-game name : \n` +
                              `Steam profile link : \n` +
                              `Apology / why you think you should be unbanned :`
                      }
                    : args[0] === 'staff'
                      ? {
                            content:
                                `Staff member being reported : \n` +
                                `Reason for report : \n` +
                                `Any relevant Information regarding this report : \n` +
                                `All relevant proof for this report :`
                        }
                      : undefined,

                {
                    members: [member],
                    roles: roleOverride ? [roleOverride] : role ? [role] : []
                }
            );

            if (typeof ticket === 'string') {
                await interaction.editReply({ content: `Failed to create a ticket: ${ticket}` });
                return;
            }

            await interaction.editReply({ content: `Ticket has been made, you can view it here <#${ticket.id}>` });
            return;
        }
    }

    public override async executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'apply') {
            await interaction.deferUpdate({});

            const steam = interaction.fields.getTextInputValue('steam');
            const timezone = interaction.fields.getTextInputValue('timezone');
            const other = interaction.fields.getTextInputValue('other');
            const reason = interaction.fields.getTextInputValue('reason');
            const stand = interaction.fields.getTextInputValue('stand');

            if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
                interaction.editReply({ content: 'This can only be used in a guild channel.' });
                return;
            }

            const guild = await interaction.guild.fetch();
            const applicationsChannel = guild.channels.cache.find(
                (c) => c.type === ChannelType.GuildText && c.name.includes('staff-applications')
            ) as TextChannel | undefined;

            if (!applicationsChannel) {
                await interaction.editReply({ content: 'Could not find the staff applications channel.' });
                return;
            }

            const staffRoles = guild.roles.cache.filter(
                (role) => role.name.toLowerCase().includes('staff supervisor') || role.name.toLowerCase().includes('head of staff')
            );

            applicationsChannel
                .send({
                    components: [
                        new ContainerBuilder().addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `### Staff Application from <@!${interaction.user.id}>` +
                                    `\n-# ${staffRoles.map((role) => `<@&${role.id}>`).join(' ')}` +
                                    `\n**Steam Profile :**` +
                                    `\n> ${steam}` +
                                    `\n**Timezone :** ` +
                                    `\n> ${timezone}` +
                                    `\n**Other Experience :**` +
                                    `\n> ${other.replaceAll('\n', '\n> ')}` +
                                    `\n**Reason for Applying :**` +
                                    `\n> ${reason.replaceAll('\n', '\n> ')}` +
                                    `\n**What makes you stand out? :**` +
                                    `\n> ${stand.replaceAll('\n', '\n> ')}`
                            )
                        ),
                        new ContainerBuilder().addActionRowComponents(
                            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                                new GargoyleButtonBuilder(this, 'accept', interaction.user.id).setLabel('Accept').setStyle(ButtonStyle.Success),
                                new GargoyleButtonBuilder(this, 'discuss', interaction.user.id, interaction.channelId!)
                                    .setLabel('Discuss')
                                    .setStyle(ButtonStyle.Secondary),
                                new GargoyleButtonBuilder(this, 'deny', interaction.user.id).setLabel('Deny').setStyle(ButtonStyle.Danger)
                            )
                        )
                    ],
                    flags: [MessageFlags.IsComponentsV2]
                })
                .catch((err) => {
                    client.logger.error(`Failed to send application message: ${err.stack}`);
                    interaction.editReply({
                        content: 'There was an error submitting your application. Please try again later.'
                    });
                });

            await interaction.editReply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0x00ff00)
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('### Application Submitted!'))
                ]
            });
            return;
        } else if (args[0] === 'accept' || args[0] === 'deny') {
            // Args[1] is the user ID of the person who applied, so we can use it to send a message to them later
            // Args[2] is the message ID of the application message, so we can edit it later
            await interaction.deferUpdate({});

            const reason = interaction.fields.getTextInputValue('reason');

            const member = await interaction.guild!.members.fetch(args[1]).catch(async () => {
                client.logger.trace(`Failed to fetch member with ID ${args[1]} for application update.`);
                return null;
            });

            if (!member && args[0] === 'accept') {
                await interaction.followUp({
                    content: 'Could not find the member to update their application status.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
                await interaction.followUp({ content: 'This can only be used in a guild channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            const ticketChannel = interaction.guild.channels.cache.find(
                (channel) => channel.name === 'staff-applications' && channel.type === ChannelType.GuildText
            ) as TextChannel | undefined;

            if (!ticketChannel) {
                await interaction.followUp({ content: 'Could not find the staff applications channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            const staffRole = interaction.guild.roles.cache.find(
                (role) => role.name.toLowerCase().includes('staff interviewee') || role.name.toLowerCase().includes('staff applicant')
            );

            if (!staffRole) {
                await interaction.followUp({ content: 'Could not find the staff role to update the member.', flags: MessageFlags.Ephemeral });
                return;
            }

            const applicationMessage = await ticketChannel.messages.fetch(interaction.message!.id);

            await applicationMessage.edit({
                components: [
                    applicationMessage.components[0],
                    new ContainerBuilder()
                        .setAccentColor(args[0] === 'accept' ? 0x00ff00 : 0xff0000)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `### ${args[0] === 'accept' ? 'Accepted' : 'Denied'} by <@!${interaction.user.id}>` + `\n> ${reason}`
                            )
                        )
                ],
                flags: [MessageFlags.IsComponentsV2]
            });

            if (member) {
                if (args[0] === 'accept') {
                    await member.roles.add(staffRole).catch((err) => {
                        interaction.followUp({
                            content: `Failed to add the staff role to the user: ${err}\nYou will have to add the <@&${staffRole.id}> role manually.`,
                            flags: MessageFlags.Ephemeral,
                            allowedMentions: { roles: [] }
                        });
                    });
                }
                member
                    .send({
                        content:
                            `Your staff application has been ${args[0] === 'accept' ? 'accepted' : 'denied'} by <@!${interaction.user.id}>.` +
                            `\n> Reason: ${reason}` +
                            (args[0] === 'accept' ? `\n\n> A staff member will contact you soon to discuss the next steps.` : '')
                    })
                    .catch(async () => {
                        await interaction.followUp({
                            content: `Failed to send a message to the user, they may have DMs disabled.`,
                            flags: MessageFlags.Ephemeral
                        });
                    });
            }
        }
    }

    private async makeTicketThread(
        channel: TextChannel,
        category: string,
        extraMessage: MessageCreateOptions | undefined,
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
                .catch((_err) => {
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

            if (extraMessage) await sendAsServer(client, { ...extraMessage, allowedMentions: {} }, thread);

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
}
