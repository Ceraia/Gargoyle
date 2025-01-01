import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { Events, VoiceState } from 'discord.js';

export default class VoiceActivity extends GargoyleEvent {
    public event = Events.VoiceStateUpdate as const;

    public async execute(client: GargoyleClient, oldState: VoiceState, newState: VoiceState): Promise<void> {
        if (oldState.guild.id !== '1009048008857493624') return;

        const member = oldState.member;
        if (!member || member.user.bot) return;

        client.logger.trace(`Updating voice activity for ${newState.member?.user.tag}`);

    }
}
