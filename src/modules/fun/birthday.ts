import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleContainerBuilder from '@src/system/backend/builders/gargoyleContainerBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import { createBanner } from '@src/system/backend/tools/banners.js';
import Emojis from '@src/system/backend/tools/emojis.js';
import {
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ContainerBuilder,
    Guild,
    GuildMember,
    InteractionContextType,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageActionRowComponentBuilder,
    MessageFlags,
    NewsChannel,
    PermissionFlagsBits,
    Role,
    SectionBuilder,
    TextChannel,
    TextDisplayBuilder
} from 'discord.js';
import { model, Schema } from 'mongoose';

export default class Birthday extends GargoyleModule {
    public override category: string = 'fun';
    public override slashCommands: GargoyleSlashCommandBuilder[] = [
        new GargoyleSlashCommandBuilder()
            .setName('birthday')
            .setDescription('Set or view your birthday')
            .setContexts(InteractionContextType.Guild)
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('set')
                    .setDescription('Set your birthday')
                    .addIntegerOption((option) =>
                        option.setName('day').setDescription('Your birthday').setRequired(true).setMinValue(1).setMaxValue(31)
                    )
                    .addStringOption((option) =>
                        option
                            .setName('month')
                            .setDescription('Your birth month')
                            .setRequired(true)
                            .addChoices(
                                { name: 'January', value: '0' },
                                { name: 'February', value: '1' },
                                { name: 'March', value: '2' },
                                { name: 'April', value: '3' },
                                { name: 'May', value: '4' },
                                { name: 'June', value: '5' },
                                { name: 'July', value: '6' },
                                { name: 'August', value: '7' },
                                { name: 'September', value: '8' },
                                { name: 'October', value: '9' },
                                { name: 'November', value: '10' },
                                { name: 'December', value: '11' }
                            )
                    )
                    .addIntegerOption(
                        (option) =>
                            option
                                .setName('year')
                                .setDescription('Your birth year')
                                .setRequired(false)
                                .setMinValue(new Date().getFullYear() - 110)
                                .setMaxValue(new Date().getFullYear() - 12) // At least 13 years old to use Discord
                    )
            )
            .addSubcommand((subcommand) => subcommand.setName('opt-out').setDescription('Remove your birthday from the database'))
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('view')
                    .setDescription('View your or another users birthday (optional)')
                    .addUserOption((option) => option.setName('user').setDescription('The user to view the birthday of').setRequired(false))
            )
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('guild')
                    .setDescription('Manage guild birthday settings')
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('channel')
                            .setDescription('Set the birthday channel')
                            .addChannelOption((option) =>
                                option
                                    .setName('channel')
                                    .setDescription('The channel to send birthday messages in')
                                    .setRequired(false)
                                    .addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildText)
                            )
                    )
                    // .addSubcommand((subcommand) =>
                    //     subcommand
                    //         .setName('role')
                    //         .setDescription('Set the birthday role')
                    //         .addRoleOption((option) => option.setName('role').setDescription('The role to give on birthdays').setRequired(false))
                    // )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('mention-role')
                            .setDescription('Set the birthday mention role')
                            .addRoleOption((option) => option.setName('role').setDescription('The role to mention on birthdays').setRequired(false))
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('trigger')
                            .setDescription('Trigger birthday messages in the birthday channel')
                            .addBooleanOption((option) => option.setName('force').setDescription('Whether to force the trigger'))
                    )
            ) as GargoyleSlashCommandBuilder
    ];

    private birthdaySetups: Map<string, Date> = new Map();
    private lastChange: Map<string, Date> = new Map();

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'birthday') {
            if (!client.db) {
                await interaction.reply({ content: 'Database connection is not available.', flags: MessageFlags.Ephemeral });
                return;
            }
            if (interaction.options.getSubcommandGroup(false) === 'guild') {
                if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                    await interaction.reply({
                        content: 'You need the `Manage Guild` permission to use this command.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                let dbGuild = await databaseGuildBirthdays.findOne({ guildId: interaction.guildId! }).catch((err: Error) => {
                    client.logger.error(`Failed to fetch guild birthday settings for guild ${interaction.guildId}: ${err.stack}`);
                });

                if (!dbGuild) {
                    dbGuild = new databaseGuildBirthdays({
                        guildId: interaction.guildId!,
                        channelId: null,
                        birthdayRoleId: null,
                        mentionRoleId: null
                    });
                    await dbGuild.save().catch((err: Error) => {
                        client.logger.error(`Failed to create guild birthday settings for guild ${interaction.guildId}: ${err.stack}`);
                    });
                }

                if (interaction.options.getSubcommand() === 'channel') {
                    const channel = interaction.options.getChannel('channel', false);
                    if (!channel) {
                        await interaction.reply({
                            components: [
                                new ContainerBuilder().addSectionComponents(
                                    new SectionBuilder()
                                        .addTextDisplayComponents(
                                            new TextDisplayBuilder().setContent(
                                                `The birthday channel is ${dbGuild.channelId ? `currently set to <#${dbGuild.channelId}>` : 'not set'}. You can set it by providing a channel.`
                                            )
                                        )
                                        .setButtonAccessory(
                                            new GargoyleButtonBuilder(this, 'remove', 'channel')
                                                .setLabel('Remove Channel')
                                                .setDisabled(!dbGuild.channelId)
                                                .setStyle(ButtonStyle.Danger)
                                        )
                                )
                            ],
                            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                        });
                        return;
                    } else {
                        dbGuild.channelId = channel.id;
                        await dbGuild.save().catch((err: Error) => {
                            client.logger.error(`Failed to update guild birthday channel for guild ${interaction.guildId}: ${err.stack}`);
                        });
                        await interaction.reply({
                            content: `The birthday channel has been set to <#${channel.id}>.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                } else if (interaction.options.getSubcommand() === 'role') {
                    const role = interaction.options.getRole('role', false);
                    if (!role) {
                        await interaction.reply({
                            components: [
                                new ContainerBuilder().addSectionComponents(
                                    new SectionBuilder()
                                        .addTextDisplayComponents(
                                            new TextDisplayBuilder().setContent(
                                                `The birthday role is ${dbGuild.birthdayRoleId ? `currently set to <@&${dbGuild.birthdayRoleId}>` : 'not set'}. You can set it by providing a role.`
                                            )
                                        )
                                        .setButtonAccessory(
                                            new GargoyleButtonBuilder(this, 'remove', 'role')
                                                .setLabel('Remove Role')
                                                .setStyle(ButtonStyle.Danger)
                                                .setDisabled(!dbGuild.birthdayRoleId)
                                        )
                                )
                            ],
                            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                        });
                        return;
                    } else {
                        dbGuild.birthdayRoleId = role.id;
                        await dbGuild.save().catch((err: Error) => {
                            client.logger.error(`Failed to update guild birthday role for guild ${interaction.guildId}: ${err.stack}`);
                        });
                        await interaction.reply({
                            content: `The birthday role has been set to <@&${role.id}>.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                } else if (interaction.options.getSubcommand() === 'mention-role') {
                    const role = interaction.options.getRole('role', false);
                    if (!role) {
                        await interaction.reply({
                            components: [
                                new ContainerBuilder().addSectionComponents(
                                    new SectionBuilder()
                                        .addTextDisplayComponents(
                                            new TextDisplayBuilder().setContent(
                                                `The birthday mention role is ${
                                                    dbGuild.mentionRoleId ? `currently set to <@&${dbGuild.mentionRoleId}>` : 'not set'
                                                }. You can set it by providing a role.`
                                            )
                                        )
                                        .setButtonAccessory(
                                            new GargoyleButtonBuilder(this, 'remove', 'mentionrole')
                                                .setLabel('Remove Mention Role')
                                                .setStyle(ButtonStyle.Danger)
                                                .setDisabled(!dbGuild.mentionRoleId)
                                        )
                                )
                            ],
                            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                        });
                        return;
                    } else {
                        dbGuild.mentionRoleId = role.id;
                        await dbGuild.save().catch((err: Error) => {
                            client.logger.error(`Failed to update guild birthday mention role for guild ${interaction.guildId}: ${err.stack}`);
                        });
                        await interaction.reply({
                            content: `The birthday mention role has been set to <@&${role.id}>.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                } else if (interaction.options.getSubcommand() === 'trigger') {
                    const force = interaction.options.getBoolean('force', false) || false;
                    if (dbGuild.channelId) {
                        const channel = interaction.guild?.channels.cache.get(dbGuild.channelId);
                        if (channel && (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)) {
                            let birthdayMembers: GuildMember[] = [];
                            if (!force) {
                                birthdayMembers = await this.getGuildBirthdays(client, interaction.guild!);
                            } else {
                                birthdayMembers = [interaction.member as GuildMember];
                            }

                            if (birthdayMembers.length === 0) {
                                await interaction.reply({ content: 'No members have their birthday today.', flags: MessageFlags.Ephemeral });
                                return;
                            }

                            for (const member of birthdayMembers) {
                                await this.sendBirthdayMessage(channel as TextChannel | NewsChannel, member);
                            }

                            await interaction.reply({
                                content: `Triggered birthday messages for ${birthdayMembers.length} member(s) in ${channel}.`,
                                flags: MessageFlags.Ephemeral
                            });

                            return;
                        } else {
                            dbGuild.channelId = null;
                            await dbGuild.save().catch((err: Error) => {
                                client.logger.error(`Failed to update guild birthday channel for guild ${interaction.guildId}: ${err.stack}`);
                            });
                            await interaction.reply({
                                content: 'The birthday channel was invalid and has been removed. Please set a new one.',
                                flags: MessageFlags.Ephemeral
                            });
                            return;
                        }
                    } else {
                        await interaction.reply({ content: 'No birthday channel is set.', flags: MessageFlags.Ephemeral });
                        return;
                    }
                }
            } else if (interaction.options.getSubcommand() === 'set') {
                const day = interaction.options.getInteger('day', true);
                const month = interaction.options.getString('month', true);
                const year = interaction.options.getInteger('year', false) || null;

                if (month === '2' && day > 29) {
                    await interaction.reply({ content: 'February only has 29 days at most.', flags: MessageFlags.Ephemeral });
                    return;
                }
                if ([4, 6, 9, 11].includes(parseInt(month)) && day > 30) {
                    await interaction.reply({ content: 'The selected month only has 30 days.', flags: MessageFlags.Ephemeral });
                    return;
                }

                const birthdayDate = new Date();
                birthdayDate.setUTCDate(day);
                birthdayDate.setUTCMonth(parseInt(month));
                if (year) birthdayDate.setUTCFullYear(year);
                else birthdayDate.setUTCFullYear(1000); // Default year if not provided

                this.birthdaySetups.set(interaction.user.id, birthdayDate);

                await interaction.reply({
                    components: [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `${Emojis.WhiteConfetti} Your Birthday is set for **${birthdayDate.toLocaleDateString('en-US', {
                                        year: year ? 'numeric' : undefined,
                                        month: 'long',
                                        day: 'numeric'
                                    })}**.` +
                                        `\n-# **Keep in mind that this information is public, and will be shown to everyone in guilds you share on your birthday.**` +
                                        `\n-# You can remove it at any time with \`/birthday opt-out\`.`
                                )
                            )
                            .addActionRowComponents(
                                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                                    new GargoyleButtonBuilder(this, 'confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
                                    new GargoyleButtonBuilder(this, 'cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
                                )
                            )
                    ],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            } else if (interaction.options.getSubcommand() === 'opt-out') {
                const dbBirthday = await databaseUserBirthdays.findOneAndDelete({ userId: interaction.user.id }).catch((err: Error) => {
                    client.logger.error(`Failed to remove birthday for user ${interaction.user.id}: ${err.stack}`);
                });
                if (!dbBirthday) {
                    await interaction.reply({ content: 'You do not have a birthday set.', flags: MessageFlags.Ephemeral });
                    return;
                }
                await interaction.reply({ content: 'Your birthday has been removed from the database.', flags: MessageFlags.Ephemeral });
            } else if (interaction.options.getSubcommand() === 'view') {
                const user = interaction.options.getUser('user', false) || interaction.user;
                const dbBirthday = await databaseUserBirthdays.findOne({ userId: user.id }).catch((err: Error) => {
                    client.logger.error(`Failed to fetch birthday for user ${user.id}: ${err.stack}`);
                });
                if (!dbBirthday) {
                    if (user.id === interaction.user.id) {
                        await interaction.reply({ content: 'You do not have a birthday set.', flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: `${user.username} does not have a birthday set.`, flags: MessageFlags.Ephemeral });
                    }
                    return;
                }
                const birthday = new Date();
                birthday.setUTCDate(dbBirthday.day);
                birthday.setUTCMonth(dbBirthday.month);
                if (dbBirthday.year) birthday.setUTCFullYear(dbBirthday.year);
                else birthday.setUTCFullYear(1000);

                if (user.id === interaction.user.id) {
                    await interaction.reply({
                        content: `Your birthday is set to **${birthday.toLocaleDateString('en-US', {
                            year: dbBirthday.year ? 'numeric' : undefined,
                            month: 'long',
                            day: 'numeric'
                        })}**.`,
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    await interaction.reply({
                        content: `${user.username}'s birthday is set to **${birthday.toLocaleDateString('en-US', {
                            year: dbBirthday.year ? 'numeric' : undefined,
                            month: 'long',
                            day: 'numeric'
                        })}**.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            } else {
                await interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
            }
        }
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'confirm') {
            const birthday = this.birthdaySetups.get(interaction.user.id);
            if (!birthday) {
                interaction.reply({ content: 'No birthday setup found to confirm.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (this.lastChange.has(interaction.user.id)) {
                const lastChange = this.lastChange.get(interaction.user.id)!;
                const now = new Date();
                const diff = now.getTime() - lastChange.getTime();
                if (diff < 48 * 60 * 60 * 1000) {
                    await interaction.reply({
                        content: `You can only change your birthday once every 48 hours. Please try again in ${Math.ceil(
                            (48 * 60 * 60 * 1000 - diff) / 1000
                        )} seconds.`,
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
            } else this.lastChange.set(interaction.user.id, new Date());

            const birthdayData = {
                userId: interaction.user.id,
                day: birthday.getUTCDate(),
                month: birthday.getUTCMonth(),
                year: birthday.getUTCFullYear() === 1000 ? null : birthday.getUTCFullYear()
            };

            const dbBirthday = await databaseUserBirthdays
                .findOneAndUpdate({ userId: interaction.user.id }, birthdayData, { upsert: true, new: true })
                .catch(async (err: Error) => {
                    client.logger.error(`Failed to set birthday for user ${interaction.user.id}: ${err.stack}`);
                    await interaction.reply({
                        content: 'There was an error setting your birthday. Please try again later.',
                        flags: MessageFlags.Ephemeral
                    });
                });

            if (!dbBirthday) return;
            await interaction.update({
                components: [
                    new GargoyleContainerBuilder(
                        `Your birthday has been set to **${birthday.toLocaleDateString('en-US', {
                            year: birthdayData.year ? 'numeric' : undefined,
                            month: 'long',
                            day: 'numeric'
                        })}** ${Emojis.WhiteConfetti}`
                    )
                ],
                flags: MessageFlags.IsComponentsV2
            });
            this.birthdaySetups.delete(interaction.user.id);

            return;
        } else if (args[0] === 'cancel') {
            this.birthdaySetups.delete(interaction.user.id);
            interaction.reply({ content: 'Birthday setup has been cancelled.', flags: MessageFlags.Ephemeral });
            return;
        } else if (args[0] === 'remove') {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                await interaction.reply({
                    content: 'You need the `Manage Guild` permission to use this button.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            let dbGuild = await databaseGuildBirthdays.findOne({ guildId: interaction.guildId! }).catch((err: Error) => {
                client.logger.error(`Failed to fetch guild birthday settings for guild ${interaction.guildId}: ${err.stack}`);
            });

            if (!dbGuild) {
                dbGuild = new databaseGuildBirthdays({
                    guildId: interaction.guildId!,
                    channelId: null,
                    birthdayRoleId: null,
                    mentionRoleId: null
                });
                await dbGuild.save().catch((err: Error) => {
                    client.logger.error(`Failed to create guild birthday settings for guild ${interaction.guildId}: ${err.stack}`);
                });
            }

            if (args[1] === 'channel') {
                if (!dbGuild.channelId) {
                    await interaction.reply({ content: 'No birthday channel is set.', flags: MessageFlags.Ephemeral });
                    return;
                }
                dbGuild.channelId = null;
                await dbGuild.save().catch((err: Error) => {
                    client.logger.error(`Failed to remove guild birthday channel for guild ${interaction.guildId}: ${err.stack}`);
                });
                await interaction.reply({ content: 'Birthday channel has been removed.', flags: MessageFlags.Ephemeral });
                return;
            } else if (args[1] === 'role') {
                if (!dbGuild.birthdayRoleId) {
                    await interaction.reply({ content: 'No birthday role is set.', flags: MessageFlags.Ephemeral });
                    return;
                }
                dbGuild.birthdayRoleId = null;
                await dbGuild.save().catch((err: Error) => {
                    client.logger.error(`Failed to remove guild birthday role for guild ${interaction.guildId}: ${err.stack}`);
                });
                await interaction.reply({ content: 'Birthday role has been removed.', flags: MessageFlags.Ephemeral });
                return;
            } else if (args[1] === 'mentionrole') {
                if (!dbGuild.mentionRoleId) {
                    await interaction.reply({ content: 'No birthday mention role is set.', flags: MessageFlags.Ephemeral });
                    return;
                }
                dbGuild.mentionRoleId = null;
                await dbGuild.save().catch((err: Error) => {
                    client.logger.error(`Failed to remove guild birthday mention role for guild ${interaction.guildId}: ${err.stack}`);
                });
                await interaction.reply({ content: 'Birthday mention role has been removed.', flags: MessageFlags.Ephemeral });
                return;
            }
        }
        await interaction.reply({ content: 'Unknown button action.', flags: MessageFlags.Ephemeral });
    }

    private async getBirthdayUsers(client: GargoyleClient) {
        return await databaseUserBirthdays
            .find({
                month: new Date().getUTCMonth(),
                day: new Date().getUTCDate()
            })
            .catch((err: Error) => {
                client.logger.error(`Failed to fetch birthday users: ${err.stack}`);
                return [];
            });
    }

    private async getGuildBirthdays(client: GargoyleClient, guild: Guild): Promise<GuildMember[]> {
        const birthdayUsers = await this.getBirthdayUsers(client);
        if (!birthdayUsers || birthdayUsers.length === 0) return [];

        const members: GuildMember[] = [];
        for (const birthdayUser of birthdayUsers) {
            const member = await guild.members.fetch(birthdayUser.userId).catch(() => null);
            if (member) members.push(member);
        }
        return members;
    }

    private async checkBirthdays(client: GargoyleClient) {
        if (client.db === null) return;
        const guilds = client.guilds.cache;
        for (const [, guild] of guilds) {
            let dbGuild = await databaseGuildBirthdays.findOne({ guildId: guild.id }).catch((err: Error) => {
                client.logger.error(`Failed to fetch guild birthday settings for guild ${guild.id}: ${err.stack}`);
            });

            if (!dbGuild) {
                dbGuild = new databaseGuildBirthdays({
                    guildId: guild.id,
                    channelId: null,
                    birthdayRoleId: null,
                    mentionRoleId: null
                });
                await dbGuild.save().catch((err: Error) => {
                    client.logger.error(`Failed to create guild birthday settings for guild ${guild.id}: ${err.stack}`);
                });
            }

            if (dbGuild.lastCheck) {
                const lastCheck = dbGuild.lastCheck;
                const now = new Date();
                if (now.getDay() === lastCheck.getDay()) return;
            }

            if (!dbGuild.channelId) {
                dbGuild.lastCheck = new Date();
                await dbGuild.save().catch((err: Error) => {
                    client.logger.error(`Failed to update last check for guild ${guild.id}: ${err.stack}`);
                });
                return;
            }

            const birthdayMembers = await this.getGuildBirthdays(client, guild);
            if (birthdayMembers.length === 0) {
                dbGuild.lastCheck = new Date();
                await dbGuild.save().catch((err: Error) => {
                    client.logger.error(`Failed to update last check for guild ${guild.id}: ${err.stack}`);
                });
                return;
            }

            const channel = guild.channels.cache.get(dbGuild.channelId);
            if (!channel || !channel.isTextBased()) {
                dbGuild.channelId = null;
                dbGuild.lastCheck = new Date();
                await dbGuild.save().catch((err: Error) => {
                    client.logger.error(`Failed to update guild birthday channel for guild ${guild.id}: ${err.stack}`);
                });
                return;
            }

            const role = dbGuild.mentionRoleId ? guild.roles.cache.get(dbGuild.mentionRoleId) : undefined;

            for (const member of birthdayMembers) {
                await this.sendBirthdayMessage(channel as TextChannel | NewsChannel, member, role);
                // #TODO: Figure out a way to manage roles, as I do not want to fetch every single member to check if they have the role.
            }

            dbGuild.lastCheck = new Date();
            await dbGuild.save().catch((err: Error) => {
                client.logger.error(`Failed to update last check for guild ${guild.id}: ${err.stack}`);
            });
        }
    }

    private async sendBirthdayMessage(channel: TextChannel | NewsChannel, member: GuildMember, role?: Role) {
        const message = await channel.send({
            components: [
                new ContainerBuilder()
                    .setAccentColor(0xffffff)
                    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://birthday.png')))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `Happy Birthday, <@${member.id}>! ${Emojis.WhiteConfetti}` + `${role ? `\n-# <@&${role.id}>` : ''}`
                        )
                    )
            ],
            files: [
                await createBanner(`It's ${member.user.username}'s birthday!`, {
                    fillStyle: '#ffffff',
                    width: 1080,
                    height: 80,
                    bannerStyle: 'underline',
                    fileName: 'birthday'
                })
            ],
            flags: [MessageFlags.IsComponentsV2]
        });
        if (message) message.react(Emojis.WhiteConfetti).catch(() => null);
        return message;
    }

    public override init(client: GargoyleClient): void {
        setInterval(
            async () => {
                this.checkBirthdays(client);
            },
            30 * 60 * 1000
        );
    }
}

const birthdayUserSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    day: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: false
    }
});

const birthdayGuildSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    lastCheck: {
        type: Date,
        required: false
    },
    channelId: {
        type: String,
        required: false
    },
    birthdayRoleId: {
        type: String,
        required: false
    },
    mentionRoleId: {
        type: String,
        required: false
    }
});

const databaseUserBirthdays = model('Birthdays', birthdayUserSchema);
const databaseGuildBirthdays = model('GuildBirthdays', birthdayGuildSchema);
