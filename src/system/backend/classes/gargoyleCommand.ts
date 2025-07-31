import {
    AnySelectMenuInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
    ContextMenuCommandInteraction,
    Message,
    MessageContextMenuCommandInteraction,
    MessageFlags,
    ModalSubmitInteraction,
    UserContextMenuCommandInteraction
} from 'discord.js';
import GargoyleClient from './gargoyleClient.js';
import GargoyleTextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleEvent from './gargoyleEvent.js';
import GargoyleSlashCommandBuilder from '../builders/gargoyleSlashCommandBuilder.js';

abstract class GargoyleCommand {
    public abstract category: string;
    /**
     * @deprecated
     * In favor of using slashCommands instead to allow multiple slash commands in a file.
     */
    public slashCommand: GargoyleSlashCommandBuilder | null = null;
    public slashCommands: GargoyleSlashCommandBuilder[] = [];
    /**
     * @deprecated
     * In favor of using slashCommands instead to allow multiple slash commands in a file.
     */
    public textCommand: GargoyleTextCommandBuilder | null = null;
    /**
     * @deprecated
     * Due to a recent mail exchange with Discord, textcommands are explicitly denied for intent approval.
     */
    public textCommands: GargoyleTextCommandBuilder[] = [];
    public contextCommands: ContextMenuCommandBuilder[] | null = null;
    public events: GargoyleEvent[] = [];

    /**
     * @deprecated
     * In favor of using the gargoyle guild declaration specific to commands.
     */
    public guild: string | null = null;

    public executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): void {
        client.logger.error(`${interaction.commandName} does not have a slash command implementation.`);
        interaction.reply({ content: 'This command does not have a slash command implementation.', flags: MessageFlags.Ephemeral });
    }
    public executeTextCommand(client: GargoyleClient, message: Message, ..._args: string[]): void {
        client.logger.error(`${message.content} does not have a text command implementation.`);
        message.reply({ content: 'This command does not have a text command implementation.' }).then((message) => {
            setTimeout(() => {
                message.delete();
            }, 5000);
        });
    }
    public executeContextMenuCommand(
        client: GargoyleClient,
        interaction: ContextMenuCommandInteraction | UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction
    ) {
        client.logger.error(`${interaction.commandName} does not have a context menu command implementation.`);
        interaction.reply({ content: 'This command does not have a context menu command implementation.', flags: MessageFlags.Ephemeral });
    }
    public executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): void {
        client.logger.error(`${interaction.customId} with argument ${args} does not have a button command implementation.`);
        interaction.reply({ content: 'This command does not have a button command implementation.', flags: MessageFlags.Ephemeral });
    }
    public executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): void {
        client.logger.error(`${interaction.customId} with argument ${args} does not have a select menu command implementation.`);
        interaction.reply({ content: 'This command does not have a select menu command implementation.', flags: MessageFlags.Ephemeral });
    }
    public executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        client.logger.error(`${interaction.customId} with argument ${args} does not have a modal command implementation.`);
        interaction.reply({ content: 'This command does not have a modal command implementation.', flags: MessageFlags.Ephemeral });
    }
    public executeApiRequest(_client: GargoyleClient, _request: Request): Promise<Response> {
        return Promise.resolve(new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } }));
    }
}

export default GargoyleCommand;
