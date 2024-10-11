import GargoyleClient from "@src/system/classes/clientClass.js";
import { ClientEvents } from "discord.js";

abstract class GargoyleEvent<T extends keyof ClientEvents> {
    public event: T;
    protected client: GargoyleClient;

    constructor(client: GargoyleClient, event: T) {
        this.client = client;
        this.event = event;
    }

    // Abstract method to be implemented by subclasses
    abstract execute(...args: ClientEvents[T]): void;
}

export default GargoyleEvent;
