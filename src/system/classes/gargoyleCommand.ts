import { AnySelectMenuInteraction, ButtonInteraction, ChatInputCommandInteraction, Message, SlashCommandBuilder } from 'discord.js';
import GargoyleClient from './gargoyleClient.js';
import TextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';

abstract class GargoyleCommand {
    public abstract category: string;
    public slashCommand: SlashCommandBuilder | null = null;
    public textCommand: TextCommandBuilder | null = null;

    public executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): void {
        client.logger.error(`${interaction.commandName} does not have a slash command implementation.`);
    }
    public executeTextCommand(client: GargoyleClient, message: Message): void {
        client.logger.error(`${message.content} does not have a text command implementation.`);
    }
    public executeButtonCommand(client: GargoyleClient, argument: string, interaction: ButtonInteraction): void {
        client.logger.error(`${interaction.customId} with argument ${argument} does not have a button command implementation.`);
    }
    public executeSelectMenuCommand(client: GargoyleClient, argument: string, interaction: AnySelectMenuInteraction): void {
        client.logger.error(`${interaction.customId} with argument ${argument} does not have a select menu command implementation.`);
    }
}

export default GargoyleCommand;
