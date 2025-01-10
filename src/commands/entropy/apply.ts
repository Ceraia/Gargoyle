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
            interaction.reply(`Calculating all VC statistics for past 7 days for ${interaction.guild.memberCount}`);
            this.setMemberRoles(await this.getGuildVoiceActivity(interaction.guild));
            interaction.editReply('Finished calculating all VC statistics for past 7 days, roles applied.');
        }
    }

    public override async executeTextCommand(client: GargoyleClient, message: Message): Promise<void> {
        if (message.author.username !== 'Axodouble') return;
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
            const inviteLink = await (interaction.channel as TextChannel)
                .createInvite({
                    temporary: true,
                    maxAge: 1 * 60 * 60 * 24 * 7,
                    maxUses: 1,
                    unique: true,
                    reason: `Recruited by ${interaction.user.username}`
                })
                .catch((err) => {
                    interaction.reply({ content: `Failed to create invite link\n\`\`\`${err as string}\`\`\``, flags: MessageFlags.Ephemeral });
                });
            interaction.reply({ content: `User recruited, invite link: ${inviteLink}`, flags: MessageFlags.Ephemeral });
        }
    }

    public override executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        if (args[0] === 'application') {
            (client.channels.cache.get('1323518160678424647') as TextChannel)
                .send({
                    content: `New application by ${interaction.user.username}`,
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
                            new GargoyleButtonBuilder(this, 'recruit', interaction.user.id).setLabel('Recruit').setStyle(ButtonStyle.Secondary)
                        )
                    ]
                })
                .then(() => {
                    interaction.reply({ content: 'Application submitted, you will hear back from us.', flags: MessageFlags.Ephemeral });
                });
        }
    }

    private async getGuildVoiceActivity(guild: Guild): Promise<RankedGuildMember[]> {
        const guildMembers = await guild.members.fetch();
        const guildMembersVoiceActivity: RankedGuildMember[] = [];

        guildMembers.forEach(async (guildMember) => {
            guildMembersVoiceActivity.push(new RankedGuildMember(guildMember, await getUserVoiceActivity(guildMember.id, guild.id, 7 * 24 * 60)));
        });

        return guildMembersVoiceActivity.sort((a, b) => a.activity - b.activity);
    }

    private setMemberRoles(members: RankedGuildMember[]): void {
        let i = 0;
        let j = 0;

        members.forEach(async (rankedMember) => {
            const member = rankedMember.guildMember;
            const role = member.guild.roles.cache.find((role) => {
                return role.name.startsWith(`${j}`);
            });
            if (!role) return;
            await member.roles.add(role);
            i++;
            if (i > j) {
                i = 0;
                j++;
            }
        });
    }

    public override events = [new RolePrefix()];
}

class RolePrefix extends GargoyleEvent {
    public event = Events.GuildMemberUpdate as const;

    public async execute(client: GargoyleClient, member: GuildMember): Promise<void> {
        if (member.guild.id !== '1009048008857493624') return;

        client.logger.debug(`Updating nickname for ${member.user.tag}`);

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

class RankedGuildMember {
    public guildMember: GuildMember;
    public activity: number;

    constructor(guildMember: GuildMember, activity: number) {
        this.guildMember = guildMember;
        this.activity = activity;
    }
}
