import GargoyleEvent from '@classes/eventClass.js';
import GargoyleClient from '@src/system/classes/clientClass.js';
import { ClientEvents } from 'discord.js';

class MessageEvent extends GargoyleEvent<'messageCreate'> {
    // Specify the event type only once
    constructor(client: GargoyleClient) {
        super(client, 'messageCreate');
    }

    execute(message: ClientEvents['messageCreate'][0]) {
        // Handle the message event
        this.client.debug(`Received message: ${message.content}`);
    }
}

export default MessageEvent;
