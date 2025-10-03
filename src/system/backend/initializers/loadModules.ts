import fs from 'fs/promises';
import path from 'path';
import GargoyleClient from '../classes/gargoyleClient.js';
import GargoyleModule from '../classes/gargoyleModule.js';

async function loadModules(client: GargoyleClient, ...dirs: string[]): Promise<void> {
    for (const dir of dirs) {
        const files = await fs.readdir(path.join(__dirname, dir)).catch((err) => {
            client.logger.error(`Error reading directory: ${dir}`, err as string);
            return [];
        });

        for (const file of files) {
            const stat = await fs.lstat(path.join(__dirname, dir, file));

            if (stat.isDirectory()) {
                client.logger.trace(`Loading modules from directory: ${file}`);
                await loadModules(client, path.join(dir, file));
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                try {
                    const { default: Module } = await import(path.join(__dirname, dir, file));
                    const module: GargoyleModule = new Module();
                    if (!(module instanceof GargoyleModule)) {
                        client.logger.error(`File ${file} does not export a valid GargoyleCommand.`);
                        continue;
                    }
                    if (module.deprecated) {
                        client.logger.info(`Module ${file} is deprecated and will not be registered.`);
                        continue;
                    }
                    if (module.slashCommands.length > 0 || module.textCommands.length > 0) {
                        client.logger.debug(`Adding commands from ${file}`);
                        client.modules.push(module);
                    }
                } catch (err) {
                    client.logger.error(err as string, `Error registering module: ${file}`);
                }
            }
        }
    }
}

export default loadModules;
