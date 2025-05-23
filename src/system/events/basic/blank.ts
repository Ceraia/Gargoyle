import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { Status } from 'discord.js';

export default class Ready extends GargoyleEvent {
    public event = 'ready' as const;
    override once = true;

    public execute(client: GargoyleClient): void {
        const statusName = Status[client.ws.status];
        client.logger.trace(`Discord WS Status is ${statusName}`);
        // Whatever you want to do when the bot is ready goes here.
    }
}
