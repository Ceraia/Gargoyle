import GargoyleEvent from "@classes/eventClass.js";
import GargoyleClient from "@src/system/classes/clientClass.js";
import { ClientEvents } from "discord.js";

class ReadyEvent extends GargoyleEvent {
    constructor(client: GargoyleClient) {
        super(client, "ready");
    }

    execute(...args: ClientEvents["ready"]) {
        this.client.log(`Bot is ready!`);
    }
}

export default ReadyEvent;
