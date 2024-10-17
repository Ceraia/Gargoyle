import { ButtonBuilder } from 'discord.js';

class GargoyleButtonBuilder extends ButtonBuilder {
    constructor() {
        super();
        this.setCustomId(randomId()); // Automatically set a random customId if not provided
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
