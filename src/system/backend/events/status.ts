import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ActivityType, Events } from 'discord.js';

export default class Ready extends GargoyleEvent {
    public event = Events.ClientReady as const;
    override once = true;

    public execute(client: GargoyleClient): void {
        setInterval(() => {
            let status = 'custom';
            let state = '🌺 Ceraia (dev)';
            let type = ActivityType.Watching;
            if (process.env.ENVIRONMENT === 'prod') state = '🌺 Ceraia <3';

            const today = new Date();
            if (today.getMonth() === 9 && today.getDate() === 5) {
                state = '🎉 Happy birthday Axodouble!';
                type = ActivityType.Custom;
            }
            if (today.getMonth() === 11 && today.getDate() === 25) {
                status = '🎄 Merry Christmas!';
            }
            if (today.getMonth() === 0 && today.getDate() === 1) {
                state = '🎉 Happy New Year!';
            }

            client.user?.setActivity({
                name: status,
                type: type,
                state: state
            });
        }, 30000);
    }
}
