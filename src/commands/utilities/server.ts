import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import { sendAsServer } from '@src/system/backend/tools/server.js';
import {
    ActionRowBuilder,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
    InteractionContextType,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';

export default class Server extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommand = new SlashCommandBuilder()
        .setName('server')
        .setDescription('Server / community commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((subcommand) => subcommand.setName('message').setDescription('Send a message as the server'))
        .setContexts([InteractionContextType.Guild]) as SlashCommandBuilder;
    public override contextCommands = [
        new ContextMenuCommandBuilder()
            .setContexts(InteractionContextType.Guild)
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .setType(ApplicationCommandType.Message)
            .setName('Edit Server Message')
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === 'message') {
            await interaction.showModal(
                new GargoyleModalBuilder(this, 'message')
                    .setTitle('Send a message as the server')
                    .setComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId('message')
                                .setLabel('Message')
                                .setPlaceholder('Enter your message here')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        )
                    )
            );
        }
    }

    public override executeModalCommand(_client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        if (args[0] === 'message') {
            interaction.reply({ content: 'Sending message, one moment...', flags: MessageFlags.Ephemeral });
            sendAsServer({ content: interaction.fields.getTextInputValue('message') }, interaction.channel as TextChannel);
        }
    }
}
