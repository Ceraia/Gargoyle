import fs from 'fs/promises';
import path from 'path';
import GargoyleClient from '../classes/gargoyleClient.js';
import GargoyleEvent from '../classes/gargoyleEvent.js';

async function registerEvents(client: GargoyleClient, ...dirs: string[]): Promise<void> {
    for (const dir of dirs) {
        const files = await fs.readdir(path.join(__dirname, dir)).catch((err) => {
            client.logger.error(`Error reading directory: ${dir}`, err as string);
            return [];
        });

        for (const file of files) {
            const stat = await fs.lstat(path.join(__dirname, dir, file));

            if (stat.isDirectory()) {
                await registerEvents(client, path.join(dir, file));
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                try {
                    const { default: Event } = await import(path.join(__dirname, dir, file));
                    const event: GargoyleEvent = new Event();
                    if (event.once) {
                        client.logger.debug(`Registering event as ${event.event} once: ${file}`);
                        client.once(event.event, (...args) => event.execute(client, ...args));
                    } else {
                        client.logger.debug(`Registering event as ${event.event} on: ${file}`);
                        client.on(event.event, (...args) => event.execute(client, ...args));
                    }
                } catch (err) {
                    client.logger.error(err as string, `Error registering event: ${file}`);
                }
            }
        }
    }
}

export default registerEvents;
