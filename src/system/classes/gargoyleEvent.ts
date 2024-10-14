import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import { ClientEvents } from 'discord.js';

abstract class GargoyleEvent {
    public abstract event: keyof ClientEvents;
    public abstract once: boolean;

    public abstract execute(client: GargoyleClient, ...args: any[]): void;
}

export default GargoyleEvent;
