import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@builders/gargoyleEmbedBuilder.js';
import GargoyleModalBuilder from '@builders/gargoyleModalBuilder.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Events,
    GuildMember,
    InteractionContextType,
    Message,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
    VoiceChannel
} from 'discord.js';
import { getUserVoiceActivity } from '@src/events/voice/voiceActivity.js';
import GargoyleTextCommandBuilder from '@src/system/backend/builders/gargoyleTextCommandBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import client from '@src/system/botClient.js';
import { playAudio } from '@src/system/backend/tools/voice.js';

export default class Entropy extends GargoyleCommand {
    public override category: string = 'entropy';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('entropy')
            .setDescription('Entropy related commands')
            .addGuild('1009048008857493624')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('activity')
                    .setDescription('Voice activity related commands')
                    .addSubcommand((subcommand) => subcommand.setName('calculate').setDescription('Calculate voice activity'))
                    .addSubcommand((subcommand) => subcommand.setName('leaderboard').setDescription('Get voice leaderboard'))
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('view')
                            .setDescription("View a user's voice activity")
                            .addUserOption((option) => option.setName('user').setDescription('The user to view').setRequired(false))
                    )
            )
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];
    public override textCommands = [
        new GargoyleTextCommandBuilder()
            .setName('chinese')
            .setPrivate(true)
            .setDescription('Chinese Gong')
            .setContexts([InteractionContextType.Guild])
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'calculate') {
            if (!interaction.guild) return;
            if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) === false) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }
            const guildMembers = await interaction.guild.members.fetch();

            await interaction.reply({
                content: `Calculating all VC statistics for the past 7 days for ${guildMembers.size} members...`,
                flags: MessageFlags.Ephemeral
            });

            const rankedMembers = await this.getVoiceActivity(Array.from(guildMembers.values()));

            await this.setMemberRoles(rankedMembers);

            await interaction.editReply(`Finished calculating VC statistics for ${guildMembers.size} members for the past 7 days. Roles applied.`);
        } else if (interaction.options.getSubcommand() === 'leaderboard') {
            if (!interaction.guild) return;

            const guildMembers = await interaction.guild.members.fetch();

            await interaction.reply({ content: `Calculating all VC statistics for the past 7 days for ${guildMembers.size} members...` });
            const rankedMembers = await this.getVoiceActivity(Array.from(guildMembers.values()));

            const embed = new GargoyleEmbedBuilder()
                .setTitle('Voice Activity Leaderboard')
                .setDescription('Top members based on their voice activity in the past 7 days.');

            // Add top 10 members or fewer if less than 10
            const topMembers = rankedMembers.slice(0, 10);
            for (const [index, member] of topMembers.entries()) {
                embed.addFields({
                    name: `#${index + 1}: ${member.guildMember.user.username}`,
                    value: `Activity: ${member.activity} minutes`
                });
            }

            await interaction.editReply({
                content: 'Here is the leaderboard:',
                embeds: [embed]
            });
        } else if (interaction.options.getSubcommand() === 'view') {
            if (!interaction.guild) return;
            await interaction.deferReply();

            const user = interaction.options.getUser('user') || interaction.user;

            const userVoiceActivity = await getUserVoiceActivity(user.id, interaction.guild.id, 7 * 24 * 60);

            await interaction.editReply({ content: `Voice activity for ${user.username} in the past 7 days: ${userVoiceActivity} minutes` });
        }
    }

    public override async executeTextCommand(client: GargoyleClient, message: Message): Promise<void> {
        const match = message.content.match(/,chinese\s+<#(\d+)>/);
        if (match) {
            const channelId = match[1];
            const channel = await message.guild!.channels.fetch(channelId);
            if (channel && channel.isVoiceBased()) {
                playAudio(client, channel as VoiceChannel, 'gong.mp3');
            }
        }
    }

    public override async executeButtonCommand(_client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'apply') {
            interaction.showModal(
                new GargoyleModalBuilder(this, 'application')
                    .setTitle('Entropy Gen.4 Application')
                    .setComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('steam')
                                .setLabel('Steam Account Link')
                                .setPlaceholder('https://steamcommunity.com/id/axodouble')
                                .setMinLength(30)
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('motivation')
                                .setLabel('What is your motivation to join?')
                                .setPlaceholder('Your motivation for joining Entropy Gen.4')
                                .setMinLength(10)
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('position')
                                .setLabel('Desired / Expected Position')
                                .setPlaceholder('Leadership / Volunteer / Officer')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('skills')
                                .setLabel('What are you good at?')
                                .setPlaceholder('Making propaganda, pvp, etc etc...')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('friends')
                                .setLabel('Do you have any friends in Entropy?')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false)
                        )
                    )
            );
        } else if (args[0] === 'recruit') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const inviteLink = await (interaction.channel as TextChannel)
                .createInvite({
                    maxAge: 1 * 60 * 60 * 24 * 7,
                    maxUses: 1,
                    unique: true,
                    reason: `Recruited by ${interaction.user.username}`
                })
                .catch((err) => {
                    interaction.editReply({ content: `Failed to create invite link\n\`\`\`${err as string}\`\`\`` });
                });
            client.users
                .fetch(args[1])
                .then((user) => {
                    user.send({ content: `You have been recruited to Entropy Gen.4, invite link: ${inviteLink}` })
                        .catch(() => {
                            interaction.editReply({ content: 'Failed to send DM to user' });
                        })
                        .then(async () => {
                            const message = await interaction.message.fetch();
                            message.edit({
                                components: [
                                    new ActionRowBuilder<GargoyleButtonBuilder>().addComponents(
                                        new GargoyleButtonBuilder(this, 'upvote')
                                            .setDisabled(true)
                                            .setLabel(`${message.reactions.cache.get('👍')?.count.toString() || 69}`)
                                            .setStyle(ButtonStyle.Success),
                                        new GargoyleButtonBuilder(this, 'recruit', args[1])
                                            .setLabel(`Recruited by ${interaction.user.username}`)
                                            .setStyle(ButtonStyle.Success),
                                        new GargoyleButtonBuilder(this, 'downvote')
                                            .setDisabled(true)
                                            .setLabel(`${message.reactions.cache.get('👎')?.count.toString() || 69}`)
                                            .setStyle(ButtonStyle.Danger)
                                    )
                                ]
                            });
                            interaction.editReply({ content: `User recruited, invite link: ${inviteLink}` });
                        });
                })
                .catch(() => {
                    interaction.editReply({ content: 'Failed to fetch user' });
                });
        } else if (args[0] === 'vouch') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            if (interaction.message.content.includes(`\nVouched by <@!${interaction.user.id}>`)) {
                await interaction.message.edit(interaction.message.content.replace(`\nVouched by <@!${interaction.user.id}>`, ''));
            } else {
                await interaction.message.edit({ content: `${interaction.message.content}\nVouched by <@!${interaction.user.id}>` });
            }
            interaction.editReply({ content: 'Adjusted your vouch for the user.' });
        } else if (args[0] === 'reject') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            client.users
                .fetch(args[1])
                .then((user) => {
                    user.send({ content: 'Your application to Entropy has been rejected, you may reapply if you feel necessary.' })
                        .catch(() => {
                            interaction.editReply({ content: 'Failed to send DM to user' });
                        })
                        .then(async () => {
                            const message = await interaction.message.fetch();
                            message.thread?.setArchived(true);
                            message.edit({
                                components: [
                                    new ActionRowBuilder<GargoyleButtonBuilder>().addComponents(
                                        new GargoyleButtonBuilder(this, 'upvote')
                                            .setDisabled(true)
                                            .setLabel(`${message.reactions.cache.get('👍')?.count.toString() || 69}`)
                                            .setStyle(ButtonStyle.Success),
                                        new GargoyleButtonBuilder(this, 'reject', args[1])
                                            .setLabel(`Denied by ${interaction.user.username}`)
                                            .setStyle(ButtonStyle.Danger)
                                            .setDisabled(true),
                                        new GargoyleButtonBuilder(this, 'downvote')
                                            .setDisabled(true)
                                            .setLabel(`${message.reactions.cache.get('👎')?.count.toString() || 69}`)
                                            .setStyle(ButtonStyle.Danger)
                                    )
                                ]
                            });
                            interaction.editReply({ content: 'User rejected.' });
                        });
                })
                .catch(() => {
                    interaction.editReply({ content: 'Failed to fetch user' });
                });
        }
    }

    public override executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        if (args[0] === 'application') {
            (client.channels.cache.get('1323518160678424647') as TextChannel)
                .send({
                    content: `New application by <@!${interaction.user.id}>`,
                    embeds: [
                        new GargoyleEmbedBuilder()
                            .setThumbnail(interaction.user.avatarURL())
                            .setTitle(`Application by ${interaction.user.username}`)
                            .setDescription(
                                `**Steam Account Link:** ${interaction.fields.getTextInputValue('steam') || ''}\n` +
                                    `**Motivation:** ${interaction.fields.getTextInputValue('motivation') || ''}\n` +
                                    `**Desired / Expected Position:** ${interaction.fields.getTextInputValue('position') || ''}\n` +
                                    `**Skills:** ${interaction.fields.getTextInputValue('skills') || ''}\n` +
                                    `**Friends in Entropy:** ${interaction.fields.getTextInputValue('friends') || ''}`
                            )
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new GargoyleButtonBuilder(this, 'recruit', interaction.user.id).setLabel('Recruit').setStyle(ButtonStyle.Success),
                            new GargoyleButtonBuilder(this, 'vouch').setLabel('Vouch').setStyle(ButtonStyle.Secondary),
                            new GargoyleButtonBuilder(this, 'reject', interaction.user.id).setLabel('Reject').setStyle(ButtonStyle.Danger)
                        )
                    ]
                })
                .then((message) => {
                    message.react('👍');
                    message.react('👎');
                    message.startThread({
                        name: `Discussion of ${interaction.user.username}`,
                        autoArchiveDuration: 60,
                        reason: 'Application thread'
                    });
                    interaction.reply({ content: 'Application submitted, you will hear back from us.', flags: MessageFlags.Ephemeral });
                });
        }
    }

    private async getVoiceActivity(guildMembers: GuildMember[]): Promise<RankedVoiceMember[]> {
        const guildMembersVoiceActivity: RankedVoiceMember[] = [];

        for (const guildMember of guildMembers.values()) {
            if (guildMember.user.bot) continue;
            const userVoiceActivity = await getUserVoiceActivity(guildMember.id, guildMember.guild.id, 7 * 24 * 60);
            const user = new RankedVoiceMember(guildMember, userVoiceActivity);
            guildMembersVoiceActivity.push(user);
        }

        return guildMembersVoiceActivity.sort((a, b) => b.activity - a.activity);
    }

    private async setMemberRoles(members: RankedVoiceMember[]): Promise<void> {
        // Sort members by activity in descending order (highest activity first)
        const sortedMembers = members.sort((a, b) => b.activity - a.activity);

        const totalMembers = sortedMembers.length;

        for (const [index, rankedMember] of sortedMembers.entries()) {
            const member = rankedMember.guildMember;

            // Calculate the percentile rank
            const percentileRank = (index / totalMembers) * 100;

            // Determine the role level based on percentile rank
            let roleLevel: number;
            if (rankedMember.activity === 0) {
                roleLevel = 0; // Assign level 0 for members with no activity
            } else if (percentileRank <= 2.5) {
                roleLevel = 9;
            } else if (percentileRank <= 5) {
                roleLevel = 8;
            } else if (percentileRank <= 10) {
                roleLevel = 7;
            } else if (percentileRank <= 20) {
                roleLevel = 6;
            } else if (percentileRank <= 35) {
                roleLevel = 5;
            } else if (percentileRank <= 55) {
                roleLevel = 4;
            } else if (percentileRank <= 75) {
                roleLevel = 3;
            } else if (percentileRank <= 80) {
                roleLevel = 2;
            } else {
                roleLevel = 1; // Least active
            }

            // Find the corresponding role
            const role = member.guild.roles.cache.find((role) => role.name.startsWith(`${roleLevel}`) && role.name.endsWith('Activity'));
            if (!role) continue;

            // Assign role if the member doesn't already have it
            if (!member.roles.cache.has(role.id)) {
                await this.removeMemberActivityRoles(member);
                await member.roles.add(role);
            }
        }
    }

    private async removeMemberActivityRoles(member: GuildMember): Promise<void> {
        for (const role of member.roles.cache.values()) {
            if (role.name.match(/^\d/) && role.name.endsWith('Activity')) {
                await member.roles.remove(role);
            }
        }
    }

    public override events = [new RolePrefix(), new LeaveLog()];
}

class RolePrefix extends GargoyleEvent {
    public event = Events.GuildMemberUpdate as const;
    private lastChanged = new Map<string, number>();

    public async execute(_client: GargoyleClient, member: GuildMember): Promise<void> {
        if (member.guild.id !== '1009048008857493624') return;

        if (this.lastChanged.has(member.id) && Date.now() - this.lastChanged.get(member.id)! < 10000) return;

        const updatedMember = await member.fetch(true);
        let namePrefix = '[';

        const roles = updatedMember.roles.cache.sort((a, b) => b.position - a.position);

        roles.forEach((role) => {
            if (role.name === '@everyone') return;
            // If role starts with a single letter and then a space
            if (role.name.match(/^[a-zA-Z0-9] /)) namePrefix += role.name.split('')[0].toUpperCase();
        });

        let username = updatedMember.nickname?.split(' ').slice(1).join(' ') || updatedMember.user.username;
        if (updatedMember.user.id === '287497254330302464') username = 'NutZak';
        if (updatedMember.user.id === '688098242067562601') username = 'Pixllty';
        if (updatedMember.user.id === '726753052157018162') username = 'lmascrub';
        if (updatedMember.user.id === '522098971426947072') username = 'Juɱpy';
        if (updatedMember.user.id === '503158802003132416') username = 'Eĸstacy';
        if (updatedMember.user.id === '891612809123741716') username = 'GIⅰde';

        namePrefix += `] ${username}`;

        updatedMember.setNickname(namePrefix).catch(() => {});
    }
}

class LeaveLog extends GargoyleEvent {
    public event = Events.GuildMemberRemove as const;

    public execute(_client: GargoyleClient, member: GuildMember): void {
        if (member.guild.id !== '1009048008857493624') return;

        const channel = member.guild.systemChannel as TextChannel;
        if (!channel) return;

        channel.send({ embeds: [new GargoyleEmbedBuilder().setDescription(`User ${member.user.tag} (<@!${member.user.id}>) has left the server.`)] });
    }
}

class RankedVoiceMember {
    public guildMember: GuildMember;
    public activity: number;

    constructor(guildMember: GuildMember, activity: number) {
        this.guildMember = guildMember;
        this.activity = activity;
    }
}
