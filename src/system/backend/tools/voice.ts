import {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    NoSubscriberBehavior,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState
} from '@discordjs/voice';
import { VoiceChannel } from 'discord.js';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import GargoyleClient from '../classes/gargoyleClient.js';

export async function playAudio(client: GargoyleClient, channel: VoiceChannel, media: string) {
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (error) {
        client.logger.error(error as string);
        connection.destroy();
        return;
    }

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause
        }
    });

    const filePath = join(process.cwd(), 'media', media);
    const resource = createAudioResource(createReadStream(filePath));
    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
    });

    player.on('error', (error) => {
        client.logger.error(error);
        connection.destroy();
    });
}
