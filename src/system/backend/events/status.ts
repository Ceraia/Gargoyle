import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ActivityType, Events } from 'discord.js';

export default class Ready extends GargoyleEvent {
    public event = Events.ClientReady as const;
    override once = true;

    public execute(client: GargoyleClient): void {
        setInterval(() => {
            let status = 'you <3 (dev)';
            if (process.env.ENVIRONMENT === 'prod') status = 'you <3';

            const today = new Date();
            if (today.getMonth() === 9 && today.getDate() === 5) {
                status = 'Happy birthday Axodouble!';
            }
            if (today.getMonth() === 11 && today.getDate() === 25) {
                status = 'Merry Christmas!';
            }
            if (today.getMonth() === 0 && today.getDate() === 1) {
                status = 'Happy New Year!';
            }

            client.user?.setActivity({
                name: status,
                type: ActivityType.Watching
            });
        }, 30000);
    }
}
