import fs from 'fs/promises';
import path from 'path';
import GargoyleClient from '../classes/gargoyleClient.js';
import GargoyleEvent from '../classes/gargoyleEvent.js';

async function registerEvents(client: GargoyleClient, ...dirs: string[]): Promise<void> {
    for (const dir of dirs) {
        const files = await fs.readdir(path.join(__dirname, dir));

        for (const file of files) {
            const stat = await fs.lstat(path.join(__dirname, dir, file));

            if (stat.isDirectory()) {
                await registerEvents(client, path.join(dir, file));
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                try {
                    const { default: Event } = await import(path.join(__dirname, dir, file));
                    const event: GargoyleEvent = new Event();
                    if (event.once) {
                        client.logger.trace(`Registering event as once: ${file}`);
                        client.once(event.event, (...args) => event.execute(client, ...args));
                    } else {
                        client.logger.trace(`Registering event as on: ${file}`);
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
