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
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('blackjack')
                    .setDescription('Play a game of blackjack')
                    .addIntegerOption((option) => option.setName('bet').setDescription('The amount to bet').setMinValue(1).setRequired(true))
            ) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (!client.db) {
            await interaction.reply({
                components: [new GargoyleContainerBuilder('Database connection not established, please try again later.')],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
            return;
        }
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
        } else if (interaction.options.getSubcommand() === 'blackjack') {
            const bet = interaction.options.getInteger('bet', true);
            if (bet <= 0) {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('The bet must be greater than 0!')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                return;
            }

            if (economyUser.balance < bet) {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('You do not have enough money to make that bet!')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                return;
            }

            let game = this.cardMap.get(interaction.user.id);
            if (game) {
                await interaction.reply({
                    components: [
                        new GargoyleContainerBuilder(
                            `(You already have an ongoing game!)[https://discord.com/channels/${game.channelId}/${game.messageId}] Finish it before starting a new one.`
                        )
                    ],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                return;
            }
        } else {
            await interaction.reply({
                components: [new GargoyleContainerBuilder('Unknown subcommand!')],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
        }
    }

    /**
     * Map to store the cards for each user playing blackjack
     * Key: User ID
     * Value: Object containing the message id, channel id, deck of cards, player hand, and dealer hand
     */
    private cardMap = new Map<string, { messageId: string; channelId: string; cards: Card[]; playerHand: Card[]; dealerHand: Card[] }>();
}

enum Suit {
    Hearts = 'Hearts',
    Diamonds = 'Diamonds',
    Clubs = 'Clubs',
    Spades = 'Spades'
}

enum CardValue {
    Two = 2,
    Three = 3,
    Four = 4,
    Five = 5,
    Six = 6,
    Seven = 7,
    Eight = 8,
    Nine = 9,
    Ten = 10,
    Jack = 10,
    Queen = 10,
    King = 10,
    Ace = 11
}

type Card = {
    suit: Suit;
    value: CardValue;
};

const cards: Card[] = [
    { suit: Suit.Hearts, value: CardValue.Two },
    { suit: Suit.Hearts, value: CardValue.Three },
    { suit: Suit.Hearts, value: CardValue.Four },
    { suit: Suit.Hearts, value: CardValue.Five },
    { suit: Suit.Hearts, value: CardValue.Six },
    { suit: Suit.Hearts, value: CardValue.Seven },
    { suit: Suit.Hearts, value: CardValue.Eight },
    { suit: Suit.Hearts, value: CardValue.Nine },
    { suit: Suit.Hearts, value: CardValue.Ten },
    { suit: Suit.Hearts, value: CardValue.Jack },
    { suit: Suit.Hearts, value: CardValue.Queen },
    { suit: Suit.Hearts, value: CardValue.King },
    { suit: Suit.Hearts, value: CardValue.Ace },
    { suit: Suit.Diamonds, value: CardValue.Two },
    { suit: Suit.Diamonds, value: CardValue.Three },
    { suit: Suit.Diamonds, value: CardValue.Four },
    { suit: Suit.Diamonds, value: CardValue.Five },
    { suit: Suit.Diamonds, value: CardValue.Six },
    { suit: Suit.Diamonds, value: CardValue.Seven },
    { suit: Suit.Diamonds, value: CardValue.Eight },
    { suit: Suit.Diamonds, value: CardValue.Nine },
    { suit: Suit.Diamonds, value: CardValue.Ten },
    { suit: Suit.Diamonds, value: CardValue.Jack },
    { suit: Suit.Diamonds, value: CardValue.Queen },
    { suit: Suit.Diamonds, value: CardValue.King },
    { suit: Suit.Diamonds, value: CardValue.Ace },
    { suit: Suit.Clubs, value: CardValue.Two },
    { suit: Suit.Clubs, value: CardValue.Three },
    { suit: Suit.Clubs, value: CardValue.Four },
    { suit: Suit.Clubs, value: CardValue.Five },
    { suit: Suit.Clubs, value: CardValue.Six },
    { suit: Suit.Clubs, value: CardValue.Seven },
    { suit: Suit.Clubs, value: CardValue.Eight },
    { suit: Suit.Clubs, value: CardValue.Nine },
    { suit: Suit.Clubs, value: CardValue.Ten },
    { suit: Suit.Clubs, value: CardValue.Jack },
    { suit: Suit.Clubs, value: CardValue.Queen },
    { suit: Suit.Clubs, value: CardValue.King },
    { suit: Suit.Clubs, value: CardValue.Ace },
    { suit: Suit.Spades, value: CardValue.Two },
    { suit: Suit.Spades, value: CardValue.Three },
    { suit: Suit.Spades, value: CardValue.Four },
    { suit: Suit.Spades, value: CardValue.Five },
    { suit: Suit.Spades, value: CardValue.Six },
    { suit: Suit.Spades, value: CardValue.Seven },
    { suit: Suit.Spades, value: CardValue.Eight },
    { suit: Suit.Spades, value: CardValue.Nine },
    { suit: Suit.Spades, value: CardValue.Ten },
    { suit: Suit.Spades, value: CardValue.Jack },
    { suit: Suit.Spades, value: CardValue.Queen },
    { suit: Suit.Spades, value: CardValue.King },
    { suit: Suit.Spades, value: CardValue.Ace }
];

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
