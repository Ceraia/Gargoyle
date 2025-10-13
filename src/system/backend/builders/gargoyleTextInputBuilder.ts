import { TextInputBuilder } from 'discord.js';
import GargoyleModule from '../classes/gargoyleModule.js';

export default class GargoyleTextInputBuilder extends TextInputBuilder {
    constructor(command: GargoyleModule, ...argument: string[]) {
        super();

        const customId = `cmd-${
            command.slashCommands[0].name.toLowerCase() ?? command.textCommands[0].name.toLowerCase()
        }-${argument.join('-').toLowerCase()}`;
        if (customId.length > 100) {
            throw new Error(`Custom ID exceeds 100 characters: ${customId}`);
        }
        this.setCustomId(customId);
    }
}
