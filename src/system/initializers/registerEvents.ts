import fs from 'fs/promises';
import path from 'path';
import GargoyleClient from '../classes/clientClass.js';

async function registerEvents(client: GargoyleClient, ...dirs: string[]) {
    client.debug('Beginning event registration...');
    for (const dir of dirs) {
        const files = await fs.readdir(path.join(__dirname, dir));
        client.debug(`Loading events from ${dir}...`);

        for (const file of files) {
            client.debug(`Loading file: ${file}`);
            const stat = await fs.lstat(path.join(__dirname, dir, file));

            if (file.includes('-ignore')) continue;

            if (stat.isDirectory()) {
                client.debug(`Loading events from ${file}...`);
                await registerEvents(client, path.join(dir, file));
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const eventName = file.substring(0, file.indexOf('.ts') || file.indexOf('.js'));
                try {
                    const eventModule = (await import(path.join(__dirname, dir, file)))
                    client.on(eventName, eventModule.default.bind(null, client));
                } catch (e) {
                    client.error(e as string);
                }
            }
        }
    }
}

export default registerEvents;
