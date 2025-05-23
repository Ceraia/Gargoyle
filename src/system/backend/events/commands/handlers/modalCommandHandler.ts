import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ModalSubmitInteraction } from 'discord.js';

export default class ModalCommandHandler extends GargoyleEvent {
    public event = 'interactionCreate' as const;

    public execute(client: GargoyleClient, interaction: ModalSubmitInteraction): void {
        if (!interaction.isModalSubmit()) return;
        if (interaction.user.bot) return;

        const origin = interaction.customId.toLowerCase().split('-')[1];

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
            client.logger.warning(`${interaction.user} used the ${interaction.customId} not found`);
            interaction.reply('Modal not found!').then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        } else {
            const args = interaction.customId.toLowerCase().split('-').slice(2);
            command.executeModalCommand(client, interaction, ...args);
            return client.logger.trace(`${interaction.user} used the ${interaction.customId} modal command.`);
        }
    }
}
