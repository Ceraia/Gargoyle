import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleButtonBuilder from '@src/system/backend/builders/gargoyleButtonBuilder.js';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentBuilder,
    InteractionContextType,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    SlashCommandBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
export default class Ping extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommand = new SlashCommandBuilder()
        .setName('entropy')
        .setDescription('Open an entropy application panel')
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM]);

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        await interaction.reply({ content: 'Sending entropy application panel', ephemeral: true });
        await (interaction.channel as TextChannel).send({
            embeds: [new GargoyleEmbedBuilder().setTitle('Entropy Application').setDescription('Gen.4 Entropy. Apply now, you will be notified.')],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new GargoyleButtonBuilder(this, 'apply').setLabel('Apply').setStyle(ButtonStyle.Secondary)
                )
            ]
        });
    }

    public override executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): void {
        if (args[0] === 'apply') {
            interaction.showModal(
                new GargoyleModalBuilder(this, 'application')
                    .setTitle('Entropy Gen.4 Application')
                    .setComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('steam')
                                .setLabel('Steam Account Link')
                                .setPlaceholder('https://steamcommunity.com/id/axodouble')
                                .setMinLength(30)
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('motivation')
                                .setLabel('What is your motivation to join?')
                                .setPlaceholder('Your motivation for joining Entropy Gen.4')
                                .setMinLength(10)
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('position')
                                .setLabel('Desired / Expected Position')
                                .setPlaceholder('Leadership / Volunteer / Officer')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('skills')
                                .setLabel('What are you good at?')
                                .setPlaceholder('Making propaganda, pvp, etc etc...')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                            new TextInputBuilder()
                                .setCustomId('friends')
                                .setLabel('Do you have any friends in Entropy?')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                    )
            );
        }
    }

    public override executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        client.logger.log("Received")
        client.logger.log(JSON.stringify(interaction.toJSON()))
    }
}
