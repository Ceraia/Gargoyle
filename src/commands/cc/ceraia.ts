import { GargoyleURLButtonBuilder } from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import client from '@src/system/botClient.js';
import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    InteractionContextType,
    MessageCreateOptions,
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

export default class Ceraia extends GargoyleCommand {
    public override category: string = 'ceraia';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('ceraia')
            .setDescription('Ceraia commands')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addGuild('1394893354763817040') // Ceraia guild ID
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
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommandGroup() === 'panel') {
            if (interaction.options.getSubcommand() === 'send') {
                await interaction.reply({ content: 'Sending the Ceraia panel...', flags: MessageFlags.Ephemeral });
                (interaction.channel as TextChannel).send(this.panel).catch((error) => {
                    client.logger.error(`Failed to send the Ceraia panel: ${error.stack}`);
                });
            }
        } else if (interaction.options.getSubcommandGroup() === 'profile') {
            if (interaction.options.getSubcommand() === 'view') {
                const user = interaction.options.getUser('user') || interaction.user;
                const commissionaryUser = await getCommissionaryUser(user.id);
                if (!commissionaryUser) {
                    await interaction.reply({ content: "We couldn't fetch the user profile" });
                    return;
                }

                const section = new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `# ${user.displayName}\n\n` +
                                `\n**Developer:** ${commissionaryUser.developer ? 'Yes.' : 'No.'}` +
                                `\n**Showcase:** ${commissionaryUser.showcase || 'No showcase set.'}` +
                                `\n**Biography:** ${commissionaryUser.biography}` +
                                `\n**Commissions:** ${commissionaryUser.commissions.length > 0 ? commissionaryUser.commissions.join(', ') : 'No commissions yet.'}` +
                                `\n**Ratings:** ${commissionaryUser.ratings.length} (${getAverageRating(commissionaryUser.ratings).toFixed(2)}/5)`
                        )
                    )
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(user.displayAvatarURL()));

                if (commissionaryUser.developer && commissionaryUser.showcase) {
                    section.setButtonAccessory(new GargoyleURLButtonBuilder(commissionaryUser.showcase).setLabel('View Showcase').setEmoji('📸'));
                }

                await interaction.reply({
                    components: [new ContainerBuilder().addSectionComponents(section)],
                    flags: MessageFlags.IsComponentsV2
                });
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
        }
    }

    public override async executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): Promise<void> {
        if (interaction.customId === 'biography') {
            const biography = interaction.fields.getTextInputValue('biography');
            const user = await getCommissionaryUser(interaction.user.id);

            if (!user) {
                await interaction.reply({ content: "We couldn't fetch your profile", ephemeral: true });
                return;
            }
            user.biography = biography;
            await user.save();
            await interaction.reply({ content: 'Your biography has been updated successfully!', ephemeral: true });
            return;
        }
    }

    private panel: MessageCreateOptions = {
        components: [
            new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent('# Commissions'))
            // .addActionRowComponents(
            //     new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            //         new GargoyleButtonBuilder(this, 'commission').setStyle(ButtonStyle.Primary).setLabel('Commission')
            //     )
            // )
        ],
        flags: [MessageFlags.IsComponentsV2]
    };
}

const commissionaryUserSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    developer: {
        type: Boolean,
        default: false
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
    commissionCategory: String,
    commissionSubcategory: String,
    commissionTitle: String,
    commissionDescription: String,
    commissionPrice: Number
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
    commissionCategory: string;
    commissionSubcategory: string;
    commissionTitle: string;
    commissionDescription: string;
    commissionPrice: number;
}) {
    const commission = new databaseCommissionaryCommission(commissionData);
    return await commission.save();
}
