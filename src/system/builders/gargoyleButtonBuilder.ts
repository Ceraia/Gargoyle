import { ButtonBuilder, ButtonStyle } from 'discord.js';
import GargoyleCommand from '../classes/gargoyleCommand.js';

class GargoyleButtonBuilder extends ButtonBuilder {
    constructor(command: GargoyleCommand, argument: string) {
        super();
        this.setCustomId(`${command.slashCommand?.name.toLowerCase() ?? command.textCommand?.name.toLowerCase()}-${argument.toLowerCase()}`);
        this.setStyle(ButtonStyle.Primary);
        this.setDisabled(false);
        this.setLabel(argument);
    }

    public override setCustomId(customId?: string): this {
        if (customId) {
            super.setCustomId(customId);
        } else {
            super.setCustomId(randomId());
        }
        return this;
    }
}

function randomId(): string {
    return Math.random().toString(36).substring(2, 15);
}

export default GargoyleButtonBuilder;
