import { ClientEvents } from "discord.js";
import GargoyleClient from "./clientClass.js";

abstract class GargoyleEvent {
    public event: keyof ClientEvents;
    protected client: GargoyleClient;

    constructor(client: GargoyleClient, event: keyof ClientEvents) {
        this.client = client;
        this.event = event;
    }

    abstract execute(...args: any[]): void;
}

export default GargoyleEvent;
