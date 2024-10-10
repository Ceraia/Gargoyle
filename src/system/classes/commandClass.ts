import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import GargoyleClient from "./clientClass.js";
import TextCommandBuilder from "@src/system/builders/textCommandBuilder.js";

abstract class GargoyleCommand {
	public category: string;
	public slashCommand?: SlashCommandBuilder;
	public textCommand?: TextCommandBuilder;

	constructor(category: string, slashCommand?: SlashCommandBuilder, textCommand?: TextCommandBuilder) {
		this.category = category;
		this.slashCommand = slashCommand;
		this.textCommand = textCommand;

		if (!this.slashCommand && !this.textCommand) {
			throw new Error("Command must have a slashCommand or textCommand property");
		}

		if (!this.category) {
			throw new Error("Command must have a category property");
		}
	}

	public abstract executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): void;
	public abstract executeTextCommand(client: GargoyleClient, message: Message): void;
}

export default GargoyleCommand;
