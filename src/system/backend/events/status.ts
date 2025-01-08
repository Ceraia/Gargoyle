import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ActivityType } from 'discord.js';

export default class Ready extends GargoyleEvent {
    public event = 'ready' as const;
    override once = true;

    public execute(client: GargoyleClient): void {
        let status = 'you <3';
        if (process.env.ENVIRONMENT === 'dev') status = 'you <3 (dev)';

        setInterval(() => {
            client.user?.setActivity({
                name: status,
                type: ActivityType.Watching
            });
        }, 30000);
    }
}
