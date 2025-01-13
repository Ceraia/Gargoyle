import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@builders/gargoyleEmbedBuilder.js';
import GargoyleModalBuilder from '@builders/gargoyleModalBuilder.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { sendAsServer } from '@src/system/backend/tools/server.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Events,
    Guild,
    GuildMember,
    InteractionContextType,
    Message,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    TextChannel,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import { getUserVoiceActivity } from '@src/events/voice/voiceActivity.js';
import GargoyleTextCommandBuilder from '@src/system/backend/builders/gargoyleTextCommandBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import client from '@src/system/botClient.js';

export default class Entropy extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('entropy')
            .setDescription('Entropy related commands')
            .addGuild('1009048008857493624')
            .addSubcommand((subcommand) => subcommand.setName('activity').setDescription('Calculate voice activity'))
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];
    public override textCommands = [
        new GargoyleTextCommandBuilder()
            .setName('entropy')
            .setDescription('Open an entropy application panel')
            .setContexts([InteractionContextType.Guild])
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'activity') {
            if (!interaction.guild) return;

            await interaction.reply({
                content: `Calculating all VC statistics for the past 7 days for ${interaction.guild.memberCount} members...`,
                flags: MessageFlags.Ephemeral
            });

            const rankedMembers = await this.getGuildVoiceActivity(interaction.guild);

            await this.setMemberRoles(rankedMembers);

            await interaction.editReply('Finished calculating all VC statistics for the past 7 days. Roles applied.');
        }
    }

    public override async executeTextCommand(client: GargoyleClient, message: Message): Promise<void> {
        if (message.author.username !== 'axodouble') return;
        await message.delete();
        const entropyGuild = client.guilds.cache.get('1009048008857493624');
        await sendAsServer(
            {
                embeds: [
                    new GargoyleEmbedBuilder().setTitle('Entropy Application').setDescription('Gen.4 Entropy. Apply now, you will be notified.')
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new GargoyleButtonBuilder(this, 'apply').setLabel('Apply').setStyle(ButtonStyle.Secondary)
                    )
                ]
            },
            message.channel as TextChannel,
            entropyGuild
        );
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

    private async getGuildVoiceActivity(guild: Guild): Promise<RankedGuildMember[]> {
        const guildMembers = await guild.members.fetch();
        const guildMembersVoiceActivity: RankedGuildMember[] = [];

        for (const guildMember of guildMembers.values()) {
            if (guildMember.user.bot) continue;
            const userVoiceActivity = await getUserVoiceActivity(guildMember.id, guild.id, 7 * 24 * 60);
            const user = new RankedGuildMember(guildMember, userVoiceActivity);
            guildMembersVoiceActivity.push(user);
        }

        return guildMembersVoiceActivity.sort((a, b) => b.activity - a.activity);
    }

    private async setMemberRoles(members: RankedGuildMember[]): Promise<void> {
        let i = 9;
        let j = 9;

        for (const rankedMember of members) {
            const member = rankedMember.guildMember;

            if (rankedMember.activity === 0) {
                const role = member.guild.roles.cache.find((role) => role.name.startsWith(`${0}`));
                if (!role) continue;
                if (!member.roles.cache.has(role.id)) {
                    await this.removeMemberActivityRoles(member);
                    await member.roles.add(role);
                }
                continue;
            }

            const currentRoleLevel = j;
            const role = member.guild.roles.cache.find((role) => role.name.startsWith(`${currentRoleLevel}`));
            if (!role) continue;

            if (!member.roles.cache.has(role.id)) {
                await this.removeMemberActivityRoles(member);
                await member.roles.add(role);
            }

            i--;
            if (i < j) {
                j--;
                i = 9;
            }
        }
    }

    private async removeMemberActivityRoles(member: GuildMember): Promise<void> {
        for (const role of member.roles.cache.values()) {
            if (role.name.match(/^\d/)) {
                await member.roles.remove(role);
            }
        }
    }

    public override events = [new RolePrefix(), new LeaveLog()];
}

class RolePrefix extends GargoyleEvent {
    public event = Events.GuildMemberUpdate as const;

    public async execute(_client: GargoyleClient, member: GuildMember): Promise<void> {
        if (member.guild.id !== '1009048008857493624') return;

        const updatedMember = await member.fetch(true);
        let namePrefix = '[';

        const roles = updatedMember.roles.cache.sort((a, b) => b.position - a.position);

        roles.forEach((role) => {
            if (role.name === '@everyone') return;
            namePrefix += role.name.split('')[0].toUpperCase();
        });

        namePrefix += `] ${updatedMember.nickname?.split(' ').slice(1).join(' ') || updatedMember.user.username}`;

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

class RankedGuildMember {
    public guildMember: GuildMember;
    public activity: number;

    constructor(guildMember: GuildMember, activity: number) {
        this.guildMember = guildMember;
        this.activity = activity;
    }
}
