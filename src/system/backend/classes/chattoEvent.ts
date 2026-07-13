import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import { ClientEventMap } from 'chatto.ts';

abstract class ChattoEvent {
    public abstract event: keyof ClientEventMap;
    public once: boolean = false;

    public abstract execute(client: GargoyleClient, ...args: any[]): void;
}

export default ChattoEvent;
