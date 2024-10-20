import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/classes/gargoyleEvent.js';
import { AnySelectMenuInteraction } from 'discord.js';

export default class SelectCommandHandler extends GargoyleEvent {
    public event = 'interactionCreate' as const;

    public execute(client: GargoyleClient, interaction: AnySelectMenuInteraction): void {
        if (!interaction.isAnySelectMenu()) return;

        const command = client.commands.find((command) => {
            return (
                command.slashCommand?.name === interaction.customId.toLowerCase().split('-')[1] ||
                command.textCommand?.name === interaction.customId.toLowerCase().split('-')[1]
            );
        });

        if (!command) {
            interaction.reply('Select menu not found!').then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        } else {
            const argument = interaction.customId.toLowerCase().split('-')[2];
            command.executeSelectMenuCommand(client, argument, interaction);
            return client.logger.trace(`${interaction.user} used the ${interaction.customId} select menu command.`);
        }
    }
}
