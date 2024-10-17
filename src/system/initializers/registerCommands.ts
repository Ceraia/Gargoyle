import GargoyleClient from '../classes/gargoyleClient.js';

async function registerCommands(client: GargoyleClient): Promise<void> {
    await client.application?.commands.fetch().then((commands) => {
        commands.forEach(async (command) => {
            if (!client.commands.find((c) => c.slashCommand?.name === command.name)) {
                client.logger.trace(`Deleting command: ${command.name}`);
                await client.application?.commands.delete(command);
            }
        });
    });

    await client.commands.forEach(async (command) => {
        if (command.slashCommand) {
            client.logger.trace(`Registering slash command: ${command.slashCommand.name}`);
            await client.application?.commands.create(command.slashCommand);
        }
    });
}

export default registerCommands;
