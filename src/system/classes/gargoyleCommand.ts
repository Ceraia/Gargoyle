import { ButtonInteraction, ChatInputCommandInteraction, Message, SlashCommandBuilder } from 'discord.js';
import GargoyleClient from './gargoyleClient.js';
import TextCommandBuilder from '@src/system/builders/textCommandBuilder.js';

abstract class GargoyleCommand {
    public abstract category: string;
    public abstract slashCommand: SlashCommandBuilder | null;
    public abstract textCommand: TextCommandBuilder | null;

    public abstract executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): void;
    public abstract executeTextCommand(client: GargoyleClient, message: Message): void;
    public executeButtonCommand(_client: GargoyleClient, _argument: string, _interaction: ButtonInteraction): void {
        throw new Error('Button commands are not implemented for this command.');
    }
}

export default GargoyleCommand;
