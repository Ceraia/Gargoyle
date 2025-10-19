import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleContainerBuilder from '@src/system/backend/builders/gargoyleContainerBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import { FontWeight } from '@src/system/backend/tools/banners.js';
import Emojis from '@src/system/backend/tools/emojis.js';
import { sleepSync } from 'bun';
import { Canvas, loadImage } from 'canvas';
import {
    ActionRowBuilder,
    ApplicationIntegrationType,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ContainerBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageActionRowComponentBuilder,
    MessageEditOptions,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextBasedChannel,
    TextDisplayBuilder
} from 'discord.js';
import { model, Schema } from 'mongoose';

export default class Economy extends GargoyleModule {
    public override category: string = 'fun';
    public override slashCommands: GargoyleSlashCommandBuilder[] = [
        new GargoyleSlashCommandBuilder().addGuild('750209335841390642').setName('carddraw').setDescription('Draw a card image'),
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

        if (interaction.commandName === 'carddraw') {
            const card = cards[Math.floor(Math.random() * cards.length)];
            const buffer = await drawCard(card);
            await interaction.reply({
                files: [{ attachment: buffer, name: 'card.png' }],
                components: [
                    new GargoyleContainerBuilder(`You drew a ${card.value.name} of ${card.suit}!`).addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://card.png'))
                    )
                ],
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
                if (
                    lastDaily.getDate() === now.getDate() &&
                    lastDaily.getMonth() === now.getMonth() &&
                    lastDaily.getFullYear() === now.getFullYear()
                ) {
                    await interaction.reply({
                        components: [new GargoyleContainerBuilder('You have already claimed your daily reward today!')],
                        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                    });
                    return;
                } else if (
                    lastDaily.getDate() + 1 === now.getDate() &&
                    lastDaily.getMonth() === now.getMonth() &&
                    lastDaily.getFullYear() === now.getFullYear()
                ) {
                    economyUser.dailyStreak += 1;
                } else {
                    economyUser.dailyStreak = 1;
                }
            }
            const dailyAmount = 50 + economyUser.dailyStreak * 10;
            economyUser.balance += dailyAmount;
            client.logger.trace(`User ${interaction.user.id} claimed daily reward of $${dailyAmount} with a streak of ${economyUser.dailyStreak}.`);
            economyUser.lastDaily = now;
            await economyUser.save();
            await interaction.reply({
                components: [
                    new GargoyleContainerBuilder(
                        `You have claimed your daily reward of $${dailyAmount.toLocaleString()}! Your current streak is ${economyUser.dailyStreak + 1} days.`
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
                const message = await ((await client.channels.fetch(game.channelId)) as TextBasedChannel)?.messages.fetch(game.messageId);
                if (message) {
                    await interaction.reply({
                        components: [
                            new GargoyleContainerBuilder(
                                `(You already have an ongoing game!)[https://discord.com/channels/${game.channelId}/${game.messageId}] Finish it before starting a new one.`
                            )
                        ],
                        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                    });
                    return;
                } else {
                    this.cardMap.delete(interaction.user.id);
                }
            }

            const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
            const message = await interaction
                .reply({
                    components: [new GargoyleContainerBuilder('Starting a game of blackjack...')],
                    flags: [MessageFlags.IsComponentsV2]
                })
                .catch(async () => {
                    await interaction.followUp({
                        content: 'Failed to start a game of blackjack, please try again later.',
                        flags: MessageFlags.Ephemeral
                    });
                    return null;
                });
            if (!message) return;

            this.cardMap.set(interaction.user.id, {
                messageId: message.id,
                channelId: interaction.channelId,
                cards: shuffledCards,
                playerHand: [],
                dealerHand: [],
                wager: bet
            });

            economyUser.balance -= bet;
            await economyUser.save();

            // Hand out cards
            const gameData = this.cardMap.get(interaction.user.id);
            if (!gameData) {
                await interaction.followUp({
                    components: [new GargoyleContainerBuilder('Failed to start a game of blackjack, please try again later.')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                economyUser.balance += bet;
                await economyUser.save();
                this.cardMap.delete(interaction.user.id);
                return;
            }
            gameData.playerHand.push(gameData.cards.pop()!);
            gameData.dealerHand.push(gameData.cards.pop()!);
            gameData.playerHand.push(gameData.cards.pop()!);
            gameData.dealerHand.push(gameData.cards.pop()!);

            const edit = this.drawGame(interaction.user.id, { dealerTurn: false });
            if (!edit) {
                await interaction.followUp({
                    components: [new GargoyleContainerBuilder('Failed to start a game of blackjack, please try again later.')]
                });
                economyUser.balance += bet;
                await economyUser.save();
                this.cardMap.delete(interaction.user.id);
                return;
            }
            await message.edit(edit);
        } else {
            await interaction.reply({
                components: [new GargoyleContainerBuilder('Unknown subcommand!')],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
        }
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (!client.db) {
            await interaction.reply({
                components: [new GargoyleContainerBuilder('Database connection not established, please try again later.')],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
            return;
        }
        if (args[1] !== interaction.user.id) {
            await interaction.reply({
                components: [new GargoyleContainerBuilder('This button is not for you!')],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
            return;
        }
        if (args[0] === 'hit') {
            const game = this.cardMap.get(interaction.user.id);
            if (!game) {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('You do not have an ongoing game!')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                return;
            }
            const card = game.cards.pop();
            if (card) {
                game.playerHand.push(card);
            }
            const playerTotal = calculateHandTotal(game.playerHand);
            if (playerTotal > 21) {
                const economyUser = await getEconomyUser(interaction.user.id);
                await economyUser.save();
                this.cardMap.delete(interaction.user.id);
                await interaction.update({
                    components: [
                        new ContainerBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Blackjack - You Busted!'))
                            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `Your cards: ${cardsToString(game.playerHand)} (Total: ${playerTotal})\nYou lost $${game.wager.toLocaleString()}. Your new balance is $${economyUser.balance.toLocaleString()}.`
                                )
                            )
                    ],
                    flags: [MessageFlags.IsComponentsV2]
                });
                return;
            }
            const edit = this.drawGame(interaction.user.id, { dealerTurn: false });
            if (edit) {
                await interaction.update(edit);
            } else {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('Failed to update game, please try again later.')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            }
        } else if (args[0] === 'stand') {
            const game = this.cardMap.get(interaction.user.id);
            if (!game) {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('You do not have an ongoing game!')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                return;
            }
            await interaction.deferUpdate();
            const edit = this.drawGame(interaction.user.id, { dealerTurn: true });
            if (edit) {
                await interaction.message.edit(edit);
                let userTotal = calculateHandTotal(game.playerHand);
                let dealerTotal = calculateHandTotal(game.dealerHand);
                while (dealerTotal < userTotal && dealerTotal <= 21) {
                    client.logger.trace('Dealer drawing a card...');
                    sleepSync(1500);
                    const card = game.cards.pop();
                    if (card) {
                        game.dealerHand.push(card);
                    }
                    dealerTotal = calculateHandTotal(game.dealerHand);
                    const edit = this.drawGame(interaction.user.id, { dealerTurn: true });
                    if (edit) {
                        await interaction.message.edit(edit);
                    }
                }
                const economyUser = await getEconomyUser(interaction.user.id);
                let resultMessage = '';
                if (dealerTotal > 21 || userTotal > dealerTotal) {
                    economyUser.balance += game.wager * 2;
                    resultMessage = `You win! You gained $${game.wager.toLocaleString()}. Your new balance is $${economyUser.balance.toLocaleString()}.`;
                } else if (dealerTotal === userTotal) {
                    economyUser.balance += game.wager;
                    resultMessage = `It's a tie! Your balance remains $${economyUser.balance.toLocaleString()}.`;
                } else {
                    resultMessage = `You lose! You lost $${game.wager.toLocaleString()}. Your new balance is $${economyUser.balance.toLocaleString()}.`;
                }
                await economyUser.save();
                this.cardMap.delete(interaction.user.id);
                await interaction.message.edit({
                    components: [
                        new ContainerBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Blackjack - Game Over'))
                            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `Dealer's cards: ${cardsToString(game.dealerHand)} (Total: ${dealerTotal})\nYour cards: ${cardsToString(
                                        game.playerHand
                                    )} (Total: ${userTotal})\n${resultMessage}`
                                )
                            )
                    ],
                    flags: [MessageFlags.IsComponentsV2]
                });
            } else {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('Failed to update game, please try again later.')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            }
        } else if (args[0] === 'forfeit') {
            const game = this.cardMap.get(interaction.user.id);
            if (!game) {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('You do not have an ongoing game!')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                return;
            }
            const economyUser = await getEconomyUser(interaction.user.id);
            const forfeitAmount = Math.floor(game.wager / 2);
            economyUser.balance += forfeitAmount;
            await economyUser.save();
            this.cardMap.delete(interaction.user.id);
            await interaction.update({
                components: [
                    new ContainerBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Blackjack - You Forfeited!'))
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `You forfeited the game and lost $${forfeitAmount.toLocaleString()}. Your new balance is $${economyUser.balance.toLocaleString()}.`
                            )
                        )
                ],
                flags: [MessageFlags.IsComponentsV2]
            });
        } else {
            await interaction.reply({
                components: [new GargoyleContainerBuilder('Unknown button action!')],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
        }
    }

    private drawGame(
        userId: string,
        options: {
            dealerTurn?: boolean;
        }
    ): MessageEditOptions | null {
        const game = this.cardMap.get(userId);
        if (!game) return null;

        const dealerCardsVisible = options?.dealerTurn ? game.dealerHand : [game.dealerHand[0]];

        const playerTotal = calculateHandTotal(game.playerHand);
        const dealerTotal = calculateHandTotal(dealerCardsVisible);

        return {
            components: [
                new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`# Blackjack ${options?.dealerTurn ? "- Dealer's Turn" : '- Your Turn'}`)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `Dealer's cards: ${cardsToString(dealerCardsVisible) + (options?.dealerTurn ? '' : ' `(Hidden)`')} (Total: ${dealerTotal})`
                        )
                    )
                    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`Your cards: ${cardsToString(game.playerHand)} (Total: ${playerTotal})`)
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                            new GargoyleButtonBuilder(this, 'hit', userId)
                                .setEmoji(Emojis.WhitePlus)
                                .setLabel('Hit')
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(options?.dealerTurn),
                            new GargoyleButtonBuilder(this, 'stand', userId)
                                .setEmoji(Emojis.WhiteGavel)
                                .setLabel('Stand')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(options?.dealerTurn),
                            new GargoyleButtonBuilder(this, 'forfeit', userId)
                                .setEmoji(Emojis.WhiteMinus)
                                .setLabel('Forfeit')
                                .setStyle(ButtonStyle.Danger)
                                .setDisabled(options?.dealerTurn)
                        )
                    )
            ],
            flags: [MessageFlags.IsComponentsV2]
        };
    }

    /**
     * Map to store the cards for each user playing blackjack
     * Key: User ID
     * Value: Object containing the message id, channel id, deck of cards, player hand, and dealer hand
     */
    private cardMap = new Map<
        string,
        { messageId: string; channelId: string; wager: number; cards: Card[]; playerHand: Card[]; dealerHand: Card[] }
    >();
}

function calculateHandTotal(hand: Card[]): number {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
        total += card.value.value;
        if (card.value.value === CardValue.Ace.value) {
            aces += 1;
        }
    }

    while (total > 21 && aces > 0) {
        total -= 10;
        aces -= 1;
    }

    return total;
}

function cardToString(card: Card): string {
    return `\`${card.value.name}${card.suit}\``;
}

function cardsToString(cards: Card[]): string {
    return cards.map(cardToString).join(', ');
}

enum Suit {
    Hearts = 'Hearts',
    Diamonds = 'Diamonds',
    Clubs = 'Clubs',
    Spades = 'Spades'
}

const CardValue = {
    Ace: { name: 'Ace', shortName: 'A', value: 11 },
    Two: { name: 'Two', shortName: '2', value: 2 },
    Three: { name: 'Three', shortName: '3', value: 3 },
    Four: { name: 'Four', shortName: '4', value: 4 },
    Five: { name: 'Five', shortName: '5', value: 5 },
    Six: { name: 'Six', shortName: '6', value: 6 },
    Seven: { name: 'Seven', shortName: '7', value: 7 },
    Eight: { name: 'Eight', shortName: '8', value: 8 },
    Nine: { name: 'Nine', shortName: '9', value: 9 },
    Ten: { name: 'Ten', shortName: '10', value: 10 },
    Jack: { name: 'Jack', shortName: 'J', value: 10 },
    Queen: { name: 'Queen', shortName: 'Q', value: 10 },
    King: { name: 'King', shortName: 'K', value: 10 }
}

type Card = {
    suit: Suit;
    value: typeof CardValue[keyof typeof CardValue];
};

async function drawCard(card: Card) {
    const width = 75, height = 105;
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext('2d');

    // Card background
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.roundRect(0, 0, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // Card value
    ctx.fillStyle = 'white';
    ctx.font = `${FontWeight.ExtraLight} 16px Montserrat`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const iconW = 16, iconH = 16; // 80% of 20x20
    const textX = 4 + iconW / 2;
    const textY = 8 + 16 / 2; // 16 is font size
    
    ctx.fillText(card.value.shortName.toString(), textX, textY);

    // Suit icon (draw to offscreen canvas, recolor, then draw to main canvas)
    const suitName = card.suit.toLowerCase();
    const suitImg = await loadImage(`./media/icons/phosphor/${suitName}.svg`);
    const suitCanvas = new Canvas(iconW, iconH);
    const suitCtx = suitCanvas.getContext('2d');
    suitCtx.drawImage(suitImg, 0, 0, iconW, iconH);
    suitCtx.globalCompositeOperation = 'source-in';
    suitCtx.fillStyle = 'white';
    suitCtx.fillRect(0, 0, iconW, iconH);
    suitCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(suitCanvas, 4, 28, iconW, iconH);

    return canvas.toBuffer();
}

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
