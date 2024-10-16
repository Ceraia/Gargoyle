import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/classes/gargoyleEvent.js';
import { ActivityType } from 'discord.js';

export default class Ready extends GargoyleEvent {
    public event = 'ready' as const;
    public once = false;

    public execute(client: GargoyleClient): void {
        client.logger.info(`Logged in as ${client.user?.tag}!`);

        // Set the bot's activity every 30 seconds
        setInterval(() => {
            client.user?.setActivity({
                name: 'you <3',
                type: ActivityType.Watching
            });
        }, 30000);
    }
}
