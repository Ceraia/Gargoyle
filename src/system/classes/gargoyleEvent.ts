import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import { ClientEvents } from 'discord.js';

abstract class GargoyleEvent {
    public abstract event: keyof ClientEvents;
    public once: boolean = false;

    public abstract execute(client: GargoyleClient, ...args: any[]): void;
}

export default GargoyleEvent;
