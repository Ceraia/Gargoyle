import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from 'discord.js';

export default class ContextCommandHandler extends GargoyleEvent {
    public event = 'interactionCreate' as const;

    public execute(
        client: GargoyleClient,
        interaction: ContextMenuCommandInteraction | UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction
    ): void {
        if (!interaction.isContextMenuCommand()) return;
        if (interaction.user.bot) return;

        const command = client.commands.find((command) =>
            command.contextCommands?.find((contextCommand) => contextCommand.name === interaction.commandName)
        );

        if (!command) {
            client.logger.error(`Context command not found: ${interaction.commandName}`);
            interaction
                .reply('Context command not found!')
                .then((msg) => {
                    setTimeout(() => {
                        msg.delete();
                    }, 5000);
                })
                .catch(() => {
                    client.logger.error('Failed to send context command not found message.');
                });

            client.logger.warning(`Command not found: ${interaction.commandName}, deleting command.`);
            interaction.command?.delete();
        } else {
            command.executeContextMenuCommand(client, interaction);
            return client.logger.trace(`${interaction.user} used the ${interaction.commandName} context command.`);
        }
    }
}
