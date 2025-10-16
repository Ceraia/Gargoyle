import GargoyleContainerBuilder from '@src/system/backend/builders/gargoyleContainerBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import { ApplicationIntegrationType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { model, Schema } from 'mongoose';

export default class Economy extends GargoyleModule {
    public override category: string = 'fun';
    public override slashCommands: GargoyleSlashCommandBuilder[] = [
        new GargoyleSlashCommandBuilder()
            .setName('economy')
            .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
            .setDescription('Economy commands')
            .addSubcommand((subcommand) => subcommand.setName('balance').setDescription('Check your balance'))
            .addSubcommand((subcommand) => subcommand.setName('daily').setDescription('Claim your daily reward'))
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('pay')
                    .setDescription('Pay another user')
                    .addUserOption((option) => option.setName('user').setDescription('The user to pay').setRequired(true))
                    .addNumberOption((option) => option.setName('amount').setDescription('The amount to pay').setRequired(true))
            ) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        const economyUser = await getEconomyUser(interaction.user.id);
        if (interaction.options.getSubcommand() === 'balance') {
            await interaction.reply({
                components: [new GargoyleContainerBuilder(`$${economyUser.balance.toLocaleString()}`)],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
        } else if (interaction.options.getSubcommand() === 'daily') {
            const now = new Date();
            if (economyUser.lastDaily) {
                const lastDaily = new Date(economyUser.lastDaily);
                const diffTime = Math.abs(now.getTime() - lastDaily.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 0) {
                    await interaction.reply({
                        components: [new GargoyleContainerBuilder('You have already claimed your daily reward today!')],
                        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                    });
                    return;
                } else if (diffDays === 1) {
                    economyUser.dailyStreak += 1;
                } else {
                    economyUser.dailyStreak = 1;
                }
            }
            const dailyAmount = 50 + economyUser.dailyStreak * 10;
            economyUser.balance += dailyAmount;
            economyUser.lastDaily = now;
            await economyUser.save();
            await interaction.reply({
                components: [
                    new GargoyleContainerBuilder(
                        `You have claimed your daily reward of $${dailyAmount.toLocaleString()}! Your current streak is ${economyUser.dailyStreak} days.`
                    )
                ],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
        } else if (interaction.options.getSubcommand() === 'pay') {
            const user = interaction.options.getUser('user', true);
            const amount = interaction.options.getNumber('amount', true);
            if (user.id === interaction.user.id) {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('You cannot pay yourself!')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                return;
            }
            if (amount <= 0) {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('The amount must be greater than 0!')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                return;
            }
            if (economyUser.balance < amount) {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('You do not have enough money to pay that amount!')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                return;
            }
            const recipientEconomyUser = await getEconomyUser(user.id);
            economyUser.balance -= amount;
            recipientEconomyUser.balance += amount;
            await economyUser.save();
            await recipientEconomyUser.save();
            await interaction.reply({
                components: [
                    new GargoyleContainerBuilder(
                        `You have paid $${amount.toLocaleString()} to <@!${user.id}>! Your new balance is $${economyUser.balance.toLocaleString()}.`
                    )
                ],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                allowedMentions: { users: [] }
            });
        } else {
            await interaction.reply({
                components: [new GargoyleContainerBuilder('Unknown subcommand!')],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
        }
    }
}

async function getEconomyUser(userId: string) {
    const economyUser = await databaseEconomyUsers.findOne({ userId });
    if (!economyUser) {
        const newEconomyUser = new databaseEconomyUsers({ userId });
        await newEconomyUser.save();
        return newEconomyUser;
    }
    return economyUser;
}

const economyUserSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 100
    },
    lastDaily: {
        type: Date,
        default: null
    },
    dailyStreak: {
        type: Number,
        default: 0
    }
});

const databaseEconomyUsers = model('EconomyUsers', economyUserSchema);
