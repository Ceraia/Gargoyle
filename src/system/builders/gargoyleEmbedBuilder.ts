import { EmbedBuilder } from 'discord.js';

class GargoyleEmbedBuilder extends EmbedBuilder {
    constructor() {
        super();
        this.setColor(0x2b2d31); // Default embed color
    }
}

export default GargoyleEmbedBuilder;
