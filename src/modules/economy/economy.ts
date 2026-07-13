import ChattoCommandBuilder from '@src/system/backend/builders/chattoCommandBuilder';
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleContainerBuilder from '@src/system/backend/builders/gargoyleContainerBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import { FontWeight } from '@src/system/backend/tools/banners.js';
import Emojis from '@src/system/backend/tools/emojis.js';
import { sleepSync } from 'bun';
import type { FileInput } from 'chatto.ts';
import { Message as ChattoMessage } from 'chatto.ts';
import { Canvas, loadImage } from 'canvas';
import {
    ActionRowBuilder,
    ApplicationIntegrationType,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ClientEvents,
    ContainerBuilder,
    Events,
    GuildMember,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    Message,
    MessageActionRowComponentBuilder,
    MessageCreateOptions,
    MessageEditOptions,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder
} from 'discord.js';
import { desc, eq } from 'drizzle-orm';

export default class Economy extends GargoyleModule {
    public override name: string = 'economy';
    public override category: string = 'economy';
    public override slashCommands: GargoyleSlashCommandBuilder[] = [
        new GargoyleSlashCommandBuilder()
            .setName('economy')
            .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
            .setDescription('Economy commands')
            .addSubcommandGroup((group) =>
                group
                    .setName('leaderboard')
                    .setDescription('View leaderboards')
                    .addSubcommand((subcommand) => subcommand.setName('experience').setDescription('View the experience leaderboard for this server'))
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('balance')
                            .setDescription('View the balance leaderboard for this server')
                            .addStringOption((option) =>
                                option
                                    .setName('scope')
                                    .setDescription('The scope of the leaderboard')
                                    .addChoices({ name: 'Global', value: 'global' }, { name: 'Server', value: 'server' })
                                    .setRequired(true)
                            )
                    )
            )
            .addSubcommandGroup((group) =>
                group
                    .setName('experience')
                    .setDescription('Experience related commands')
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('user')
                            .setDescription('Disable / enable level up messages for yourself')
                            .addStringOption((option) =>
                                option
                                    .setName('status')
                                    .setDescription('Enable or disable level up messages')
                                    .addChoices({ name: 'Enable', value: 'enable' }, { name: 'Disable', value: 'disable' })
                            )
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName('server')
                            .setDescription('Disable / enable level up messages for the server')
                            .addStringOption((option) =>
                                option
                                    .setName('status')
                                    .setDescription('Enable or disable level up messages')
                                    .addChoices({ name: 'Enable', value: 'enable' }, { name: 'Disable', value: 'disable' })
                            )
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('blackjack')
                    .setDescription('Play a game of blackjack')
                    .addIntegerOption((option) => option.setName('bet').setDescription('The amount to bet').setMinValue(1).setRequired(true))
            ) as GargoyleSlashCommandBuilder
    ];
    public override chattoCommands: ChattoCommandBuilder[] = [
        new ChattoCommandBuilder().setName('blackjack').setDescription('Play blackjack and earn some cash.').setUsage('blackjack <wager>')
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (!client.db) {
            await interaction.reply({
                components: [new GargoyleContainerBuilder('Database connection not established, please try again later.')],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
            return;
        }

        if (!interaction.guildId) {
            await interaction.reply({
                components: [new GargoyleContainerBuilder('This command can only be used in a server!')],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
            return;
        }

        let user = await client.db.getUser(interaction.user.id, { exists: true });
        if (interaction.options.getSubcommandGroup(false) === 'leaderboard') {
            if (interaction.options.getSubcommand(false) === 'experience') {
                const guildUsers = await client.db.drizzle
                    ?.select()
                    .from(client.db.schema.guildUsersTable)
                    .where(eq(client.db.schema.guildUsersTable.guild_id, interaction.guildId!))
                    .orderBy(desc(client.db.schema.guildUsersTable.experience))
                    .limit(10);

                if (!guildUsers || guildUsers.length === 0) {
                    await interaction.reply({
                        components: [new GargoyleContainerBuilder('Failed to fetch the leaderboard, please try again later.')],
                        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                    });
                    return;
                }

                let users = `# ${interaction.guild?.name} XP Leaderboard\n\n`;
                for (let i = 0; i < guildUsers.length; i++) {
                    const user = await client.users.fetch(guildUsers[i].user_id).catch(() => null);
                    if (!user) continue;
                    users += `**\`${i + 1}.\` <@!${user.id}> (${user.tag})**\n> Level ${calculateLevel(guildUsers[i].experience)} (${guildUsers[i].experience} XP)\n`;
                }

                await interaction.reply({
                    components: [new GargoyleContainerBuilder(users)],
                    flags: [MessageFlags.IsComponentsV2],
                    allowedMentions: { users: [] }
                });
            } else if (interaction.options.getSubcommand(false) === 'balance') {
                const scope = interaction.options.getString('scope', true);
                let users: (typeof client.db.schema.usersTable.$inferSelect)[] = [];

                if (scope === 'global') {
                    users =
                        (await client.db.drizzle
                            ?.select()
                            .from(client.db.schema.usersTable)
                            .orderBy(desc(client.db.schema.usersTable.balance))
                            .limit(10)) || [];
                } else {
                    users =
                        (
                            await client.db.drizzle
                                ?.select()
                                .from(client.db.schema.usersTable)
                                .innerJoin(
                                    client.db.schema.guildUsersTable,
                                    eq(client.db.schema.usersTable.user_id, client.db.schema.guildUsersTable.user_id)
                                )
                                .where(eq(client.db.schema.guildUsersTable.guild_id, interaction.guildId!))
                                .orderBy(desc(client.db.schema.usersTable.balance))
                                .limit(10)
                        )?.map((user) => user.users) || [];
                }

                if (users.length === 0) {
                    await interaction.reply({
                        components: [new GargoyleContainerBuilder('Failed to fetch the leaderboard, please try again later.')],
                        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                    });
                    return;
                }

                let leaderboard = `# ${interaction.guild?.name} Balance Leaderboard (${scope === 'global' ? 'Global' : 'Server'})\n\n`;
                for (let i = 0; i < users.length; i++) {
                    const user = await client.users.fetch(users[i].user_id).catch(() => null);
                    leaderboard += `**\`${i + 1}.\` <@!${users[i].user_id}> (${user?.tag ?? 'Unknown User'})**\n> $${users[i].balance.toLocaleString()}\n`;
                }
                await interaction.reply({
                    components: [new GargoyleContainerBuilder(leaderboard)],
                    flags: [MessageFlags.IsComponentsV2],
                    allowedMentions: { users: [] }
                });
            }
        } else if (interaction.options.getSubcommandGroup(false) === 'experience') {
            const subcommand = interaction.options.getSubcommand();
            if (subcommand === 'user') {
                const status = interaction.options.getString('status', true);
                const disable = status === 'disable';
                await client.db.setUser(interaction.user.id, {
                    disable_xp_msg: disable
                });
                await interaction.reply({
                    components: [new GargoyleContainerBuilder(`Level up messages have been ${disable ? 'disabled' : 'enabled'} for you!`)],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            } else if (subcommand === 'server') {
                if (!interaction.member || !(interaction.member instanceof GuildMember) || !interaction.member.permissions.has('ManageGuild')) {
                    await interaction.reply({
                        components: [new GargoyleContainerBuilder('You do not have permission to use this command!')],
                        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                    });
                    return;
                }
                const status = interaction.options.getString('status', true);
                const disable = status === 'disable';
                await client.db.setGuild(interaction.guildId!, {
                    experience: !disable
                });
                await interaction.reply({
                    components: [new GargoyleContainerBuilder(`Level up messages have been ${disable ? 'disabled' : 'enabled'} for this server!`)],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            }
        } else if (interaction.options.getSubcommand(false) === 'blackjack') {
            const bet = interaction.options.getInteger('bet', true);
            await interaction.deferReply();
            if (bet <= 0) {
                await interaction.editReply({
                    components: [new GargoyleContainerBuilder('The bet must be greater than 0!')],
                    flags: [MessageFlags.IsComponentsV2]
                });
                return;
            }

            if (user.balance < bet) {
                await interaction.editReply({
                    components: [new GargoyleContainerBuilder('You do not have enough money to make that bet!')],
                    flags: [MessageFlags.IsComponentsV2]
                });
                return;
            }

            let game = this.cardMap.get(interaction.user.id);

            if (game) {
                const edit = await this.drawGame(interaction.user.id);
                if (edit) {
                    await interaction.editReply(edit);
                    return;
                } else {
                    this.cardMap.delete(interaction.user.id);
                }
            }

            const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
            const message = await interaction
                .editReply({
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
                state: GameState.PlayerTurn,
                cards: shuffledCards,
                messageState: 0,
                playerHand: [],
                dealerHand: [],
                wager: bet
            });

            user.balance -= bet;
            await client.db.setUser(interaction.user.id, {
                balance: user.balance
            });

            // Hand out cards
            const gameData = this.cardMap.get(interaction.user.id);
            if (!gameData) {
                await interaction.followUp({
                    components: [new GargoyleContainerBuilder('Failed to start a game of blackjack, please try again later.')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                user.balance += bet;
                await client.db.setUser(interaction.user.id, {
                    balance: user.balance
                });
                this.cardMap.delete(interaction.user.id);
                return;
            }
            gameData.playerHand.push(gameData.cards.pop()!);
            gameData.dealerHand.push(gameData.cards.pop()!);
            gameData.playerHand.push(gameData.cards.pop()!);
            gameData.dealerHand.push(gameData.cards.pop()!);

            const edit = await this.drawGame(interaction.user.id);
            if (!edit) {
                await interaction.followUp({
                    components: [new GargoyleContainerBuilder('Failed to start a game of blackjack, please try again later.')]
                });
                user.balance += bet;
                await client.db.setUser(interaction.user.id, {
                    balance: user.balance
                });
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

        if (args[0] === 'rematch') {
            const game = this.cardMap.get(interaction.user.id);

            if (game) {
                const edit = await this.drawGame(interaction.user.id);
                if (edit) {
                    await interaction.update(edit);
                    return;
                }
                return;
            }

            const user = await client.db.getUser(interaction.user.id, { exists: true });
            if (user.balance < Number(args[2])) {
                await interaction.update({
                    components: [new GargoyleContainerBuilder('You do not have enough money to rematch!')],
                    flags: [MessageFlags.IsComponentsV2]
                });
                return;
            }

            user.balance -= Number(args[2]);
            await client.db.setUser(interaction.user.id, {
                balance: user.balance
            });

            const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
            this.cardMap.set(interaction.user.id, {
                state: GameState.PlayerTurn,
                cards: shuffledCards,
                messageState: 0,
                playerHand: [],
                dealerHand: [],
                wager: Number(args[2])
            });

            // Hand out cards
            const gameData = this.cardMap.get(interaction.user.id);
            if (!gameData) {
                await interaction.update({
                    components: [new GargoyleContainerBuilder('Failed to start a rematch, please try again later.')],
                    flags: [MessageFlags.IsComponentsV2]
                });
                user.balance += Number(args[2]);
                await client.db.setUser(interaction.user.id, {
                    balance: user.balance
                });
                this.cardMap.delete(interaction.user.id);
                return;
            }
            gameData.messageState = 0;
            gameData.state = GameState.PlayerTurn;
            gameData.playerHand.push(gameData.cards.pop()!);
            gameData.dealerHand.push(gameData.cards.pop()!);
            gameData.playerHand.push(gameData.cards.pop()!);
            gameData.dealerHand.push(gameData.cards.pop()!);

            const edit = await this.drawGame(interaction.user.id);
            if (edit) await interaction.update(edit);
            return;
        }

        const game = this.cardMap.get(interaction.user.id);

        if (!game) {
            await interaction.update({
                components: [new GargoyleContainerBuilder('This game has already ended!')],
                flags: [MessageFlags.IsComponentsV2]
            });
            return;
        }

        if (args[2] !== game.messageState.toString()) {
            const edit = await this.drawGame(interaction.user.id);
            if (edit) await interaction.message.edit(edit);
        }

        if (args[0] === 'hit') {
            game.messageState += 1;
            const card = game.cards.pop();
            if (card) {
                game.playerHand.push(card);
            }
            const playerTotal = calculateHandTotal(game.playerHand);
            if (playerTotal > 21) {
                game.state = GameState.PlayerBust;
            }
            const edit = await this.drawGame(interaction.user.id);
            if (edit) {
                await interaction.update(edit);
            } else {
                await interaction.reply({
                    components: [new GargoyleContainerBuilder('Failed to update game, please try again later.')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            }
        } else if (args[0] === 'stand') {
            game.state = GameState.DealerTurn;
            await interaction.deferUpdate();
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
                const edit = await this.drawGame(interaction.user.id);
                if (edit) {
                    await interaction.message.edit(edit);
                }
                game.messageState += 1;
            }
            const user = await client.db.getUser(interaction.user.id, { exists: true });

            if (dealerTotal > 21 || userTotal > dealerTotal) {
                user.balance += game.wager * 2;
                game.state = GameState.PlayerWin;
            } else if (dealerTotal === userTotal) {
                user.balance += game.wager;
                game.state = GameState.Tie;
            } else {
                game.state = GameState.PlayerLose;
            }
            await client.db.setUser(interaction.user.id, {
                balance: user.balance
            });
            const edit = await this.drawGame(interaction.user.id);
            if (edit) {
                await interaction.message.edit(edit);
            } else {
                await interaction.followUp({
                    components: [new GargoyleContainerBuilder('Failed to update game, please try again later.')],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            }
        } else if (args[0] === 'forfeit') {
            game.messageState += 1;
            const user = await client.db.getUser(interaction.user.id, { exists: true });
            const forfeitAmount = Math.floor(game.wager / 2);
            user.balance += forfeitAmount;
            await client.db.setUser(interaction.user.id, {
                balance: user.balance
            });

            this.cardMap.delete(interaction.user.id);

            await interaction.update({
                components: [
                    new ContainerBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Blackjack - You Forfeited!'))
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                        .addMediaGalleryComponents(
                            new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://blackjack.png`))
                        )
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `You forfeited the game and lost $${forfeitAmount.toLocaleString()}. Your new balance is $${user.balance.toLocaleString()}.`
                            )
                        )
                ],
                flags: [MessageFlags.IsComponentsV2],
                files: [
                    {
                        attachment: await drawGame({ dealerTurn: true, userCards: game.playerHand, dealerCards: game.dealerHand }),
                        name: 'blackjack.png'
                    }
                ]
            });
        } else {
            await interaction.reply({
                components: [new GargoyleContainerBuilder('Unknown button action!')],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
        }
    }

    public override async executeChattoCommand(client: GargoyleClient, message: ChattoMessage, ...args: string[]): Promise<void> {
        if (!client.db) {
            await message.reply({ content: 'Database not connected. Please try again later.' });
            return;
        }
        if (!client.chatto) return;

        const wager = parseInt(args[1] ?? '', 10);
        if (!Number.isInteger(wager) || wager <= 0) {
            await message.reply({ content: 'Invalid wager! Usage: `/blackjack <wager>`' });
            return;
        }

        if (this.cardMap.has(message.author.id)) {
            await message.reply({ content: 'You already have a blackjack game in progress! Finish it first.' });
            return;
        }

        const user = await client.db.getUser(message.author.id, { exists: true });
        if (user.balance < wager) {
            await message.reply({ content: 'You do not have enough money to make that bet!' });
            return;
        }

        // Deduct the wager and set up the game.
        user.balance -= wager;
        await client.db.setUser(message.author.id, { balance: user.balance });

        const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
        this.cardMap.set(message.author.id, {
            state: GameState.PlayerTurn,
            cards: shuffledCards,
            messageState: 0,
            playerHand: [],
            dealerHand: [],
            wager
        });

        const game = this.cardMap.get(message.author.id);
        if (!game) {
            user.balance += wager;
            await client.db.setUser(message.author.id, { balance: user.balance });
            await message.reply({ content: 'Failed to start a game of blackjack, please try again later.' });
            this.cardMap.delete(message.author.id);
            return;
        }

        // Deal.
        game.playerHand.push(game.cards.pop()!);
        game.dealerHand.push(game.cards.pop()!);
        game.playerHand.push(game.cards.pop()!);
        game.dealerHand.push(game.cards.pop()!);

        let gameMessage: ChattoMessage;
        try {
            gameMessage = await message.reply(await renderChattoGame(game));
        } catch {
            user.balance += wager;
            await client.db.setUser(message.author.id, { balance: user.balance });
            this.cardMap.delete(message.author.id);
            return;
        }

        // Move loop.
        try {
            while (game.state === GameState.PlayerTurn) {
                const move = (await awaitMove(client, message.channelId, message.author.id, 60_000)) ?? 'fold';

                if (move === 'hit') {
                    const card = game.cards.pop();
                    if (card) game.playerHand.push(card);
                    if (calculateHandTotal(game.playerHand) > 21) {
                        game.state = GameState.PlayerBust;
                    }
                    await gameMessage.edit(await renderChattoGame(game));
                    if (game.state === GameState.PlayerBust) break;
                } else if (move === 'stand') {
                    game.state = GameState.DealerTurn;
                    await gameMessage.edit(await renderChattoGame(game));

                    const userTotal = calculateHandTotal(game.playerHand);
                    let dealerTotal = calculateHandTotal(game.dealerHand);
                    while (dealerTotal < userTotal && dealerTotal <= 21) {
                        await new Promise((resolve) => setTimeout(resolve, 1500));
                        const card = game.cards.pop();
                        if (card) game.dealerHand.push(card);
                        dealerTotal = calculateHandTotal(game.dealerHand);
                        await gameMessage.edit(await renderChattoGame(game));
                    }

                    const freshUser = await client.db.getUser(message.author.id, { exists: true });
                    if (dealerTotal > 21 || userTotal > dealerTotal) {
                        freshUser.balance += wager * 2;
                        game.state = GameState.PlayerWin;
                    } else if (dealerTotal === userTotal) {
                        freshUser.balance += wager;
                        game.state = GameState.Tie;
                    } else {
                        game.state = GameState.PlayerLose;
                    }
                    await client.db.setUser(message.author.id, { balance: freshUser.balance });
                    await gameMessage.edit(await renderChattoGame(game));
                    break;
                } else {
                    // fold / timeout
                    const freshUser = await client.db.getUser(message.author.id, { exists: true });
                    freshUser.balance += Math.floor(wager / 2);
                    await client.db.setUser(message.author.id, { balance: freshUser.balance });
                    await gameMessage.edit(await renderChattoGame(game, true));
                    break;
                }
            }
        } catch (error) {
            client.logger.error(`Chatto blackjack game errored: ${error}`);
        } finally {
            this.cardMap.delete(message.author.id);
        }
    }

    private async drawGame(userId: string): Promise<MessageEditOptions | null> {
        const game = this.cardMap.get(userId);
        if (!game) return null;

        let container = new ContainerBuilder();

        switch (game.state) {
            case GameState.DealerTurn:
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent("# Blackjack - Dealer's Turn"));
                break;
            case GameState.PlayerTurn:
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent('# Blackjack - Your Turn'));
                break;
            case GameState.PlayerBust:
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent('# Blackjack - You Busted!'));
                break;
            case GameState.PlayerWin:
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent('# Blackjack - You Won!'));
                break;
            case GameState.PlayerLose:
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent('# Blackjack - You Lost!'));
                break;
            case GameState.Tie:
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent("# Blackjack - It's a Tie!"));
                break;
        }

        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://blackjack.png`)));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));

        if (game.state === GameState.PlayerTurn || game.state === GameState.DealerTurn) {
            container.addActionRowComponents(
                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                    new GargoyleButtonBuilder(this, 'hit', userId, game.messageState.toString())
                        .setEmoji(Emojis.WhitePlus)
                        .setLabel('Hit')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(game.state === GameState.DealerTurn),
                    new GargoyleButtonBuilder(this, 'stand', userId, game.messageState.toString())
                        .setEmoji(Emojis.WhiteGavel)
                        .setLabel('Stand')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(game.state === GameState.DealerTurn),
                    new GargoyleButtonBuilder(this, 'forfeit', userId, game.messageState.toString())
                        .setEmoji(Emojis.WhiteMinus)
                        .setLabel('Forfeit')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(game.state === GameState.DealerTurn)
                )
            );
        } else {
            container.addActionRowComponents(
                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                    new GargoyleButtonBuilder(this, 'rematch', userId, game.wager.toString())
                        .setEmoji(Emojis.WhitePlus)
                        .setLabel('Rematch')
                        .setStyle(ButtonStyle.Success)
                )
            );
        }

        switch (game.state) {
            case GameState.PlayerBust:
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# You lost $${game.wager.toLocaleString()}.`));
                break;
            case GameState.PlayerWin:
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# You won $' + (game.wager * 2).toLocaleString() + '!'));
                break;
            case GameState.PlayerLose:
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# You lost $${game.wager.toLocaleString()}.`));
                break;
            case GameState.Tie:
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent("-# It's a tie! Your bet has been returned."));
                break;
        }

        if (
            game.state === GameState.Tie ||
            game.state === GameState.PlayerBust ||
            game.state === GameState.PlayerLose ||
            game.state === GameState.PlayerWin
        ) {
            this.cardMap.delete(userId);
        }

        return {
            components: [container],
            flags: [MessageFlags.IsComponentsV2],
            files: [
                {
                    attachment: await drawGame({
                        dealerTurn: game.state === GameState.PlayerTurn ? false : true,
                        userCards: game.playerHand,
                        dealerCards: game.dealerHand
                    }),
                    name: 'blackjack.png'
                }
            ]
        };
    }

    private cardMap = new Map<
        string,
        { state: GameState; messageState: number; wager: number; cards: Card[]; playerHand: Card[]; dealerHand: Card[] }
    >();

    public override events: GargoyleEvent[] = [new GainExperience()];
}

class GainExperience extends GargoyleEvent {
    private lastGainedExperience = new Map<string, number>();
    public override event: keyof ClientEvents = Events.MessageCreate as const;
    public override async execute(client: GargoyleClient, message: Message, ..._args: any[]): Promise<void> {
        if (!message.guildId || message.author.bot) return;
        if (!client.db) return;
        const dbGuild = await client.db.getGuild(message.guildId, { exists: true });

        if (this.lastGainedExperience.has(message.author.id) && Date.now() - this.lastGainedExperience.get(message.author.id)! < 60000) return;

        this.lastGainedExperience.set(message.author.id, Date.now());

        const user = await client.db.getUser(message.author.id, { exists: true });
        if (user.disable_xp_msg) return;

        const economyUser = await client.db.getGuildUser(message.author.id, message.guildId, { exists: true });

        const experienceGained = Math.floor(Math.random() * 10) + 15; // Random experience between 15 and 25

        // Level up
        if (calculateLevel(economyUser.experience) < calculateLevel(economyUser.experience + experienceGained)) {
            if (!dbGuild.experience) {
                return;
            }

            try {
                await message.reply(
                    (await levelUpMessage(message.member!, calculateLevel(economyUser.experience + experienceGained))) as MessageCreateOptions
                );
            } catch (error) {
                client.logger.error('Failed to send level up message:', `${error}`);
            }

            // Pay out level up reward
            user.balance += calculateLevel(economyUser.experience + experienceGained) * 100;
            await client.db.setUser(message.author.id, {
                balance: user.balance
            });
        }

        // Update user experience
        economyUser.experience += experienceGained;
        await client.db.setGuildUser(message.author.id, message.guildId, {
            experience: economyUser.experience
        });
    }
}

async function levelUpMessage(member: GuildMember, newLevel: number) {
    const canvas = new Canvas(800, 200);
    const ctx = canvas.getContext('2d');

    // Draw user avatar as a circle on the left side
    // With 5 px margins on the left, top and bottom
    const avatarSize = 150;
    const avatarX = 5;
    const avatarY = 5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 512 }));
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Draw level up text
    ctx.fillStyle = 'white';
    ctx.font = `${FontWeight.ExtraLight} 32px Montserrat`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    const textX = avatarX + avatarSize + 20;
    const textY = 50;
    ctx.fillText(`Congratulations, you reached level ${newLevel}!`, textX, textY);

    ctx.font = `${FontWeight.ExtraLight} 16px Montserrat`;
    const textY2 = textY + 30;
    ctx.fillText(`Keep chatting to earn more experience and level up!\nYou've earned $${newLevel * 100}!`, textX, textY2);

    const textY3 = 200 - 10;
    ctx.fillText('This message can be disabled with /economy experience user disable', textX, textY3);

    return {
        files: [
            {
                attachment: canvas.toBuffer(),
                name: 'levelup.png'
            }
        ]
    };
}

function calculateLevel(experience: number): number {
    let level = 0;
    if (experience >= 20000) {
        level = 7 + Math.floor((experience - 20000) / 20000);
    } else if (experience >= 10000) level = 6;
    else if (experience >= 4000) level = 5;
    else if (experience >= 2000) level = 4;
    else if (experience >= 1000) level = 3;
    else if (experience >= 400) level = 2;
    else if (experience >= 200) level = 1;

    return level;
}

enum GameState {
    PlayerTurn,
    DealerTurn,
    PlayerLose,
    PlayerBust,
    PlayerWin,
    Tie
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

export type ChattoMove = 'hit' | 'stand' | 'fold';

export function normalizeMove(content: string): ChattoMove | null {
    const c = content.trim().toLowerCase();
    if (c === 'hit' || c === 'h') return 'hit';
    if (c === 'stand' || c === 's') return 'stand';
    if (c === 'fold' || c === 'f' || c === 'forfeit') return 'fold';
    return null;
}

export function awaitMove(client: GargoyleClient, channelId: string, userId: string, ms: number): Promise<ChattoMove | null> {
    return new Promise((resolve) => {
        const chatto = client.chatto;
        if (!chatto) {
            resolve(null);
            return;
        }

        let timer: ReturnType<typeof setTimeout>;

        const cleanup = () => {
            clearTimeout(timer);
            chatto.off('messageCreate', listener);
        };

        const listener = (message: ChattoMessage) => {
            if (message.channelId !== channelId || message.author.id !== userId) return;
            const move = normalizeMove(message.content ?? '');
            if (!move) return;
            cleanup();
            resolve(move);
        };

        timer = setTimeout(() => {
            cleanup();
            resolve(null);
        }, ms);

        chatto.on('messageCreate', listener);
    });
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
};

type Card = {
    suit: Suit;
    value: (typeof CardValue)[keyof typeof CardValue];
};

async function drawGame(options: { dealerTurn?: boolean; userCards: Card[]; dealerCards: Card[] }) {
    const canvas = new Canvas(800, 600);
    const ctx = canvas.getContext('2d');

    // Dealer's cards
    const dealerCardsBuffer = await drawCards(options.dealerCards, options.dealerTurn ? 0 : 1);
    const dealerCards = await loadImage(dealerCardsBuffer);
    ctx.drawImage(dealerCards, 20, 20, dealerCards.width, dealerCards.height);

    // Player's cards
    const cardsBuffer = await drawCards(options.userCards);
    const userCards = await loadImage(cardsBuffer);
    ctx.drawImage(userCards, 20, canvas.height - 230, userCards.width, userCards.height);

    // Flipped card
    const cardBuffer = await drawCards([options.userCards[0]], 1);
    const cardImg = await loadImage(cardBuffer);
    ctx.drawImage(cardImg, canvas.width - cardImg.width - 20, (canvas.height - cardImg.height) / 2, cardImg.width, cardImg.height);

    // Game border
    ctx.roundRect(0, 0, canvas.width, canvas.height, 16);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.stroke();

    return canvas.toBuffer();
}

export async function renderChattoGame(
    game: { state: GameState; wager: number; playerHand: Card[]; dealerHand: Card[] },
    folded: boolean = false
): Promise<{ content: string; files: FileInput[] }> {
    let title: string;
    let footer = '';

    if (folded) {
        title = '# Blackjack — You Folded!';
        footer = `\n-# You folded and got back $${Math.floor(game.wager / 2).toLocaleString()}.`;
    } else {
        switch (game.state) {
            case GameState.PlayerTurn:
                title = '# Blackjack — Your Turn';
                footer = '\nType **hit**, **stand**, or **fold**.';
                break;
            case GameState.DealerTurn:
                title = "# Blackjack — Dealer's Turn";
                break;
            case GameState.PlayerBust:
                title = '# Blackjack — You Busted!';
                footer = `\n-# You lost $${game.wager.toLocaleString()}.`;
                break;
            case GameState.PlayerWin:
                title = '# Blackjack — You Won!';
                footer = `\n-# You won $${(game.wager * 2).toLocaleString()}!`;
                break;
            case GameState.PlayerLose:
                title = '# Blackjack — You Lost!';
                footer = `\n-# You lost $${game.wager.toLocaleString()}.`;
                break;
            case GameState.Tie:
                title = "# Blackjack — It's a Tie!";
                footer = "\n-# It's a tie! Your bet has been returned.";
                break;
            default:
                title = '# Blackjack';
        }
    }

    const inProgress = !folded && (game.state === GameState.PlayerTurn || game.state === GameState.DealerTurn);
    if (!inProgress) footer += '\n-# Run `/blackjack <wager>` to play again.';

    const buffer = await drawGame({
        dealerTurn: !(game.state === GameState.PlayerTurn) || folded,
        userCards: game.playerHand,
        dealerCards: game.dealerHand
    });

    return {
        content: `${title}${footer}`,
        files: [{ data: buffer, filename: 'blackjack.png', contentType: 'image/png' }]
    };
}

async function drawCards(cards: Card[], hiddenCards: number = 0): Promise<Buffer> {
    const width = 150 + (cards.length - 1) * 40;
    const height = 210;
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext('2d');

    // Card background
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.roundRect(0, 0, width, height, 8);
    //ctx.fill();
    ctx.stroke();

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        ctx.roundRect(i * 40, 0, width, height, 8);
        ctx.stroke();
        if (i >= cards.length - hiddenCards) {
            if (i === cards.length - 1) {
                const backImg = await loadImage(`./media/images/outline.png`);
                const aspectRatio = backImg.width / backImg.height;
                const drawWidth = 150 / 2;
                const drawHeight = drawWidth / aspectRatio;
                const x = i * 40 + (150 - drawWidth) / 2;
                const y = (height - drawHeight) / 2;
                ctx.drawImage(backImg, x, y, drawWidth, drawHeight);
            }
        } else {
            ctx.fillStyle = 'white';
            ctx.font = `${FontWeight.ExtraLight} 32px Montserrat`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const iconW = 32;
            const iconH = 32; // 80% of 40x40
            const textX = i * 40 + 8 + iconW / 2;
            const textY = 16 + 32 / 2; // 32 is font size

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
            ctx.drawImage(suitCanvas, i * 40 + 8, 56, iconW, iconH);
        }
    }

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
