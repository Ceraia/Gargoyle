import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/classes/gargoyleEvent.js';
import registerCommands from '@src/system/initializers/registerCommands.js';

export default class Ready extends GargoyleEvent {
    public event = 'ready' as const;
    public once = false;

    public async execute(client: GargoyleClient): Promise<void> {
        client.logger.log('Beginning command registration...');
        await registerCommands(client);
        client.logger.log('Command registration complete');
    }
}
