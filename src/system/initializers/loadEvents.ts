import fs from 'fs';
import path from 'path';
import GargoyleClient from '@classes/clientClass.js'; // Use path alias from tsconfig

export default async function loadEvents(client: GargoyleClient) {
    // Use path alias for the events directory
    const eventsDir = path.join(__dirname, '../../events');
    const eventFiles = getEventFilesRecursively(eventsDir);

    await loadEventsFromFiles(client, eventFiles);
}

// Recursively get .ts files from the events directory and subdirectories
function getEventFilesRecursively(dir: string): string[] {
    let files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(getEventFilesRecursively(fullPath)); // Recursively search subdirectories
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            files.push(fullPath);
        }
    }

    return files;
}

function loadEventsFromFiles(client: GargoyleClient, eventFiles: string[]) {
    for (const filePath of eventFiles) {

        const { default: EventClass } = require(filePath);
        const eventInstance = new EventClass(client); // No need for type assertion now

        client.debug(`Loading event: ${eventInstance.event}`);

        client.on(eventInstance.event, (...args: any[]) => {
            client.debug(`Executing event: ${eventInstance.event}`);
            eventInstance.execute(...args); // Call the execute method with typed arguments
        });
    }
}