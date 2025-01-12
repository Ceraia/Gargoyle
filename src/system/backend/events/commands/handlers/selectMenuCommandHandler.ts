import GargoyleClient from "@src/system/backend/classes/gargoyleClient.js";
import GargoyleEvent from "@src/system/backend/classes/gargoyleEvent.js";
import { AnySelectMenuInteraction } from "discord.js";

export default class SelectCommandHandler extends GargoyleEvent {
    public event = "interactionCreate" as const;

    public execute(client: GargoyleClient, interaction: AnySelectMenuInteraction): void {
        if (!interaction.isAnySelectMenu()) return;

        const origin = interaction.customId.toLowerCase().split("-")[1];

        const command = client.commands.find((command) => {
            return (
                command.slashCommand?.name === origin ||
                command.slashCommands.find((slashCommand) => {
                    return slashCommand.name === origin;
                }) ||
                command.textCommand?.name === origin ||
                command.textCommands.find((textCommand) => {
                    return textCommand.name === origin;
                })
            );
        });

        if (!command) {
            interaction.reply("Select menu not found!").then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        } else {
            const args = interaction.customId.toLowerCase().split("-").slice(2);
            command.executeSelectMenuCommand(client, interaction, ...args);
            return client.logger.trace(`${interaction.user} used the ${interaction.customId} select menu command.`);
        }
    }
}
