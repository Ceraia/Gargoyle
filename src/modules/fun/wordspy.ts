import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleContainerBuilder from '@src/system/backend/builders/gargoyleContainerBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import {
    ActionRowBuilder,
    ApplicationIntegrationType,
    ButtonStyle,
    ChatInputCommandInteraction,
    ContainerBuilder,
    GuildMember,
    InteractionContextType,
    InteractionReplyOptions,
    MessageActionRowComponentBuilder,
    MessageFlags,
    SectionBuilder,
    TextDisplayBuilder
} from 'discord.js';

export default class WordSpy extends GargoyleModule {
    public override name: string = 'wordspy';
    public override category: string = 'fun';

    // Keyed by channel ID to manage multiple games
    private wordSpyGames: Map<
        string,
        {
            players: GuildMember[];
            spies: GuildMember[];
            word: string;
            status: WordSpyStatus;
        }
    > = new Map(); // Placeholder for game state management

    public override slashCommands: GargoyleSlashCommandBuilder[] = [
        new GargoyleSlashCommandBuilder()
            .setName('wordspy')
            .setDescription('Play a game of Word Spy with your friends!')
            .setContexts(InteractionContextType.Guild)
            .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
            .addSubcommand((subcommand) => subcommand.setName('start').setDescription('Start a new game of Word Spy'))
            .addSubcommand((subcommand) => subcommand.setName('help').setDescription('Get help about Word Spy')) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'help') {
            await interaction.reply({
                components: [
                    new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            '# Word Spy\n' +
                                'Word Spy is a fun party game, where all players except the spies, are given a word.' +
                                'The spies must try to blend in and figure out what the word is, while the other players try to identify the spies.\n\n' +
                                '## How to Play\n' +
                                '1. Start a game using `/wordspy start`.\n' +
                                '2. Players will be assigned roles (Spy or Non-Spy) and given their words.\n' +
                                '3. Players take turns describing the word without using it directly.\n' +
                                '4. After several rounds, players vote on who they think the spies are.\n' +
                                '5. Spies win by avoiding detection and guessing the word; Non-Spies win by identifying all spies.\n\n' +
                                '## Commands\n' +
                                '- `/wordspy start`: Start a new game of Word Spy.\n' +
                                '- `/wordspy help`: Display this help message.\n\n' +
                                'Enjoy playing Word Spy with your friends!'
                        )
                    )
                ],
                flags: [MessageFlags.IsComponentsV2]
            });
        } else if (interaction.options.getSubcommand() === 'start') {
            if (this.wordSpyGames.has(interaction.channelId)) {
                await interaction.reply({ content: 'A game is already in progress in this channel!', ephemeral: true });
                return;
            }

            // Initialize a new game state (placeholder logic)
            const gameState = {
                players: [],
                spies: [],
                word: 'example',
                status: WordSpyStatus.Waiting
            };
            this.wordSpyGames.set(interaction.channelId, gameState);

            await interaction.reply(this.generateWordSpyMessage(interaction.channelId) as InteractionReplyOptions);
        }
    }

    private generateWordSpyMessage(channelId: string) {
        const game = this.wordSpyGames.get(channelId);
        if (!game) {
            return {
                components: [new GargoyleContainerBuilder('Sorry, this game is not found.')],
                flags: [MessageFlags.IsComponentsV2]
            };
        }

        if (game.status === WordSpyStatus.Waiting) {
            return {
                components: [
                    new ContainerBuilder()
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(
                                        '# Word Spy\n' +
                                            'A new game of Word Spy has started!\n' +
                                            `Players joined: ${game.players.length}\n` +
                                            'There needs to be at least 3 players to start the game.\n' +
                                            'Once enough players have joined, the game can be started!'
                                    )
                                )
                                .setButtonAccessory(
                                    new GargoyleButtonBuilder(this, 'join', channelId)
                                        .setLabel(`Join ${game.players.length}/3+`)
                                        .setStyle(ButtonStyle.Success)
                                )
                        )
                        .addActionRowComponents(
                            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                                new GargoyleButtonBuilder(this, 'start', channelId)
                                    .setLabel('Start Game')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(game.players.length < 3),
                                new GargoyleButtonBuilder(this, 'cancel', channelId).setLabel('Cancel Game').setStyle(ButtonStyle.Danger)
                            )
                        )
                ],
                flags: [MessageFlags.IsComponentsV2]
            };
        }

        return {
            components: [new GargoyleContainerBuilder('Sorry, this game is not found.')],
            flags: [MessageFlags.IsComponentsV2]
        };
    }
}

enum WordSpyStatus {
    Waiting = 'waiting',
    InProgress = 'in_progress',
    Completed = 'completed'
}
