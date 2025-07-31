import { GargoyleURLButtonBuilder } from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import { GargoyleStringSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleTextCommandBuilder from '@src/system/backend/builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { createBanner, FontWeight } from '@src/system/backend/tools/banners.js';
import { editAsServer, sendAsServer } from '@src/system/backend/tools/server.js';
import { createCanvas } from 'canvas';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    AttachmentBuilder,
    ChannelType,
    ChatInputCommandInteraction,
    ClientEvents,
    ContainerBuilder,
    Events,
    GuildMember,
    InteractionEditReplyOptions,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    Message,
    MessageActionRowComponentBuilder,
    MessageCreateOptions,
    MessageFlags,
    MessageType,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    SectionBuilder,
    TextChannel,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
    ThumbnailBuilder
} from 'discord.js';
import { model, Schema } from 'mongoose';

const minecraftBgnGuild = '1039152052644880435';

export default class Ceraia extends GargoyleCommand {
    public override category: string = 'bgn';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('minecraft')
            .setDescription('BGN\s Minecraft commands')
            .addGuild(minecraftBgnGuild)
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('vote')
                    .setDescription('Vote related commands')
                    .addSubcommand((subcommand) => subcommand.setName('create').setDescription('Create a vote'))
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('edit')
                            .setDescription('Edit an existing vote')
                            .addStringOption((option) =>
                                option.setName('message').setDescription('The message ID of the vote to edit').setRequired(true)
                            )
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('giverole')
                            .setDescription('Gives roles to select users who voted')
                            .addStringOption((option) =>
                                option.setName('message').setDescription('The message ID of the vote to give roles for').setRequired(true)
                            )
                    )
            )
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('management')
                    .setDescription('Management commands')
                    .addSubcommand((subcommand) => subcommand.setName('register').setDescription('Register a Minecraft server'))
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('supporter')
                            .setDescription('Set a user as a supporter')
                            .addUserOption((option) => option.setName('user').setDescription('The user to set as a supporter').setRequired(true))
                    )
                    .addSubcommand((subcommand) => subcommand.setName('clearnicks').setDescription('Clears all nicknames in the guild'))
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('link')
                    .setDescription('Links your Discord account to your Minecraft account')
                    .addStringOption((option) =>
                        option.setName('code').setDescription('The linking code').setMaxLength(4).setMinLength(4).setRequired(false)
                    )
            ) as GargoyleSlashCommandBuilder
    ];

    public override textCommands: GargoyleTextCommandBuilder[] = [
        new GargoyleTextCommandBuilder().setName('bgnmc').setDescription('BGN\s Minecraft advertisement banner command').setPrivate(true),
        new GargoyleTextCommandBuilder()
            .setName('link')
            .setDescription('Links your Discord account to your Minecraft account')
            .addGuild(minecraftBgnGuild),
        new GargoyleTextCommandBuilder().setName('codetest').setDescription('Test codes').setPrivate(true)
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'minecraft') {
            if (interaction.options.getSubcommandGroup() === 'vote') {
                if (interaction.options.getSubcommand() === 'create') {
                    interaction.showModal(
                        new GargoyleModalBuilder(this, 'create')
                            .setTitle('Create a vote')
                            .addComponents(
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('title')
                                        .setLabel('Vote Title')
                                        .setStyle(TextInputStyle.Short)
                                        .setRequired(true)
                                ),
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('description')
                                        .setLabel('Vote Description')
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setRequired(true)
                                ),
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('options')
                                        .setLabel('Vote Options (semicolon separated)')
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setRequired(true)
                                )
                            )
                    );
                } else if (interaction.options.getSubcommand() === 'edit') {
                    const messageId = interaction.options.getString('message', true);

                    const voteData = await databaseMinecraftVote.findOne({ messageId });
                    if (!voteData) {
                        await interaction.reply({
                            content: 'Vote not found.',
                            flags: [MessageFlags.Ephemeral]
                        });
                        return;
                    }
                    interaction.showModal(
                        new GargoyleModalBuilder(this, 'edit', messageId)
                            .setTitle('Edit Vote')
                            .addComponents(
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('title')
                                        .setLabel('Vote Title')
                                        .setStyle(TextInputStyle.Short)
                                        .setRequired(true)
                                        .setValue(voteData.title)
                                ),
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('description')
                                        .setLabel('Vote Description')
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setRequired(true)
                                        .setValue(voteData.description)
                                ),
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('options')
                                        .setLabel('Vote Options (semicolon separated)')
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setRequired(true)
                                        .setValue(voteData.options.join('; '))
                                )
                            )
                    );
                } else if (interaction.options.getSubcommand() === 'giverole') {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                    const messageId = interaction.options.getString('message', true);

                    const voteData = await databaseMinecraftVote.findOne({ messageId });
                    if (!voteData) {
                        await interaction.editReply({
                            content: 'Vote not found.'
                        });
                        return;
                    }

                    await interaction.editReply({
                        components: [
                            new ContainerBuilder()
                                .setAccentColor(hexToNumber(BGNColors.Blue))
                                .addTextDisplayComponents(new TextDisplayBuilder().setContent('Select the vote option to give a specific role for'))
                                .addActionRowComponents(
                                    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                                        new GargoyleStringSelectMenuBuilder(this, 'role', voteData.messageId).setMinValues(1).addOptions(
                                            voteData.options.map((option, index) => ({
                                                value: index.toString(),
                                                label: option,
                                                emoji: index < 5 ? Object.values(BGNCubeEmojis)[index] : ''
                                            }))
                                        )
                                    )
                                )
                        ],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                }
            } else if (interaction.options.getSubcommandGroup() === 'management') {
                if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                    await interaction.reply({
                        content: 'You do not have permission to use this command.',
                        flags: [MessageFlags.Ephemeral]
                    });
                    return;
                }
                if (interaction.options.getSubcommand() === 'clearnicks') {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                    client.logger.info(`Clearing all nicknames in guild ${interaction.guildId}`);
                    const members = await interaction.guild!.members.fetch();

                    for (const member of members) {
                        const [_memberId, memberData] = member;
                        if (memberData.nickname) {
                            try {
                                await memberData.setNickname(null);
                            } catch (error) {}
                        }
                    }

                    await interaction.editReply({
                        content: 'All nicknames have been cleared.'
                    });
                } else if (interaction.options.getSubcommand() === 'register') {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                    const guildData = await databaseMinecraftGuild.findOne({ guildId: minecraftBgnGuild });

                    // Generate a new secret, alphanumeric 32 characters
                    const secret = [...Array(32)].map(() => Math.random().toString(36).toUpperCase()[2]).join('');
                    if (!guildData) {
                        const newGuildData = new databaseMinecraftGuild({
                            guildId: minecraftBgnGuild,
                            serverSecret: secret
                        });
                        await newGuildData.save();
                    } else {
                        guildData.serverSecret = secret;
                        await guildData.save();
                    }

                    await interaction.editReply({
                        content:
                            `# ${BGNEmojis.RedWarning} THIS CONTAINS YOUR SERVER SECRET ${BGNEmojis.RedWarning}` +
                            `\nWrite this down, this will only be shown *once*, **it can be reset** in the future.` +
                            `\n||\`\`\`\n/register ${secret}\n\`\`\`||`
                    });
                } else if (interaction.options.getSubcommand() === 'supporter') {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                    const user = interaction.options.getUser('user', true);
                    const member = interaction.guild!.members.cache.get(user.id);
                    if (!member) {
                        await interaction.editReply({
                            content: 'User not found in the BGN Minecraft guild.'
                        });
                        return;
                    }
                    await interaction.editReply({ content: `Sending supporter message` });

                    const message = await sendAsServer(
                        {
                            ...(await boostMessage(member))
                        },
                        interaction.channel as TextChannel
                    );

                    message?.react(BGNEmojis.GreenCheers);
                }
            } else if (interaction.options.getSubcommand() === 'link') {
                const code = interaction.options.getString('code');
                if (code) {
                    const linkingUser = this.linkingUsers.get(code);
                    if (!linkingUser) {
                        await interaction.reply({
                            content: 'Invalid linking code.',
                            flags: [MessageFlags.Ephemeral]
                        });
                        return;
                    }
                    if (!linkingUser.minecraftUsername) {
                        await interaction.reply({
                            content: 'You need to link this code in the Minecraft server!',
                            flags: [MessageFlags.Ephemeral]
                        });
                        return;
                    }
                    linkingUser.discordUserId = interaction.user.id;
                    this.linkingUsers.set(code, linkingUser);
                    await this.linkedUser(client, code);
                    await interaction.reply({
                        content: `Successfully linked your Discord account to your Minecraft account: ${linkingUser.minecraftUsername}`,
                        flags: [MessageFlags.Ephemeral]
                    });
                } else {
                    for (const [code, linkingUser] of this.linkingUsers.entries()) {
                        if (linkingUser.discordUserId === interaction.user.id) {
                            this.linkingUsers.delete(code);
                        }
                    }
                    const useableLinkingCode = createLinkingCode();
                    this.linkingUsers.set(useableLinkingCode, {
                        discordUserId: interaction.user.id,
                        minecraftUsername: null
                    });
                    await interaction.reply({
                        content: `Your linking code is: \`\\link ${useableLinkingCode}\`. Use this code in the Minecraft server to link your account.`,
                        flags: [MessageFlags.Ephemeral]
                    });
                }
            }
        }
    }

    public override async executeTextCommand(client: GargoyleClient, message: Message, ...args: string[]): Promise<void> {
        if (args[0] === 'bgnmc') {
            // BGNMC is a command to send an advertisement banner for the BGN Minecraft server
            if (!client.guilds.cache.get(minecraftBgnGuild)?.members.cache.get(message.author.id)?.permissions.has(PermissionFlagsBits.Administrator))
                return;

            if (!message.guild) return;

            await message.delete().catch(() => {});

            await sendAsServer(
                {
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(hexToNumber(BGNColors.Blue))
                            .addSectionComponents(
                                new SectionBuilder()
                                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.guilds.cache.get(minecraftBgnGuild)?.iconURL()!))
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder().setContent(
                                            `# ${BGNCubeEmojis.Cube_Blue} Introducing Brad's Minecraft!` +
                                                `\nIntroducing Brad's Minecraft, a community-driven Minecraft server where your voice matters!` +
                                                `\n\nJoin us in shaping the future of our server by participating in community votes and sharing your ideas!` +
                                                `\n\n> Do you have any suggestions? Message <@!${message.author.id}>!`
                                        )
                                    )
                            )
                            .addSectionComponents(
                                new SectionBuilder()
                                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Join our community and be part of the adventure!`))
                                    .setButtonAccessory(
                                        new GargoyleURLButtonBuilder('https://discord.gg/A7V5NRwgjP')
                                            .setLabel('Join the Discord!')
                                            .setEmoji(BGNEmojis.Discord)
                                    )
                            )
                            .addMediaGalleryComponents(
                                new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://info.png`))
                            )
                            .addTextDisplayComponents(this.bgnMcInfo)
                    ],
                    flags: [MessageFlags.IsComponentsV2],
                    files: [
                        await createBanner('Info', {
                            fillStyle: BGNColors.Blue,
                            textStyle: '#ffffff',
                            width: 1080,
                            height: 56,
                            fontSize: 40,
                            fontWeight: FontWeight.Bold,
                            textAlign: 'center',
                            textBaseline: 'middle',
                            bannerStyle: 'underline',
                            fileName: `info`
                        })
                    ]
                },
                message.channel as TextChannel
            );
        } else if (args[0] === 'link') {
            // Link command to link the user's Discord account to their Minecraft account
            if (args.length < 2) {
                for (const [code, linkingUser] of this.linkingUsers.entries()) {
                    if (linkingUser.discordUserId === message.author.id) {
                        this.linkingUsers.delete(code);
                    }
                }
                const useableLinkingCode = createLinkingCode();
                this.linkingUsers.set(useableLinkingCode, {
                    discordUserId: message.author.id,
                    minecraftUsername: null
                });
                await message.reply({
                    content: `Your linking code is: \`\\link ${useableLinkingCode}\`. Use this code in the Minecraft server to link your account.`,
                    allowedMentions: { users: [] }
                });
                return;
            }

            const code = args[1];
            const linkingUser = this.linkingUsers.get(code);
            if (!linkingUser) {
                await message.reply({
                    content: 'Invalid linking code.'
                });
                return;
            }
            if (!linkingUser.minecraftUsername) {
                await message.reply({
                    content: 'You need to link this code in the Minecraft server!'
                });
                return;
            }
            linkingUser.discordUserId = message.author.id;
            this.linkingUsers.set(code, linkingUser);
            await this.linkedUser(client, code);
            await message.reply({
                content: `Successfully linked your Discord account to your Minecraft account: ${linkingUser.minecraftUsername}`
            });
        }
    }

    public override async executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'create') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const options = interaction.fields
                .getTextInputValue('options')
                .split(';')
                .map((option) => option.trim());

            const message = await sendAsServer(
                {
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(hexToNumber(BGNColors.Blue))
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent('One moment...'))
                    ],
                    flags: MessageFlags.IsComponentsV2
                },
                interaction.channel as TextChannel
            );

            if (!message) {
                await interaction.editReply({
                    content:
                        'Failed to send the vote message. make sure I have the appropriate permissions to send messages, and to manage webhooks in this channel.'
                });
                return;
            }

            const voteData = {
                ownerId: interaction.user.id,
                title: title,
                description: description,
                options: options,
                channelId: interaction.channelId,
                messageId: message.id,
                votes: []
            };

            const newVote = new databaseMinecraftVote(voteData);
            await newVote.save();

            await editAsServer(await this.createMinecraftVoteMessage(client, message.id), interaction.channel as TextChannel, message.id);

            await interaction.editReply('Vote created successfully!');
        } else if (args[0] === 'edit') {
            // Args[0] is edit
            // Args[1] is the message ID of the vote to edit
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const options = interaction.fields
                .getTextInputValue('options')
                .split(';')
                .map((option) => option.trim());

            const voteData = await databaseMinecraftVote.findOne({ messageId: args[1] });
            if (!voteData) {
                await interaction.editReply({
                    content: 'Vote not found.'
                });
                return;
            }

            voteData.title = title;
            voteData.description = description;
            voteData.options = options;
            await voteData.save();

            const message = await interaction.channel!.messages.fetch(args[1]);
            if (message)
                await editAsServer(await this.createMinecraftVoteMessage(client, voteData.messageId), message.channel as TextChannel, message.id);

            await interaction.editReply('Vote edited successfully!');
        }
    }

    public override async executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'vote') {
            await interaction.deferUpdate();
            const selectedOption = interaction.values[0];
            const voteData = await databaseMinecraftVote.findOne({ messageId: interaction.message.id });
            if (!voteData) throw new Error('Vote not found');

            const userVote = voteData.votes.find((vote) => vote.userId === interaction.user.id);
            if (userVote) {
                userVote.vote = parseInt(selectedOption, 10);
            } else {
                voteData.votes.push({ userId: interaction.user.id, vote: parseInt(selectedOption, 10) });
            }

            await voteData.save();

            const updatedMessage = await this.createMinecraftVoteMessage(client, interaction.message.id);
            await editAsServer(updatedMessage, interaction.channel as TextChannel, interaction.message.id);

            if (userVote) {
                await interaction.followUp({
                    content: `Your vote has been updated to **${voteData.options[parseInt(selectedOption, 10)]}**.`,
                    flags: [MessageFlags.Ephemeral]
                });
            } else {
                await interaction.followUp({
                    content: `You have voted for **${voteData.options[parseInt(selectedOption, 10)]}**.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }
        } else if (args[0] === 'role') {
            // Args[0] is role Args[1] is the message ID of the vote to give roles for
            await interaction.deferUpdate();
            const selectedOption = interaction.values[0];
            const voteData = await databaseMinecraftVote.findOne({ messageId: args[1] });
            if (!voteData) {
                interaction.editReply({
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(hexToNumber(BGNColors.Red))
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent('Failed to find vote, this should not happen.'))
                    ],
                    flags: [MessageFlags.IsComponentsV2]
                });
                return;
            }

            let role = interaction.guild?.roles.cache.find((role) => role.name === `Vote - ${voteData.options[parseInt(selectedOption)]}`);

            if (!role) {
                role = await interaction.guild?.roles.create({
                    name: `Vote - ${voteData.options[parseInt(selectedOption)]}`.substring(0, 100),
                    reason: 'Role created for Minecraft vote'
                });
            }

            if (!role) {
                interaction.editReply({
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(hexToNumber(BGNColors.Red))
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent('Failed to create role, this should not happen.'))
                    ],
                    flags: [MessageFlags.IsComponentsV2]
                });
                return;
            }

            for (const memberId of voteData.votes.filter((vote) => vote.vote === parseInt(selectedOption)).map((vote) => vote.userId)) {
                if (!memberId) continue;
                const member = await interaction.guild?.members.fetch(memberId);
                if (member) {
                    await member.roles.add(role);
                }
            }

            await interaction.editReply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(hexToNumber(BGNColors.Green))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `Role ${role.name} has been assigned to all voters of ${voteData.options[parseInt(selectedOption)]}.`
                            )
                        )
                ],
                flags: [MessageFlags.IsComponentsV2]
            });
        }
    }

    public override async executeApiRequest(client: GargoyleClient, request: Request): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname === '/api/minecraft/user/link') {
            // Linking a member
            // curl -X POST "http://localhost:3000/api/minecraft/user/link" \
            //   -H "Content-Type: application/json" \
            //   -d '{"secret":"your_server_secret_here", "minecraftUsername":"TestPlayer", "linkingCode":"1234"}'

            const { secret, minecraftUsername, linkingCode } = (await request.json()) as {
                secret: string;
                minecraftUsername: string;
                linkingCode?: string;
            };

            if (!secret) {
                return Promise.resolve(new Response('Missing secret parameter', { status: 400, headers: { 'Content-Type': 'text/plain' } }));
            }

            if (!minecraftUsername) {
                return Promise.resolve(new Response('Missing minecraftUsername parameter', { status: 400 }));
            }

            const guildData = await databaseMinecraftGuild.findOne({ guildId: minecraftBgnGuild });
            if (!guildData || guildData.serverSecret !== secret) {
                return Promise.resolve(new Response('Invalid secret', { status: 403, headers: { 'Content-Type': 'text/plain' } }));
            }

            if (!linkingCode) {
                // Delete any existing linking codes for this Minecraft username, this ensures that the user can only have one active linking code at a time
                for (const [code, linkingUser] of this.linkingUsers.entries()) {
                    if (linkingUser.minecraftUsername === minecraftUsername) {
                        this.linkingUsers.delete(code);
                    }
                }

                // Create a new linking code for the user and send it back
                const useableLinkingCode = createLinkingCode();
                this.linkingUsers.set(useableLinkingCode, {
                    discordUserId: null,
                    minecraftUsername: minecraftUsername
                });
                return Promise.resolve(new Response(useableLinkingCode, { status: 200, headers: { 'Content-Type': 'text/plain' } }));
            }

            // Check if the linking code exists
            const linkingUser = this.linkingUsers.get(linkingCode);
            if (!linkingUser) {
                return Promise.resolve(new Response('Invalid linking code', { status: 400, headers: { 'Content-Type': 'text/plain' } })); // Delete any minecraft username linked to the user
            }

            // There is a linking code, but no discord user, so the user needs to complete the linking process in the Discord server
            if (!linkingUser.discordUserId) {
                return Promise.resolve(new Response('No Discord account linked', { status: 400, headers: { 'Content-Type': 'text/plain' } }));
            }

            // If the linking code exists and the user has a discord user id, then we can link the user
            linkingUser.minecraftUsername = minecraftUsername;
            this.linkingUsers.set(linkingCode, linkingUser);
            await this.linkedUser(client, linkingCode);
            return Promise.resolve(new Response('Linked', { status: 200, headers: { 'Content-Type': 'text/plain' } }));
        } else if (url.pathname === '/api/minecraft/user/booster') {
            // Check if the user is a booster
            const minecraftUsername = url.searchParams.get('minecraftUsername');
            if (!minecraftUsername) {
                return Promise.resolve(
                    new Response('Missing minecraftUsername parameter', { status: 400, headers: { 'Content-Type': 'text/plain' } })
                );
            }
            const linkingUser = Array.from(this.linkingUsers.values()).find((user) => user.minecraftUsername === minecraftUsername);
            if (!linkingUser) {
                return Promise.resolve(new Response('User not linked', { status: 400, headers: { 'Content-Type': 'text/plain' } }));
            }
            if (!linkingUser.discordUserId) {
                return Promise.resolve(new Response('User not linked to Discord', { status: 400, headers: { 'Content-Type': 'text/plain' } }));
            }
            const discordMember = client.guilds.cache.get(minecraftBgnGuild)?.members.cache.get(linkingUser.discordUserId);
            if (!discordMember) {
                return Promise.resolve(new Response('Discord user not found', { status: 400, headers: { 'Content-Type': 'text/plain' } }));
            }
            const isBooster = discordMember.premiumSinceTimestamp !== null;
            return Promise.resolve(
                new Response(isBooster ? 'Yes' : 'No', {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' }
                })
            );
        }

        return Promise.resolve(new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } }));
    }

    private async linkedUser(client: GargoyleClient, linkingCode: string) {
        const linkingUser = this.linkingUsers.get(linkingCode);
        if (!linkingUser) {
            return;
        }
        if (!linkingUser.discordUserId) {
            return;
        }

        const discordMember = await client.guilds.cache.get(minecraftBgnGuild)?.members.fetch(linkingUser.discordUserId);
        if (!discordMember) {
            return;
        }

        await discordMember.setNickname(linkingUser.minecraftUsername).catch(() => {});
        this.linkingUsers.delete(linkingCode);
    }

    private linkingUsers = new Map<string, { discordUserId: string | null; minecraftUsername: string | null }>();

    private bgnMcInfo = new TextDisplayBuilder().setContent(
        `Currently, the server is in a testing phase, so please be patient with us as we work out any issues.` +
            `\nHowever, we have already decided the following:` +
            `\n${BGNCubeEmojis.Cube_Blue} **All Staff commands will be logged, open & available to the public.**` +
            `\n> This is to ensure not only that there is no abuse of power, but also to grant transparency to the community.` +
            `\n${BGNCubeEmojis.Cube_Blue} **Our staff will remain a barebones team, with purely the powers they require to do their job.**` +
            `\n> This is to ensure that we do not have any staff members who are overpowered or have too many commands.` +
            `\n${BGNCubeEmojis.Cube_Blue} **Any major changes to the server will be decided upon by the community.**` +
            `\n> This is to ensure that the community has a say in what happens on the server, and that we do not make any changes that the community does not want.` +
            `\n${BGNCubeEmojis.Cube_Blue} ***NO PAY TO WIN.***` +
            `\n> Donations may be accepted at some point in the future, however they will not and should not grant anyone an edge over others.`
    );

    private async createMinecraftVoteMessage(client: GargoyleClient, messageId: string) {
        const voteData = await databaseMinecraftVote.findOne({ messageId });
        if (!voteData) throw new Error('Vote not found');

        // Calculate vote counts for each option
        const voteCounts = new Array(voteData.options.length).fill(0);
        const totalVotes = voteData.votes.length;

        voteData.votes.forEach((vote) => {
            if (vote.vote != null && vote.vote >= 0 && vote.vote < voteData.options.length) {
                voteCounts[vote.vote]++;
            }
        });

        // Create a canvas for the vote progress bar
        const canvas = createCanvas(1080, 8);
        const ctx = canvas.getContext('2d');

        const colors = Object.values(BGNColors).map((color) => {
            return color;
        });

        // Draw sections with width proportional to vote counts
        let x = 0;
        voteCounts.forEach((count, index) => {
            const width = (count / totalVotes) * 1080;
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, canvas.height - 8, width, canvas.height);
            x += width;
        });

        // Add the canvas as an attachment
        const voteImage = new AttachmentBuilder(canvas.toBuffer(), {
            name: 'votecounter.png'
        });

        const voteOptions = voteData.options
            .map((option, index) => {
                const count = voteCounts[index] || 0;
                const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(2) : '0.00';
                const emoji = index < 5 ? Object.values(BGNCubeEmojis)[index] : '';
                return `${emoji} **${option}** - ${count} vote(s) (${percentage}%)`;
            })
            .join('\n');

        const interactionEditReply: InteractionEditReplyOptions = {
            components: [
                new ContainerBuilder()
                    .setAccentColor(hexToNumber(BGNColors.Blue))
                    .addSectionComponents(
                        new SectionBuilder()
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.guilds.cache.get(minecraftBgnGuild)?.iconURL()!))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `# ${BGNCubeEmojis.Cube_Blue} Brad's Minecraft` +
                                        `\nWelcome to Brad's Minecraft, we are currently still setting everything up.` +
                                        '\n\nIt is highly important to us that we make a server that ***you*** will enjoy!' +
                                        '\nSo cast your vote and let us know what you want to see!' +
                                        `\n\n> Do you have any suggestions? Message <@!${voteData.ownerId}>!`
                                )
                            )
                    )
                    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://info.png`)))
                    .addTextDisplayComponents(this.bgnMcInfo)
                    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://staff.png`)))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `If you want to apply to staff, message <@!${voteData.ownerId}>` +
                                `\nAll staff applications will be reviewed at some point, so please be patient.`
                        )
                    )

                    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://vote.png`)))
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(voteData.description))
                    .addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://votecounter.png`))
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                            new GargoyleStringSelectMenuBuilder(this, 'vote').addOptions(
                                voteData.options.map((option, index) => ({
                                    label: option.substring(0, 25),
                                    value: `${index}`,
                                    emoji: index < 5 ? Object.values(BGNCubeEmojis)[index] : ''
                                }))
                            )
                        )
                    )
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${voteOptions.replaceAll('\n', '    ')}`))
            ],
            files: [
                await createBanner('Apply to Staff', {
                    fillStyle: BGNColors.Blue,
                    textStyle: '#ffffff',
                    width: 1080,
                    height: 56,
                    fontSize: 40,
                    fontWeight: FontWeight.Bold,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    bannerStyle: 'underline',
                    fileName: `staff`
                }),
                await createBanner('Info', {
                    fillStyle: BGNColors.Blue,
                    textStyle: '#ffffff',
                    width: 1080,
                    height: 56,
                    fontSize: 40,
                    fontWeight: FontWeight.Bold,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    bannerStyle: 'underline',
                    fileName: `info`
                }),
                await createBanner(voteData.title!, {
                    fillStyle: BGNColors.Blue,
                    textStyle: '#ffffff',
                    width: 1080,
                    height: 112,
                    fontSize: 48,
                    fontWeight: FontWeight.Bold,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    bannerStyle: 'underline',
                    fileName: `vote`
                }),
                voteImage
            ],
            flags: [MessageFlags.IsComponentsV2]
        };

        return interactionEditReply;
    }

    public override events: GargoyleEvent[] = [
        new MemberBoostedMessage()
        //new MemberBoosted()
    ];
}

class MemberBoosted extends GargoyleEvent {
    public override event: keyof ClientEvents = Events.GuildMemberUpdate;

    public override async execute(client: GargoyleClient, oldMember: GuildMember, newMember: GuildMember): Promise<void> {
        client.logger.trace(`${oldMember.premiumSince}, ${newMember.premiumSince}`);
        if (!oldMember.premiumSince && newMember.premiumSince) {
            if (oldMember.guild.id !== minecraftBgnGuild) return;

            if (!newMember.roles.cache.find((role) => role.tags?.premiumSubscriberRole)) return;

            if (newMember.premiumSinceTimestamp && newMember.premiumSinceTimestamp < Date.now() - 15 * 1000) return;

            client.logger.info(`Member ${newMember.displayName} has boosted ${newMember.guild.name}`);

            const guild = oldMember.guild;

            const boosterChannel = guild.channels.cache.find(
                (channel) => channel.name.toLowerCase().includes('boosters') && channel.type === ChannelType.GuildText
            ) as TextChannel | undefined;
            if (!boosterChannel) return;

            try {
                const message = await sendAsServer(
                    {
                        ...(await boostMessage(newMember))
                    },
                    boosterChannel
                );

                message?.react(BGNEmojis.GreenCheers);
            } catch {}
        }
    }
}

class MemberBoostedMessage extends GargoyleEvent {
    public override event: keyof ClientEvents = Events.MessageCreate;

    public override async execute(client: GargoyleClient, message: Message): Promise<void> {
        if (!message.guild) return;
        if (message.guild.id !== minecraftBgnGuild) return;
        if (!message.member) return;
        if (message.channel.type !== ChannelType.GuildText) return;
        if (!message.channel.name.toLowerCase().includes('boosters')) return;

        if (message.type == MessageType.GuildBoost) {
            try {
                const authorMember = message.guild.members.cache.get(message.author.id);
                if (!authorMember) return;
                const sentMessage = await message.reply({
                    ...(await boostMessage(authorMember))
                });

                sentMessage?.react(BGNEmojis.GreenCheers);
            } catch {}
        }
    }
}

async function boostMessage(member: GuildMember) {
    return {
        components: [
            new ContainerBuilder()
                .setAccentColor(hexToNumber(BGNColors.Green))
                .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://boosted.png`)))
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(member.displayAvatarURL()))

                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `# ${BGNEmojis.GreenCheers} <@!${member.id}> ` +
                                    `\nThank you for your support!` +
                                    `\n${BGNEmojis.GreenContainer} A special package with Booster features awaits you!` +
                                    `\n-# Booster features are purely cosmetic and will not effect gameplay in any meaningful way.`
                            )
                        )
                )
        ],
        files: [
            await createBanner(`${member.displayName} has boosted the server!`, {
                fillStyle: BGNColors.Green,
                textStyle: '#ffffff',
                width: 1080,
                height: 56,
                fontSize: 40,
                fontWeight: FontWeight.Bold,
                textAlign: 'center',
                textBaseline: 'middle',
                bannerStyle: 'underline',
                fileName: `boosted`
            })
        ],
        flags: [MessageFlags.IsComponentsV2],
        allowedMentions: {
            parse: []
        }
    } as MessageCreateOptions;
}

function createLinkingCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
}

enum BGNColors {
    Blue = '#00d2ff',
    Red = '#ff6b6b',
    Green = '#4ecdc4',
    Yellow = '#ffeaa7',
    Purple = '#dda0dd',
    Orange = '#ff8c42'
}

enum BGNPollEmojis {
    //<:poll_blue:1399274271137730671> <:poll_green:1399274468232269907> <:poll_red:1399274380596350997> <:poll_purple:1399274743344926722> <:poll_yellow:1399274632342671393>
    Poll_Blue = '<:poll_blue:1399274271137730671>',
    Poll_Red = '<:poll_red:1399274380596350997>',
    Poll_Green = '<:poll_green:1399274468232269907>',
    Poll_Yellow = '<:poll_yellow:1399274632342671393>',
    Poll_Purple = '<:poll_purple:1399274743344926722>'
}

enum BGNCubeEmojis {
    //<:cube:1399289771045552148> <:cube:1399289834832662620> <:cube:1399289917162655826> <:cube:1399289988025290803> <:cube:1399290093474287636>
    Cube_Blue = '<:cube_blue:1399289771045552148>',
    Cube_Red = '<:cube_red:1399289834832662620>',
    Cube_Green = '<:cube_green:1399289917162655826>',
    Cube_Yellow = '<:cube_yellow:1399289988025290803>',
    Cube_Purple = '<:cube_purple:1399290093474287636>'
}

enum BGNEmojis {
    Discord = '<:discord:1399301352798031912>',
    RedWarning = '<:shield:1399992174497759293>',
    OrangeCheers = '<:cheers:1400024058375962716>',
    GreenCheers = '<:cheers_green:1400085490320937091>',
    BlueContainer = '<:container_blue:1400023892445106297>',
    OrangeContainer = '<:container_orange:1400053085790797924>',
    GreenContainer = '<:container_green:1400085433467146292>',
    BlueHeart = '<:heart_blue:1400339529214459935>',
    GreenHeart = '<:heart_green:1400339625066893448>',
    PurpleHeart = '<:heart_purple:1400339848598130748>',
    RedHeart = '<:heart_red:1400339417423548487>',
    YellowHeart = '<:heart_yellow:1400339775184965652>'
}

const minecraftGuildSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    serverSecret: {
        type: String
    }
});

const minecraftVoteSchema = new Schema({
    ownerId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    votes: [
        {
            userId: String,
            vote: Number
        }
    ]
});

const databaseMinecraftVote = model('MinecraftVotes', minecraftVoteSchema);

const databaseMinecraftGuild = model('MinecraftGuilds', minecraftGuildSchema);
