import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import { GargoyleUserSelectMenuBuilder } from '@src/system/backend/builders/gargoyleSelectMenuBuilders.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import {
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ContainerBuilder,
    GuildMember,
    InteractionContextType,
    MessageActionRowComponentBuilder,
    MessageEditOptions,
    MessageFlags,
    PermissionFlagsBits,
    SectionBuilder,
    TextChannel,
    TextDisplayBuilder
} from 'discord.js';
import { model, Schema } from 'mongoose';

/**
 * --- INTERNAL DOCUMENTATION ---
 * This is the internal documentation for the idea of how the Mafia game shoud be structured.
 *
 * The game will have at least 2 modes, a speed mode and a realistic mode:
 * - Speed mode will be a quick game that will go as fast as the users play it.
 * - Realistic mode will let users select a timezone, and then the game will progress in real time.
 *
 * The game will have 2 teams:
 * - Mafia team: The team that tries to eliminate the townies.
 * - Townies team: The team that tries to survive, and eliminate the mafia team.
 *
 * The game will have a day and night cycle:
 * - During the day, users can vote to eliminate a player.
 * - During the night, the mafia team can choose a player to eliminate.
 *
 * The game will have two sets of roles, one for the mafia team and one for the townies team:
 * - Mafia roles:
 *  - Boss (Only 1 allowed): The leader of the mafia team, can choose someone for the hitmen to eliminate once every night.
 *  - Hitman (Only 2 allowed): The player that will carry out the hit on the target chosen by the Boss.
 *  - Janitor (Only 1 allowed): Cleans up the scene after a hit, preventing the target from their role being revealed.
 *
 * - Townies roles:
 *  - Sheriff (Only 1 allowed): Can choose a player to investigate during the night, revealing if they are part of the mafia team.
 *  - Doctor (Only 1 allowed): Can choose a player to protect from being eliminated during the night.
 *  - Jailer (Only 1 allowed): Can lock up a player during the night, preventing them from being eliminated or taking any actions.
 *  - Bodyguard (Only 1 allowed): Can protect a player from being eliminated during the night, but will die if the protected player is targeted.
 *  - Vigilante (Only 1 allowed): Can choose a player to eliminate dur *  - Vigilante (Only 1 allowed): Can choose a player to eliminate during the night, but can only do this once per game.ing the night, but can only do this once per game.
 *  - Townie: The regular player with no special abilities.
 *
 * - Townies (extra) roles:
 *  - Village Idiot: Always required to vote yes to lynch a player.
 *
 */

export default class Fun extends GargoyleCommand {
    public override category: string = 'fun';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('mafia')
            .setDescription('Play a game of Mafia')
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('start')
                    .setDescription('Start a new game of Mafia')
                    .addStringOption((option) =>
                        option
                            .setName('mode')
                            .setDescription('The mode of the game')
                            .setChoices({ name: 'speed', value: 'speed' }, { name: 'realistic', value: 'realistic' })
                    )
            )
            .addSubcommand((subcommand) => subcommand.setName('fix').setDescription('Fix a mafia game that is stuck'))
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'fix') {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            const existingGame = await databaseMafiaGame.findOne({ channelId: interaction.channelId });
            if (!existingGame) {
                await interaction.reply({ content: 'There is no game running in this channel.', flags: MessageFlags.Ephemeral });
                return;
            }
            await databaseMafiaGame.deleteOne({ channelId: interaction.channelId });
            await interaction.reply({ content: 'The existing game has been deleted. You can now start a new game.', flags: MessageFlags.Ephemeral });
        } else if (interaction.options.getSubcommand() === 'start') {
            if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
                await interaction.reply({ content: 'This command can only be used in chat channel in a server.', flags: MessageFlags.Ephemeral });
                return;
            }

            const response = await interaction.reply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0x647aa3)
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# New Mafia Game' + '\nLoading backend...'))
                ],
                flags: [MessageFlags.IsComponentsV2]
            });

            await response.edit(
                await this.initMafiaGame(
                    client,
                    interaction.channel,
                    interaction.member as GuildMember,
                    interaction.options.getString('mode') || 'speed'
                )
            );
        }
    }

    public override async executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        if (args[0] === 'join') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const result = await toggleUserInQueue(interaction.channel!.id, interaction.user.id);
            if (result === 'GAME_NOT_FOUND') {
                await interaction.editReply({
                    content: 'There is no game running in this channel.'
                });
            } else if (result === 'GAME_ALREADY_STARTED') {
                await interaction.editReply({
                    content: 'The game has already started, you cannot join now.'
                });
            } else if (result === 'USER_JOINED_GAME') {
                await interaction.editReply({
                    content: `You have joined the game! Wait for it to start.`
                });
            } else if (result === 'USER_LEFT_GAME') {
                await interaction.editReply({
                    content: `You have left the game.`
                });
            }

            await interaction.message.edit((await this.updateMafiaGameMessage(interaction.channel as TextChannel)) as MessageEditOptions);
        } else if (args[0] === 'start') {
            await interaction.deferUpdate();
            const game = await databaseMafiaGame.findOne({ channelId: interaction.channel!.id });
            if (!game) {
                await interaction.editReply({
                    content: 'There is no game running in this channel.'
                });
                return;
            }
            if (game.status !== 'waiting') {
                await interaction.editReply({
                    content: 'The game has already started, you cannot start it again.'
                });
                return;
            }
            if (game.joinQueue.length < 4) {
                await interaction.editReply({
                    content: 'Not enough players to start the game. At least 4 players are required.'
                });
                return;
            }

            const assignedRoles = await assignRoles(game.channelId);

            game.status = 'in-progress';
            await game.save();

            await interaction.message.edit((await this.updateMafiaGameMessage(interaction.channel as TextChannel)) as MessageEditOptions);
        } else if (args[0] === 'enddiscuss') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const game = await databaseMafiaGame.findOne({ channelId: interaction.channel!.id });
            if (!game) {
                await interaction.editReply({
                    content: 'There is no game running in this channel.'
                });
                return;
            }
            if (game.status !== 'in-progress' || game.substatus !== 'discussing') {
                await interaction.editReply({
                    content: 'The game is not in the discussion phase.'
                });
                return;
            }

            // Check if the user has already voted to end discussion
            if (game.votedToEndDiscussion.includes(interaction.user.id)) {
                game.votedToEndDiscussion = game.votedToEndDiscussion.filter((id) => id !== interaction.user.id);
                await game.save();
                await interaction.message.edit((await this.updateMafiaGameMessage(interaction.channel as TextChannel)) as MessageEditOptions);
                await interaction.editReply({
                    content: 'You have removed your vote to end the discussion.'
                });
                return;
            }

            game.votedToEndDiscussion.push(interaction.user.id);
            await game.save();

            // Check if enough players have voted to end discussion
            const requiredVotes = Math.ceil(game.players.length / 2.5);
            if (game.votedToEndDiscussion.length >= requiredVotes) {
                game.substatus = 'voting';
                game.votedToEndDiscussion = [];
                await game.save();
                await interaction.message.edit((await this.updateMafiaGameMessage(interaction.channel as TextChannel)) as MessageEditOptions);
            } else {
                await interaction.message.edit((await this.updateMafiaGameMessage(interaction.channel as TextChannel)) as MessageEditOptions);
                await interaction.editReply({
                    content: `You have voted to end the discussion. (${game.votedToEndDiscussion.length}/${requiredVotes})`
                });
            }
        }
    }

    private async initMafiaGame(client: GargoyleClient, channel: TextChannel, host: GuildMember, gameMode: string): Promise<MessageEditOptions> {
        if (!client.db) {
            return {
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0x647aa3)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# New Mafia Game' + '\nThe database is not connected, please try again later.')
                        )
                ],
                flags: [MessageFlags.IsComponentsV2]
            };
        }
        const existingGame = await databaseMafiaGame.findOne({ channelId: channel.id });
        if (existingGame) {
            return {
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0x647aa3)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# New Mafia Game' + '\nThere is already a game running in this channel.')
                        )
                ],
                flags: [MessageFlags.IsComponentsV2]
            };
        }
        const newGame = new databaseMafiaGame({ channelId: channel.id, host: host.user.id, gameMode: gameMode });
        await newGame.save();
        await toggleUserInQueue(channel.id, host.user.id);
        return (await this.updateMafiaGameMessage(channel)) as MessageEditOptions;
    }

    private async updateMafiaGameMessage(channel: TextChannel) {
        const game = await databaseMafiaGame.findOne({ channelId: channel.id });
        if (!game) {
            return {
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0x647aa3)
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Mafia Game' + '\nNo game found in this channel.'))
                ],
                flags: [MessageFlags.IsComponentsV2]
            };
        }

        if (game.status === 'waiting') {
            return {
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0x647aa3)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `# New Mafia Game` +
                                    `\nWaiting for the host to start the game and for players to join.` +
                                    `\nPlayers (${game.joinQueue.length}/16): ${game.joinQueue.map((userId) => `<@!${userId}>`).join(', ')}` +
                                    `\n-# Hosted by <@!${game.host}>`
                            )
                        )
                        .addActionRowComponents(
                            new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                                new GargoyleButtonBuilder(this, 'join').setStyle(ButtonStyle.Secondary).setLabel('Join Game'),
                                new GargoyleButtonBuilder(this, 'start')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel('Start Game')
                                    .setDisabled(game.joinQueue.length < 4)
                            )
                        )
                ],
                flags: [MessageFlags.IsComponentsV2]
            } as MessageEditOptions;
        } else if (game.status === 'in-progress') {
            if (game.substatus == 'discussing') {
                return {
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(0x647aa3)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `# Discussions` +
                                        `\nPlayers: ${game.players.length}/16` +
                                        `\nGame Mode: ${game.gameMode}` +
                                        `\nStatus: In Progress` +
                                        `\nPlayers:` +
                                        `\n${game.players.map((player) => `<@!${player.userId}> - ${player.role}${player.alive ? '' : ' (Dead)'}`).join('\n')}` +
                                        `\n-# Hosted by <@!${game.host}>`
                                )
                            )
                            .addActionRowComponents(
                                new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                                    new GargoyleButtonBuilder(this, 'enddiscuss')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setLabel(`End Discussions (${game.votedToEndDiscussion.length}/${(game.players.length / 2.5).toFixed(0)})`),
                                    new GargoyleButtonBuilder(this, 'actions').setStyle(ButtonStyle.Secondary).setLabel('Actions').setDisabled(true)
                                )
                            )
                    ],
                    flags: [MessageFlags.IsComponentsV2]
                } as MessageEditOptions;
            } else if (game.substatus == 'voting') {
                return {
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(0x647aa3)
                            .addSectionComponents(
                                new SectionBuilder()
                                    .setButtonAccessory(
                                        new GargoyleButtonBuilder(this, 'endvote')
                                            .setStyle(ButtonStyle.Secondary)
                                            .setLabel(`End Voting (${game.votedToEndVote.length}/${(game.players.length / 1.5).toFixed(0)})`)
                                    )
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder().setContent(
                                            `# Voting` +
                                                `\nPlayers: ${game.players.length}/16` +
                                                `\nGame Mode: ${game.gameMode}` +
                                                `\nStatus: In Progress` +
                                                `\nPlayers:` +
                                                `\n${game.players.map((player) => `<@!${player.userId}> - ${player.role}${player.alive ? '' : ' (Dead)'}`).join('\n')}` +
                                                `\n-# Hosted by <@!${game.host}>`
                                        )
                                    )
                            )
                            .addActionRowComponents(
                                new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                                    new GargoyleUserSelectMenuBuilder(this, 'vote')
                                        .setMinValues(1)
                                        .setMaxValues(1)
                                        .setPlaceholder('Vote for a player to eliminate')
                                        .addDefaultUsers(game.players.map((player) => player.userId) as string[])
                                )
                            )
                    ],
                    flags: [MessageFlags.IsComponentsV2]
                } as MessageEditOptions;
            }
        }
    }
}

async function toggleUserInQueue(channelId: string, userId: string) {
    const game = await databaseMafiaGame.findOne({ channelId });
    if (!game) {
        return 'GAME_NOT_FOUND';
    }
    if (game.status !== 'waiting') {
        return 'GAME_ALREADY_STARTED';
    }
    // if (game.joinQueue.includes(userId)) { // UNCOMMENT THIS LATER THIS IS TO TEST SINGLEHANDEDLY
    //     // User is already in the game, remove them
    //     game.joinQueue = game.joinQueue.filter((id) => id !== userId);
    //     await game.save();
    //     return 'USER_LEFT_GAME';
    // }
    game.joinQueue.push(userId);
    await game.save();
    return 'USER_JOINED_GAME';
}

async function assignRoles(channelId: string) {
    const game = await databaseMafiaGame.findOne({ channelId });
    if (!game || game.status == 'in-progress') {
        return 'GAME_IN_PROGRESS';
    }
    if (game.players.length > 16) {
        return 'TOO_MANY_PLAYERS';
    }

    // Randomize player list
    const playerlist = game.joinQueue.sort(() => Math.random() - 0.5);

    console.log(`Assigning roles for ${playerlist.length} players in channel ${channelId}`);

    // 25% of players will be mafia
    const mafiaCount = Math.floor(playerlist.length / 4);
    const townieCount = playerlist.length - mafiaCount;

    game.players.splice(0); // Reset players array

    for (let i = 0; i < mafiaCount; i++) {
        // Split mafia roles, so there is 1 boss, 2 hitmen and 1 janitor
        if (i >= playerlist.length) break; // Prevent out of bounds
        const userId = playerlist[i];
        if (i === 0) {
            game.players.push({ userId, role: MafiaRoles.Boss });
        } else if (i < 3) {
            game.players.push({ userId, role: MafiaRoles.Hitman });
        } else {
            game.players.push({ userId, role: MafiaRoles.Janitor });
        }
    }

    for (let i = 0; i < townieCount; i++) {
        if (i >= playerlist.length) break; // Prevent out of bounds
        const userId = playerlist[i + mafiaCount];
        const role = i > Object.values(TownieRoles).length ? TownieRoles.Townie : Object.values(TownieRoles)[i];
        game.players.push({ userId: userId, role: role, alive: true });
    }

    await game.save();
    return 'ROLES_ASSIGNED';
}

enum MafiaRoles {
    Boss = 'Boss',
    Hitman = 'Hitman',
    Janitor = 'Janitor'
}

enum TownieRoles {
    Sheriff = 'Sheriff',
    Doctor = 'Doctor',
    Jailer = 'Jailer',
    Bodyguard = 'Bodyguard',
    Vigilante = 'Vigilante',
    VillageIdiot = 'Village Idiot',
    Townie = 'Townie'
}

const mafiaUserSchema = new Schema(
    {
        userId: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: false
        },
        alive: {
            type: Boolean,
            default: true
        }
    },
    { _id: false }
);

const mafiaUserVoteSchema = new Schema(
    {
        userId: {
            type: String,
            required: true
        },
        vote: {
            type: String,
            required: true
        }
    },
    { _id: false }
);

const mafiaGameSchema = new Schema({
    channelId: {
        type: String,
        required: true
    },
    gameMode: {
        type: String,
        enum: ['speed', 'realistic'],
        default: 'speed'
    },
    host: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['waiting', 'in-progress', 'finished'],
        default: 'waiting'
    },
    substatus: {
        type: String,
        enum: ['discussing', 'voting', 'nighttime'],
        default: 'discussing'
    },
    players: {
        type: [mafiaUserSchema],
        default: []
    },
    votedToEndDiscussion: {
        type: [String],
        default: []
    },
    votedToEndVote: {
        type: [String],
        default: []
    },
    playerVotes: {
        type: [mafiaUserVoteSchema],
        default: []
    },
    joinQueue: {
        type: [String],
        default: []
    }
});

const databaseMafiaGame = model('MafiaGames', mafiaGameSchema);
