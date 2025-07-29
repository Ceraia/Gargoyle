import { Guild, Message, MessageCreateOptions, MessageResolvable, TextBasedChannel, TextChannel, WebhookMessageEditOptions } from 'discord.js';
import GargoyleClient from '../classes/gargoyleClient.js';
import client from '@src/system/botClient.js';

export async function sendAsServer(
    client: GargoyleClient,
    message: MessageCreateOptions,
    channel: TextBasedChannel,
    guild?: Guild
): Promise<Message | null> {
    const target = channel.isThread() ? channel.parent : channel;
    if (!target || target.isDMBased()) return Promise.resolve(null);
    const webhooks = await target.fetchWebhooks();

    let webhook;

    webhook = webhooks.find((webhook) => webhook.owner && webhook.owner.id === client.user?.id);

    if (!webhook) {
        webhook = await target.createWebhook({
            name: sanitizeNameString(guild ? guild.name : target.guild?.name || target.client.user.username),
            reason: 'Server Message'
        });
    }

    try {
        return await webhook.send({
            avatarURL: guild ? guild.iconURL() || undefined : target.guild?.iconURL() || undefined,
            username: sanitizeNameString(guild ? guild.name : target.guild?.name || target.client.user.username),
            threadId: channel.isThread() ? channel.id : undefined,
            ...message
        });
    } catch (err) {
        client.logger.error(err as string, `Error sending message as server in ${target.id}`);
        return null;
    }
}

export async function editAsServer(
    message: MessageCreateOptions,
    channel: TextChannel,
    messageId: string | MessageResolvable
): Promise<Message | null> {
    const webhooks = await channel.fetchWebhooks();

    let webhook;

    webhook = webhooks.find((webhook) => webhook.owner && webhook.owner.id === channel.client.user?.id);

    if (!webhook) {
        webhook = await channel.createWebhook({
            name: sanitizeNameString(channel.guild ? channel.guild.name : channel.client.user.username),
            reason: 'Server Message'
        });
    }

    let messageEdit: MessageResolvable;

    if (typeof messageId === 'string') {
        messageEdit = await channel.messages.fetch(messageId);
    } else {
        messageEdit = messageId;
    }

    try {
        return await webhook.editMessage(messageEdit, message as WebhookMessageEditOptions);
    } catch (err) {
        client.logger.error(err as string, `Error editing message as server in ${channel.id}`);
        return null;
    }
}

function sanitizeNameString(str: string): string {
    return str.replaceAll(/discord/gi, 'DC');
}
