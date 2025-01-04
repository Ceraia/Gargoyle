import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ContextMenuCommandInteraction } from 'discord.js';

export default class ContextCommandHandler extends GargoyleEvent {
    public event = 'interactionCreate' as const;

    public execute(client: GargoyleClient, interaction: ContextMenuCommandInteraction): void {
        if (!interaction.isContextMenuCommand) return;
        if (interaction.user.bot) return;

        const command = client.commands.find((command) => {
            return command.contextCommands?.find((contextCommand) => contextCommand.name === interaction.command?.name);
        });

        if (!command) {
            interaction.reply('Context command not found!').then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        } else {
            command.executeContextMenuCommand(client, interaction);
            return client.logger.trace(`${interaction.user} used the ${interaction.commandName} context command.`);
        }
    }
}
