import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { Events, VoiceState } from 'discord.js';

export default class VoiceActivity extends GargoyleEvent {
    public event = Events.VoiceStateUpdate as const;
    /**
     * Handles the voice state update event for a Discord guild member.
     * Tracks when a user joins or leaves a voice channel and updates their voice activity in the database.
     *
     * @param client - The GargoyleClient instance.
     * @param oldState - The previous voice state of the member.
     * @param newState - The new voice state of the member.
     */
    public execute(client: GargoyleClient, oldState: VoiceState, newState: VoiceState): void {
        if (client.db === null) return;

        const member = oldState.member;
        if (!member || member.user.bot) return;

        const guildId = oldState.guild.id;
        const userId = member.id;

        if (newState.channelId && !oldState.channelId) {
            // User joined a voice channel
            if (newState.guild.afkChannelId === newState.channelId) return;
            getGuildUserVoiceActivity(userId, guildId).then(async (voiceTime) => {
                voiceTime.activity.push({
                    dateJoined: new Date(),
                    dateLastChecked: new Date(),
                    hasLeft: false
                });
                await voiceTime.save();
            });
        } else if (newState.channelId && oldState.channelId) {
            // User switched voice states or was moved to a different voice channel
            if (newState.guild.afkChannelId === newState.channelId) {
                // User joined the AFK channel, thus has left the voice channel / is AFK
                getGuildUserVoiceActivity(userId, guildId).then(async (voiceTime) => {
                    const lastActivity = voiceTime.activity.pop();
                    if (lastActivity) {
                        lastActivity.hasLeft = true;
                        lastActivity.dateLastChecked = new Date();
                        voiceTime.activity.push(lastActivity);
                        await voiceTime.save();
                    }
                });
            } else {
                // User switched voice channels or voice state
                getGuildUserVoiceActivity(userId, guildId).then(async (voiceTime) => {
                    const lastActivity = voiceTime.activity.pop();
                    if (lastActivity) {
                        if (lastActivity.hasLeft) {
                            // User is last logged as having left a voice channel, but is in a voice channel so log them as joining again
                            voiceTime.activity.push(lastActivity);
                            voiceTime.activity.push({
                                dateJoined: new Date(),
                                dateLastChecked: new Date(),
                                hasLeft: false
                            });
                            await voiceTime.save();
                        } else {
                            // User is still in a voice channel
                            lastActivity.dateLastChecked = new Date();
                            voiceTime.activity.push(lastActivity);
                            await voiceTime.save();
                        }
                    }
                });
            }
        } else {
            // User left a voice channel
            getGuildUserVoiceActivity(userId, guildId).then(async (voiceTime) => {
                const lastActivity = voiceTime.activity.pop();
                if (lastActivity) {
                    if (lastActivity.hasLeft) return;
                    lastActivity.dateLastChecked = new Date();
                    if (newState.channelId === null) {
                        lastActivity.hasLeft = true;
                    }
                    voiceTime.activity.push(lastActivity);
                    await voiceTime.save();
                }

                await voiceTime.save();
            });
        }
    }
}

import { Schema, model } from 'mongoose';

const guildUserVoiceActivitySchema = new Schema({
    userId: String,
    guildId: String,
    activity: [
        {
            dateJoined: {
                type: Date,
                default: Date.now
            },
            dateLastChecked: {
                // The last time the user's voice activity was checked, will be checked on leave but will also periodically be checked to handle edge cases
                type: Date,
                default: Date.now
            },
            hasLeft: {
                type: Boolean,
                default: false
            }
        }
    ]
});

const databaseGuildUserVoiceActivity = model('GuildUserVoiceActivity', guildUserVoiceActivitySchema);

/**
 * Retrieves the voice activity document for a specific user in a specific guild.
 * If the document does not exist, it creates a new one.
 *
 * @param userId - The Discord user ID.
 * @param guildId - The Discord guild ID.
 * @returns The voice activity document for the user in the guild.
 */
async function getGuildUserVoiceActivity(userId: string, guildId: string) {
    let databaseGuildUser = await databaseGuildUserVoiceActivity.findOne({
        userId,
        guildId
    });
    if (!databaseGuildUser) {
        databaseGuildUser = new databaseGuildUserVoiceActivity({
            userId,
            guildId
        });
        await databaseGuildUser.save();
    }
    return databaseGuildUser;
}

/**
 * Returns the users voice activity within a guild within the last `x` minutes
 * @param userId The Discord user ID
 * @param guildId The Discord guild ID
 * @param time The amount of time to look back in minutes
 * @returns The amount of time the user has spent in voice channels in the last `time` minutes
 */

async function getUserVoiceActivity(
    userId: string,
    guildId: string,
    time: number // The amount of time to look back in minutes
) {
    const databaseGuildUser = await getGuildUserVoiceActivity(userId, guildId);

    const currentTime = new Date();
    const timeAgo = new Date(currentTime.getTime() - time * 60000);

    let totalVoiceTime = 0;
    for (const activity of databaseGuildUser.activity) {
        if (activity.dateJoined.getTime() < timeAgo.getTime()) {
            continue;
        }

        const joinedTime = activity.dateJoined.getTime();
        const lastCheckedTime = activity.dateLastChecked.getTime();

        totalVoiceTime += lastCheckedTime - joinedTime;
    }

    return Math.floor(totalVoiceTime / 60 / 1000);
}

export { databaseGuildUserVoiceActivity, getGuildUserVoiceActivity, getUserVoiceActivity };
