import fs from 'fs/promises';
import path from 'path';
import GargoyleClient from '../classes/gargoyleClient.js';
import GargoyleEvent from '../classes/gargoyleEvent.js';

async function registerEvents(client: GargoyleClient, ...dirs: string[]) {
    client.logger.debug('Beginning event registration...');
    for (const dir of dirs) {
        const files = await fs.readdir(path.join(__dirname, dir));

        for (const file of files) {
            const stat = await fs.lstat(path.join(__dirname, dir, file));

            if (stat.isDirectory()) {
                client.logger.trace(`Loading events from ${file}...`);
                await registerEvents(client, path.join(dir, file));
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const { default: Event } = await import(path.join(__dirname, dir, file));
                const event: GargoyleEvent = new Event();
                if (event.once) {
                    client.logger.trace(`Registering event as once: ${event.event}`);
                    client.once(event.event, (...args) => event.execute(client, ...args));
                } else {
                    client.logger.trace(`Registering event as on: ${event.event}`);
                    client.on(event.event, (...args) => event.execute(client, ...args));
                }
            }
        }
    }
}

export default registerEvents;
