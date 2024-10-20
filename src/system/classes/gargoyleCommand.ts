import {
    AnySelectMenuInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Message,
    ModalSubmitInteraction,
    SlashCommandBuilder
} from 'discord.js';
import GargoyleClient from './gargoyleClient.js';
import TextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';

abstract class GargoyleCommand {
    public abstract category: string;
    public slashCommand: SlashCommandBuilder | null = null;
    public textCommand: TextCommandBuilder | null = null;
    public guild: string | null = null;

    public executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): void {
        client.logger.error(`${interaction.commandName} does not have a slash command implementation.`);
        interaction.reply({ content: 'This command does not have a slash command implementation.', ephemeral: true });
    }
    public executeTextCommand(client: GargoyleClient, message: Message): void {
        client.logger.error(`${message.content} does not have a text command implementation.`);
        message.reply({ content: 'This command does not have a text command implementation.' }).then((message) => {
            setTimeout(() => {
                message.delete();
            }, 5000);
        });
    }
    public executeButtonCommand(client: GargoyleClient, interaction: ButtonInteraction, ...args: string[]): void {
        client.logger.error(`${interaction.customId} with argument ${args} does not have a button command implementation.`);
        interaction.reply({ content: 'This command does not have a button command implementation.', ephemeral: true });
    }
    public executeSelectMenuCommand(client: GargoyleClient, interaction: AnySelectMenuInteraction, ...args: string[]): void {
        client.logger.error(`${interaction.customId} with argument ${args} does not have a select menu command implementation.`);
        interaction.reply({ content: 'This command does not have a select menu command implementation.', ephemeral: true });
    }
    public executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        client.logger.error(`${interaction.customId} with argument ${args} does not have a modal command implementation.`);
        interaction.reply({ content: 'This command does not have a modal command implementation.', ephemeral: true });
    }
}

export default GargoyleCommand;
