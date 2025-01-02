import fs from 'fs/promises';
import path from 'path';
import GargoyleClient from '../classes/gargoyleClient.js';
import GargoyleCommand from '../classes/gargoyleCommand.js';

async function loadCommands(client: GargoyleClient, ...dirs: string[]): Promise<void> {
    for (const dir of dirs) {
        const files = await fs.readdir(path.join(__dirname, dir)).catch((err) => {
            client.logger.error(`Error reading directory: ${dir}`, err as string);
            return [];
        });

        for (const file of files) {
            const stat = await fs.lstat(path.join(__dirname, dir, file));

            if (stat.isDirectory()) {
                await loadCommands(client, path.join(dir, file));
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                try {
                    const { default: Command } = await import(path.join(__dirname, dir, file));
                    const command: GargoyleCommand = new Command();
                    if (command.slashCommand || command.textCommand) {
                        client.logger.debug(`Registering command: ${command.slashCommand?.name ?? command.textCommand?.name}`);
                        client.commands.push(command);
                    }
                    command.events.forEach((event) => {
                        if (event.once) {
                            client.logger.debug(`Registering command event as ${event.event} once: ${file}`);
                            client.once(event.event, (...args) => event.execute(client, ...args));
                        } else {
                            client.logger.debug(`Registering command event as ${event.event} on: ${file}`);
                            client.on(event.event, (...args) => event.execute(client, ...args));
                        }
                    });
                } catch (err) {
                    client.logger.error(err as string, `Error registering command: ${file}`);
                }
            }
        }
    }
}

export default loadCommands;
