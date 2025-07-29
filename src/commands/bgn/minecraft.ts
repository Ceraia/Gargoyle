import { GargoyleURLButtonBuilder } from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import { GargoyleStringSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleTextCommandBuilder from '@src/system/backend/builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import { createBanner, FontWeight } from '@src/system/backend/tools/banners.js';
import { createCanvas } from 'canvas';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    AttachmentBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    InteractionEditReplyOptions,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    Message,
    MessageActionRowComponentBuilder,
    MessageFlags,
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
            .addSubcommand((subcommand) => subcommand.setName('vote').setDescription('Make a new vote'))
            .addSubcommand((subcommand) =>
                subcommand.setName('clearnicks').setDescription('Clears all nicknames in the guild')
            ) as GargoyleSlashCommandBuilder
    ];

    public override textCommands: GargoyleTextCommandBuilder[] = [
        new GargoyleTextCommandBuilder().setName('bgnmc').setDescription('BGN\s Minecraft advertisement banner command')
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'minecraft') {
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
            } else if (interaction.options.getSubcommand() === 'vote') {
                interaction.showModal(
                    new GargoyleModalBuilder(this, 'vote')
                        .setTitle('Create a vote')
                        .addComponents(
                            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                new TextInputBuilder().setCustomId('title').setLabel('Vote Title').setStyle(TextInputStyle.Short).setRequired(true)
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
                            ),
                            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('time')
                                    .setLabel('Vote Duration (in hours)')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        )
                );
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

            (message.channel as TextChannel).send({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0x00d2ff)
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
                        .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://info.png`)))
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
            });
        }
    }

    public override async executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'vote') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const options = interaction.fields
                .getTextInputValue('options')
                .split(';')
                .map((option) => option.trim());
            const duration = parseInt(interaction.fields.getTextInputValue('time'), 10);

            const message = await (interaction.channel as TextChannel).send({
                components: [
                    new ContainerBuilder().setAccentColor(0x00d2ff).addTextDisplayComponents(new TextDisplayBuilder().setContent('One moment...'))
                ],
                flags: MessageFlags.IsComponentsV2
            });

            const endDate = new Date(Date.now() + duration * 60 * 60 * 1000);
            const voteData = {
                ownerId: interaction.user.id,
                title: title,
                description: description,
                options: options,
                channelId: interaction.channelId,
                messageId: message.id,
                votes: [],
                endDate
            };

            const newVote = new databaseMinecraftVote(voteData);
            await newVote.save();

            message.edit(await this.createMinecraftVoteMessage(client, message.id));

            await interaction.editReply('Vote created successfully!');
        }
    }

    public override async executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): Promise<void> {
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
        await interaction.update(updatedMessage);

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
    }

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
                    .setAccentColor(0x00d2ff)
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
}

enum BGNColors {
    Blue = '#00d2ff',
    Red = '#ff6b6b',
    Green = '#4ecdc4',
    Yellow = '#ffeaa7',
    Purple = '#dda0dd'
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
    Discord = '<:discord:1399301352798031912>'
}

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
    ],
    endDate: {
        type: Date,
        required: true
    }
});

const databaseMinecraftVote = model('MinecraftVotes', minecraftVoteSchema);
