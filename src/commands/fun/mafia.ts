import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
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
 *  - Boss: The leader of the mafia team, can choose someone for the hitmen to eliminate once every night.
 *  - Hitman: The player that will carry out the hit on the target chosen by the Boss.
 *  - Janitor: Cleans up the scene after a hit, preventing the target from their role being revealed.
 *
 * - Townies roles:
 *  - Doctor: Can choose a player to protect from being eliminated during the night.
 *  - Sheriff: Can choose a player to investigate during the night, revealing if they are part of the mafia team.
 *  - Vigilante: Can choose a player to eliminate during the night, but can only do this once per game.
 *  - Jailer: Can lock up a player during the night, preventing them from being eliminated or taking any actions.
 *  - Bodyguard: Can protect a player from being eliminated during the night, but will die if the protected player is targeted.
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
            .setContexts([InteractionContextType.Guild]) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
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

        await response.edit(await this.startMafiaGame(client, interaction.channel, interaction.member as GuildMember));
    }

    public override async executeButtonCommand(_client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
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
        }
    }

    private async startMafiaGame(client: GargoyleClient, channel: TextChannel, host: GuildMember): Promise<MessageEditOptions> {
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
        const newGame = new databaseMafiaGame({ channelId: channel.id, messageId: host.user.id });
        await newGame.save();
        await toggleUserInQueue(channel.id, host.user.id);
        return {
            components: [
                new ContainerBuilder()
                    .setAccentColor(0x647aa3)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            '# New Mafia Game' + '\nThe game has been started successfully!' + `\n-# Hosted by <@!${host.user.id}>`
                        )
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                            new GargoyleButtonBuilder(this, 'join').setStyle(ButtonStyle.Secondary).setLabel('Join Game')
                        )
                    )
            ],
            flags: [MessageFlags.IsComponentsV2]
        };
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

        return {
            components: [
                new ContainerBuilder()
                    .setAccentColor(0x647aa3)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            '# New Mafia Game' +
                                `\nWaiting for the host to start the game and for players to join.` +
                                `\nPlayers (${game.joinQueue.length}/16): ${game.joinQueue.map((userId) => `<@!${userId}>`).join(', ')}` +
                                `\n-# Hosted by <@!${game.host}>`
                        )
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                            new GargoyleButtonBuilder(this, 'join').setStyle(ButtonStyle.Secondary).setLabel('Join Game')
                        )
                    )
            ],
            flags: [MessageFlags.IsComponentsV2]
        };
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
    if (game.joinQueue.includes(userId)) {
        // User is already in the game, remove them
        game.joinQueue = game.joinQueue.filter((id) => id !== userId);
        await game.save();
        return 'USER_LEFT_GAME';
    }
    game.joinQueue.push(userId);
    await game.save();
    return 'USER_JOINED_GAME';
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

const mafiaGameSchema = new Schema({
    channelId: {
        type: String,
        required: true
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
    players: {
        type: [mafiaUserSchema],
        default: []
    },
    joinQueue: {
        type: [String],
        default: []
    }
});

const databaseMafiaGame = model('MafiaGames', mafiaGameSchema);
