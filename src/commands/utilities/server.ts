import TextCommandBuilder from "@src/system/backend/builders/gargoyleTextCommandBuilder.js";
import GargoyleCommand from "@src/system/backend/classes/gargoyleCommand.js";
import { ApplicationCommandType, ContextMenuCommandBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBooleanOption, SlashCommandBuilder } from "discord.js";

export default class Server extends GargoyleCommand {
    public override category: string = 'utilities';
    public override slashCommand = new SlashCommandBuilder()
        .setName('server')
        .setDescription('Server / community commands')
        .setContexts([InteractionContextType.Guild]);
    public override contextCommands = new ContextMenuCommandBuilder()
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setType(ApplicationCommandType.Message)
        .setName('Edit Server Message');

}