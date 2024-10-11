import GargoyleEvent from "@classes/eventClass.js";
import GargoyleClient from "@src/system/classes/clientClass.js";
import { ClientEvents } from "discord.js";

class ReadyEvent extends GargoyleEvent<"ready"> {
    constructor(client: GargoyleClient) {
        super(client, "ready"); // Specify the event type only once
    }

    execute(...args: ClientEvents["ready"]) {
        this.client.debug("Bot is ready!"); // Can access specific event args here if needed
    }
}

export default ReadyEvent;
