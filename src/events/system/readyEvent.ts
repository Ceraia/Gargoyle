import GargoyleEvent from '@classes/eventClass.js';
import GargoyleClient from '@src/system/classes/clientClass.js';

class ReadyEvent extends GargoyleEvent<'ready'> {
    constructor(client: GargoyleClient) {
        super(client, 'ready'); // Specify the event type only once
    }

    execute() {
        this.client.debug('Bot is ready!'); // Can access specific event args here if needed
    }
}

export default ReadyEvent;
