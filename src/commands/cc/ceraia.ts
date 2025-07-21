import GargoyleButtonBuilder, { GargoyleURLButtonBuilder } from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import { GargoyleStringSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import client from '@src/system/botClient.js';
import { CanvasGradient, CanvasPattern, createCanvas, Image } from 'canvas';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    AttachmentBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ContainerBuilder,
    Events,
    Guild,
    GuildMember,
    InteractionContextType,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageActionRowComponentBuilder,
    MessageCreateOptions,
    MessageEditOptions,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    SectionBuilder,
    TextChannel,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
    ThreadChannel,
    ThumbnailBuilder,
    User
} from 'discord.js';
import { model, Schema } from 'mongoose';

const ceraiaGuild = '1394893354763817040'; // Ceraia guild ID

export default class Ceraia extends GargoyleCommand {
    public override category: string = 'ceraia';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('management')
            .setDescription('Ceraia management commands')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addGuild(ceraiaGuild)
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('freelancer')
                    .setDescription('Change freelancer status of a user')
                    .addUserOption((option) => option.setName('user').setDescription('The user to change freelancer status of'))
            )
            .addSubcommand((subcommand) =>
                subcommand.setName('welcome').setDescription('Send an example welcome message')
            ) as GargoyleSlashCommandBuilder,

        new GargoyleSlashCommandBuilder()
            .setName('ceraia')
            .setDescription('Ceraia commands')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addGuild(ceraiaGuild)
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('stripe')
                    .setDescription('Stripe related commands')
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('payment')
                            .setDescription('Create a payment link for Ceraia Stripe')
                            .addNumberOption((option) =>
                                option.setName('amount').setDescription('The amount to charge').setRequired(true).setMinValue(1).setMaxValue(1000)
                            )
                    )
            )
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('panel')
                    .setDescription('Panel related commands')
                    .addSubcommand((subcommand) => subcommand.setName('send').setDescription('Send a panel for Ceraia'))
            )
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('profile')
                    .setDescription('Profile related commands')
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('view')
                            .setDescription('View a user profile')
                            .addUserOption((option) => option.setName('user').setDescription('The user to view profile of'))
                    )
                    .addSubcommand((subcommand) => subcommand.setName('biography').setDescription('Set or view your biography'))
            )
            .addSubcommandGroup((subcommandGroup) =>
                subcommandGroup
                    .setName('banner')
                    .setDescription('Banner related commands')
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('underline')
                            .setDescription('Create an underline banner')
                            .addStringOption((option) => option.setName('text').setDescription('The text to display on the banner').setRequired(true))
                            .addIntegerOption((option) =>
                                option.setName('height').setDescription('The height of the banner (default: 56)').setRequired(false)
                            )
                            .addIntegerOption((option) =>
                                option.setName('width').setDescription('The width of the banner (default: 1080)').setRequired(false)
                            )
                            .addIntegerOption((option) =>
                                option.setName('font_size').setDescription('The font size of the text (default: 48)').setRequired(false)
                            )
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('slash')
                            .setDescription('Create a slash banner')
                            .addStringOption((option) => option.setName('text').setDescription('The text to display on the banner').setRequired(true))
                            .addIntegerOption((option) =>
                                option.setName('height').setDescription('The height of the banner (default: 56)').setRequired(false)
                            )
                            .addIntegerOption((option) =>
                                option.setName('width').setDescription('The width of the banner (default: 1080)').setRequired(false)
                            )
                            .addIntegerOption((option) =>
                                option.setName('font_size').setDescription('The font size of the text (default: 48)').setRequired(false)
                            )
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('filled')
                            .setDescription('Create a filled banner')
                            .addStringOption((option) => option.setName('text').setDescription('The text to display on the banner').setRequired(true))
                            .addIntegerOption((option) =>
                                option.setName('height').setDescription('The height of the banner (default: 56)').setRequired(false)
                            )
                            .addIntegerOption((option) =>
                                option.setName('width').setDescription('The width of the banner (default: 1080)').setRequired(false)
                            )
                            .addIntegerOption((option) =>
                                option.setName('font_size').setDescription('The font size of the text (default: 48)').setRequired(false)
                            )
                    )
            )
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.commandName === 'management') {
            if (interaction.options.getSubcommand() === 'freelancer') {
                const user = interaction.options.getUser('user');
                if (!user) {
                    return interaction.reply({ content: 'You must specify a user to change freelancer status.', flags: MessageFlags.Ephemeral });
                }

                const commissionaryUser = await getCommissionaryUser(user.id);
                if (!commissionaryUser) {
                    return interaction.reply({ content: "We couldn't fetch the user profile", flags: MessageFlags.Ephemeral });
                }

                commissionaryUser.freelancer = !commissionaryUser.freelancer;
                await commissionaryUser.save();

                await interaction.reply({
                    content: `Freelancer status for ${user.tag} has been set to ${commissionaryUser.freelancer ? 'enabled' : 'disabled'}.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            } else if (interaction.options.getSubcommand() === 'welcome') {
                await (interaction.channel as TextChannel).send(await generateWelcomeMessage(interaction.member as GuildMember));
                return;
            }
            return;
        } else if (interaction.commandName === 'ceraia') {
            if (interaction.options.getSubcommandGroup() === 'panel') {
                if (interaction.options.getSubcommand() === 'send') {
                    if (!interaction.guild) {
                        return interaction.reply({ content: 'This command can only be used in a guild.', flags: MessageFlags.Ephemeral });
                    }
                    await interaction.reply({ content: 'Sending the Ceraia panel...', flags: MessageFlags.Ephemeral });

                    (interaction.channel as TextChannel).send((await this.panelMessage(interaction.guild)) as MessageCreateOptions).catch((error) => {
                        client.logger.error(`Failed to send the Ceraia panel: ${error.stack}`);
                    });
                }
                return;
            } else if (interaction.options.getSubcommandGroup() === 'profile') {
                if (interaction.options.getSubcommand() === 'view') {
                    await interaction.deferReply({});
                    const user = interaction.options.getUser('user') || interaction.user;
                    const member = await interaction.guild?.members.fetch(user.id);
                    if (!member) {
                        await interaction.editReply({ content: "We couldn't fetch the user profile" });
                        return;
                    }

                    await interaction.editReply((await this.generateProfileMessage(member)) as MessageEditOptions);
                    return;
                } else if (interaction.options.getSubcommand() === 'biography') {
                    const commissionaryUser = await getCommissionaryUser(interaction.user.id);
                    if (!commissionaryUser) {
                        await interaction.reply({ content: "We couldn't fetch the user profile" });
                        return;
                    }

                    await interaction.showModal(
                        new GargoyleModalBuilder(this, 'biography')
                            .setTitle('Set your biography')
                            .setComponents(
                                new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                                    new TextInputBuilder()
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setCustomId('biography')
                                        .setLabel('Biography')
                                        .setRequired(true)
                                        .setMaxLength(500)
                                        .setPlaceholder('Tell us about yourself...')
                                        .setMinLength(8)
                                        .setValue(commissionaryUser.biography)
                                )
                            )
                    );
                }
            } else if (interaction.options.getSubcommandGroup() === 'banner') {
                const text = interaction.options.getString('text', true);
                const height = interaction.options.getInteger('height') || 56;
                const width = interaction.options.getInteger('width') || 1080;
                const fontSize = interaction.options.getInteger('font_size') || 48;

                let attachment: AttachmentBuilder;

                if (interaction.options.getSubcommand() === 'underline') {
                    attachment = await createUnderlineBanner(text, '#0fad9a', height, width, fontSize);
                } else if (interaction.options.getSubcommand() === 'slash') {
                    attachment = await createSlashBanner(text, '#0fad9a', height, width, fontSize);
                } else if (interaction.options.getSubcommand() === 'filled') {
                    attachment = await createFilledBanner(text, '#0fad9a', height, width, fontSize);
                } else {
                    return;
                }

                await interaction.reply({ files: [attachment] });
                return;
            } else {
                interaction.reply({ content: 'Invalid subcommand or subcommand group.', flags: MessageFlags.Ephemeral });
                return;
            }
            return;
        }
        return;
    }

    public override async executeModalCommand(_client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'biography') {
            const biography = interaction.fields.getTextInputValue('biography');
            const user = await getCommissionaryUser(interaction.user.id);

            if (!user) {
                await interaction.reply({ content: "We couldn't fetch your profile", flags: MessageFlags.Ephemeral });
                return;
            }
            user.biography = biography;
            await user.save();
            await interaction.reply({ content: 'Your biography has been updated successfully!', flags: MessageFlags.Ephemeral });
            return;
        } else if (args[0] === 'commission') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const guild = await interaction.guild!.fetch();
            const member = await (interaction.member as GuildMember).fetch();

            if (!guild || !member) {
                await interaction.editReply({
                    content: 'This command can only be used in a guild.'
                });
                return;
            }

            const categoryRole = guild.roles.cache.get(args[1]);
            if (!categoryRole) {
                await interaction.editReply({
                    content: 'Sorry, this category either no longer exists or cannot be selected'
                });
                return;
            }

            const commissionaryUser = await getCommissionaryUser(interaction.user.id);
            if (!commissionaryUser) {
                await interaction.editReply({ content: "We couldn't fetch your profile" });
                return;
            }

            const commissionsChannel = guild.channels.cache.find((c) => c.name.includes('commissions') && c.type === ChannelType.GuildText) as
                | TextChannel
                | undefined;

            if (!commissionsChannel) {
                await interaction.editReply({
                    content: 'Commissions channel not found. Please contact an administrator.'
                });
                return;
            }

            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const date = interaction.fields.getTextInputValue('date');
            const price = interaction.fields.getTextInputValue('price');
            const extra: string | undefined = interaction.fields.getTextInputValue('extra');

            const thread = await (interaction.channel as TextChannel).threads.create({
                name: title,
                autoArchiveDuration: 60,
                reason: 'New commission thread',
                type: ChannelType.PrivateThread,
                invitable: true
            });

            thread.members.add(interaction.user.id).catch((error) => {
                client.logger.error(`Failed to add user to thread: ${error.stack}`);
            });

            const commissionId = `${Date.now()}`;
            // await createCommissionaryCommission({
            //     ownerId: interaction.user.id,
            //     threadId: thread.id,
            //     commissionId: commissionId,
            //     commissionCategory: categoryRole.name.replace('Category - ', ''),
            //     commissionTitle: title,
            //     commissionDescription: description,
            //     commissionPrice: price
            // });

            commissionaryUser.commissions.push(commissionId);
            await commissionaryUser.save();

            await commissionsChannel.send({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0x1fad9a)
                        .addMediaGalleryComponents(
                            new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://commissions.png'))
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `\n-# This is a commission created by <@!${interaction.user.id}>, for <@&${categoryRole.id}>` +
                                    `\n**Price:** ${price}` +
                                    `\n**Deadline:** ${date}` +
                                    `\n## ${title}, ` +
                                    `\n > ${description.replaceAll('\n', '\n> ')}` +
                                    (extra ? `\n-# Extra Info: ${extra}` : '')
                            )
                        )
                        .addActionRowComponents(
                            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                                new GargoyleButtonBuilder(this, 'offer', thread.id)
                                    .setLabel('Offer to do Commission')
                                    .setEmoji('💰')
                                    .setStyle(ButtonStyle.Success),
                                new GargoyleButtonBuilder(this, 'negotiate', thread.id)
                                    .setLabel('Negotiate Commission')
                                    .setEmoji('🤝')
                                    .setStyle(ButtonStyle.Secondary),
                                new GargoyleButtonBuilder(this, 'viewprofile', interaction.user.id)
                                    .setLabel('View Profile')
                                    .setEmoji('👤')
                                    .setStyle(ButtonStyle.Secondary)
                            )
                        )
                ],
                flags: [MessageFlags.IsComponentsV2],
                files: [await createSlashBanner(`New Commission by ${member.displayName}`, '#0fad9a', 112, 1080, 40, 'commissions')]
            });

            await interaction.editReply({
                content: `Your commission has been created successfully! Commission ID: ${commissionId}`
            });
        }
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'viewprofile') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const member = await interaction.guild?.members.fetch(args[1]);
            if (!member) {
                await interaction.editReply({ content: "We couldn't fetch the user profile" });
                return;
            }

            await interaction.editReply((await this.generateProfileMessage(member)) as MessageEditOptions);
            return;
        }
    }

    public override async executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): Promise<void> {
        client.logger.trace(`Select menu interaction: ${interaction.customId} with args: ${args.join(', ')}`);
        if (args[0] === 'commissioncategory') {
            const categoryId = interaction.values[0];
            const guild = await interaction.guild!.fetch();

            const categoryRole = guild.roles.cache.get(categoryId);
            if (!categoryRole) {
                await interaction.reply({
                    content: 'Sorry, this category either no longer exists or cannot be selected',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            await interaction.showModal(
                new GargoyleModalBuilder(this, 'commission', interaction.values[0])
                    .setTitle(categoryRole.name.replace('Category - ', '') + ' Commission')
                    .setComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId('title')
                                .setLabel('What should be the title?')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                                .setPlaceholder('Describe the commission you want to make')
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId('description')
                                .setLabel('Commission Description (Detailed)')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                                .setPlaceholder('Describe the commission you want to make in detail')
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId('date')
                                .setLabel('When does it need to be done?')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                                .setPlaceholder('As soon as possible, within a week, etc.')
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId('price')
                                .setLabel('How much are you willing to pay?')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                                .setPlaceholder('How much are you willing to pay for this commission? (in USD)')
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId('extra')
                                .setLabel("Is there anything else you'd like to add?")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false)
                                .setPlaceholder('Only available to respond on weekdays, lactose tolerant, etc.')
                        )
                    )
            );
        }
    }

    private async panelMessage(guild: Guild) {
        return {
            components: [
                new ContainerBuilder()
                    .setAccentColor(0x1fad9a)
                    .addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://commissions.png'))
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            '-# Make commissions easy, safe and reliable.' +
                                '\nBe sure to read our Terms of Service to grasp a better understanding of our commission process.'
                        )
                    )
                    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://support.png')))
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '## Support ' +
                                        '\nDo you have any questions? Is something not working as expected? Is there anything else we can help you with?' +
                                        '\nFeel free to open a support ticket, and we will help you as soon as possible.'
                                )
                            )
                            .setButtonAccessory(
                                new GargoyleButtonBuilder(this, 'support').setLabel('Support').setEmoji('🆘').setStyle(ButtonStyle.Secondary)
                            )
                    )
                    .addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://join_the_team.png'))
                    )
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '## Become a freelancer ' +
                                        '\nWant to become a freelancer?' +
                                        '\nFeel free to apply for a position in our freelancer team!'
                                )
                            )
                            .setButtonAccessory(
                                new GargoyleButtonBuilder(this, 'freelancer').setLabel('Apply').setEmoji('📋').setStyle(ButtonStyle.Secondary)
                            )
                    )
                    .addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://commission_a_freelancer.png'))
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('## Commission a freelancer ' + '\nFeel free to choose a category for your commission.')
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                            new GargoyleStringSelectMenuBuilder(this, 'commissioncategory')
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setPlaceholder('Select a category')
                                .setOptions(
                                    guild.roles.cache
                                        .filter((role) => role.name.startsWith('Category - '))
                                        .sort((a, b) => b.position - a.position)
                                        .map((role) => ({
                                            label: role.name.replace('Category - ', ''),
                                            value: role.id
                                        }))
                                )
                        )
                    )
            ],
            flags: [MessageFlags.IsComponentsV2],
            files: [
                await createSlashBanner('Commissions', '#0fad9a', 112, 1080, 64),
                await createUnderlineBanner('Support', '#0fad9a'),
                await createUnderlineBanner('Join the Team', '#0fad9a'),
                await createUnderlineBanner('Commission a Freelancer', '#0fad9a')
            ]
        };
    }

    private async generateProfileMessage(member: GuildMember): Promise<MessageCreateOptions> {
        const commissionaryUser = await getCommissionaryUser(member.id);
        if (!commissionaryUser) {
            return { content: "We couldn't fetch the user profile" };
        }

        const container = new ContainerBuilder().setAccentColor(0x1fad9a);

        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://profile_banner.png'))
        );

        const userRating = getAverageRating(commissionaryUser.ratings);

        const section = new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `\n**Freelancer:** ${commissionaryUser.freelancer ? 'Yes.' : 'No.'}` +
                        `\n**Biography:** \n> ${commissionaryUser.biography.split('\n').join('\n> ')}` +
                        `\n**Commissions:** ${commissionaryUser.commissions.length == 0 ? 'No commissions yet.' : commissionaryUser.commissions.length}` +
                        (commissionaryUser.freelancer ? `\n**Price Range:** ${commissionaryUser.freelancerPrice}` : '')
                )
            )
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(member.displayAvatarURL()));

        const profileBanner = await createProfileBanner(
            member.user,
            commissionaryUser.freelancer ? commissionaryUser.freelancerPrice : '',
            `${userRating.toFixed(1)} (${commissionaryUser.ratings.length})`,
            1080,
            256
        );

        if (commissionaryUser.freelancer && commissionaryUser.showcase) {
            section.setButtonAccessory(new GargoyleURLButtonBuilder(commissionaryUser.showcase).setLabel('View Showcase').setEmoji('📸'));
        } else
            section.setButtonAccessory(
                new GargoyleButtonBuilder(this).setStyle(ButtonStyle.Danger).setLabel('No Showcase').setEmoji('📸').setDisabled(true)
            );

        return {
            components: [container.addSectionComponents(section)],
            flags: MessageFlags.IsComponentsV2,
            files: [profileBanner]
        };
    }

    public override events: GargoyleEvent[] = [new FreelancerShowcase(), new SpecializedWelcome()];
}

async function createUnderlineBanner(
    text: string,
    fillStyle: string | CanvasGradient | CanvasPattern,
    height: number = 56,
    width: number = 1080,
    fontSize: number = 48
): Promise<AttachmentBuilder> {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Make underline
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, height - 3, width, height);

    // Set text properties
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text
    ctx.fillText(text, width / 2, height / 2);

    // Create an attachment from the canvas
    return new AttachmentBuilder(canvas.toBuffer(), { name: `${text.toLowerCase().split(' ').join('_')}.png` });
}

async function createFilledBanner(
    text: string,
    fillStyle: string | CanvasGradient | CanvasPattern,
    height: number = 56,
    width: number = 1080,
    fontSize: number = 48
): Promise<AttachmentBuilder> {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Set background color
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, width, height);

    // Set text properties
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text
    ctx.fillText(text, width / 2, height / 2);

    // Create an attachment from the canvas
    return new AttachmentBuilder(canvas.toBuffer(), { name: `${text.toLowerCase().split(' ').join('_')}.png` });
}

async function createSlashBanner(
    text: string,
    fillStyle: string | CanvasGradient | CanvasPattern,
    height: number = 56,
    width: number = 1080,
    fontSize: number = 48,
    name?: string
): Promise<AttachmentBuilder> {
    const canvas = createCanvas(1080, height);
    const ctx = canvas.getContext('2d');

    // Make slash shape on the left
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width / 20, 0);
    ctx.lineTo(width / 20 + height / Math.tan(Math.PI / 2.5), height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Make underline
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, height - 4, width, height);

    // Set text properties
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text
    ctx.fillText(text, width / 2, height / 2);

    // Create an attachment from the canvas
    return new AttachmentBuilder(canvas.toBuffer(), { name: name ? `${name}.png` : `${text.toLowerCase().split(' ').join('_')}.png` });
}

async function createProfileBanner(user: User, price: string, rating: string = 'No Rating', width = 1080, height = 256) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Make slash shape on the left
    ctx.fillStyle = 'rgba(15, 173, 154, 1)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width / 10, 0);
    ctx.lineTo(width / 10 + height / Math.tan(Math.PI / 2.5), height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Set text properties
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Add user name
    ctx.fillText(user.displayName, 25, 64);

    // Add user price range
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(price, width - 25, 64);

    // Add user rating
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(rating, 25, height - 32);

    // Add user avatar
    const avatar = user.displayAvatarURL({ size: 256, extension: 'png' });
    const img = new Image();

    // Wait for image to load before drawing
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = avatar;
    });

    // Draw the avatar on the right side of the banner with rounded corners
    ctx.save();
    ctx.beginPath();
    ctx.arc(width - 64, height - 64, 64, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, width - 128, height - 128, 128, 128);
    ctx.restore();

    // Create an attachment from the canvas
    return new AttachmentBuilder(canvas.toBuffer(), { name: `profile_banner.png` });
}

class FreelancerShowcase extends GargoyleEvent {
    public event = Events.ThreadCreate as const;

    public async execute(_client: GargoyleClient, thread: ThreadChannel): Promise<void> {
        if (thread.parent?.type !== ChannelType.GuildForum) return;
        if (thread.guildId !== ceraiaGuild) return;

        const owner = await thread.fetchOwner();

        const parent = await thread.parent?.fetch();
        if (!parent || parent.type !== ChannelType.GuildForum) return;

        const parentThreads = await parent.threads.fetch();

        if (!owner) return;
        const commissionaryOwner = await getCommissionaryUser(owner.id);

        if (!commissionaryOwner) return;

        if (commissionaryOwner.freelancer) {
            parentThreads.threads.forEach((t) => {
                if (t.id !== thread.id && t.ownerId === owner.id) {
                    t.setArchived(true, `Thread closed due to new thread created by the same user <#${thread.id}>`);
                }
            });

            commissionaryOwner.showcase = `https://discord.com/channels/${thread.guildId}/${thread.id}`;
            await commissionaryOwner.save();
        }
    }
}

async function generateWelcomeMessage(member: GuildMember): Promise<MessageCreateOptions> {
    const width = 1080;
    const height = 256;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Make slash shape on the left
    ctx.fillStyle = 'rgba(15, 173, 154, 1)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width / 10, 0);
    ctx.lineTo(width / 10 + height / Math.tan(Math.PI / 2.5), height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Add welcome text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Welcome to ${member.guild.name},\n${member.displayName}!`, 20, 20);

    // Add user avatar
    const avatar = member.user.displayAvatarURL({ size: 256, extension: 'png' });
    const img = new Image();

    // Wait for image to load before drawing
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = avatar;
    });

    // Add circular avatar on the bottom right corner
    ctx.save();
    ctx.beginPath();
    ctx.arc(width - 64, height - 64, 64, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, width - 128, height - 128, 128, 128);
    ctx.restore();

    // Create an attachment from the canvas
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome_banner.png' });

    // Get the commissionary user (used to make sure the user is registered in the database too)
    await getCommissionaryUser(member.id);

    return {
        components: [
            new ContainerBuilder()
                .setAccentColor(0x1fad9a)
                .addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://welcome_banner.png'))
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `Welcome to **${member.guild.name}**, <@!${member.id}>!` +
                            '\nWe are glad to have you here! Please make sure to read the rules and enjoy your stay!'
                    )
                )
        ],
        files: [attachment],
        flags: [MessageFlags.IsComponentsV2]
    };
}

class SpecializedWelcome extends GargoyleEvent {
    public event = Events.GuildMemberAdd as const;

    public async execute(client: GargoyleClient, member: GuildMember): Promise<void> {
        member = await member.fetch();

        if (member.guild.id !== ceraiaGuild) return;
        client.logger.trace('Member is from Ceraia');

        const channel = member.guild.channels.cache.find((c) => c.name.includes('welcome') && c.type === ChannelType.GuildText) as
            | TextChannel
            | undefined;
        if (!channel) return;

        await channel.send(await generateWelcomeMessage(member));
    }
}

const commissionaryUserSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    freelancer: {
        type: Boolean,
        default: false,
        required: true
    },
    freelancerPrice: {
        type: String,
        default: '$$',
        required: true
    },
    showcase: {
        type: String,
        default: null
    },
    ratings: [
        {
            raterId: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                default: ''
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    biography: {
        type: String,
        default: 'Hello there!'
    },
    commissions: {
        type: [String],
        default: []
    }
});

const commissionaryCommissionSchema = new Schema({
    ownerId: String,
    members: {
        type: [String],
        default: []
    },
    commissionId: {
        type: String,
        required: true,
        unique: true
    },
    commissionThreadId: String,
    commissionCategory: String,
    commissionSubcategory: String,
    commissionTitle: String,
    commissionDescription: String,
    commissionPrice: String
});

const databaseCommissionaryUser = model('CommissionaryUsers', commissionaryUserSchema);
const databaseCommissionaryCommission = model('CommissionaryCommissions', commissionaryCommissionSchema);

async function getCommissionaryUser(userId: string) {
    try {
        const user = await databaseCommissionaryUser.findOne({ userId }).exec();
        if (!user) {
            return await createCommissionaryUser(userId);
        } else return user;
    } catch (error) {
        client.logger.error(`Error trying to get commissionaryUser ${error}`);
        return null;
    }
}

function getAverageRating(ratings: { rating: number }[]) {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, r) => sum + r.rating, 0);
    return total / ratings.length;
}

async function getCommissionaryCommission(commissionId: string) {
    return await databaseCommissionaryCommission.findOne({ commissionId }).exec();
}

async function createCommissionaryUser(userId: string) {
    const user = new databaseCommissionaryUser({ userId });
    return await user.save();
}

async function createCommissionaryCommission(commissionData: {
    ownerId: string;
    commissionId: string;
    threadId: string;
    commissionCategory: string;
    commissionTitle: string;
    commissionDescription: string;
    commissionPrice: string;
}) {
    const commission = new databaseCommissionaryCommission(commissionData);
    return await commission.save();
}
