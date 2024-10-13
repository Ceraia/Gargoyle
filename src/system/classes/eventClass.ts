import GargoyleClient from '@src/system/classes/clientClass.js';
import { ClientEvents } from 'discord.js';

abstract class GargoyleEvent {
    public event: keyof ClientEvents
    protected client: GargoyleClient;

    constructor(event: keyof ClientEvents, client: GargoyleClient) {
        this.event = event;
        this.client = client;
    }
    
}

export default GargoyleEvent;
