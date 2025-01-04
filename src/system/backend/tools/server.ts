import { MessageCreateOptions, MessageResolvable, TextChannel } from 'discord.js';

export function sendAsServer(message: MessageCreateOptions, channel: TextChannel): Promise<void> {
    return channel.fetchWebhooks().then(async (webhooks) => {
        let webhook;

        if (webhooks.size === 0) {
            webhook = await channel.createWebhook({
                name: channel.guild?.name || channel.client.user.username,
                reason: 'Server Message'
            });
        } else {
            webhook = webhooks.first();
        }

        await webhook?.send({
            avatarURL: channel.guild?.iconURL() || undefined,
            username: channel.guild?.name || channel.client.user.username,
            ...message
        });
    }).catch(() => {
        throw new Error('Failed to send message as server.');
    });
}

export function editAsServer(message: MessageCreateOptions, channel: TextChannel, messageId: string | MessageResolvable): Promise<boolean> {
    return channel.fetchWebhooks().then(async (webhooks) => {
        let webhook;

        if (webhooks.size === 0) {
            webhook = await channel.createWebhook({
                name: channel.guild?.name || channel.client.user.username,
                reason: 'Server Message'
            });
        } else {
            webhook = webhooks.first();
        }

        let messageEdit: MessageResolvable;

        if (typeof messageId === 'string') {
            messageEdit = await channel.messages.fetch(messageId);
        } else {
            messageEdit = messageId;
        }

        await webhook?.editMessage(messageEdit, {
            ...message,
        });
        return true;
    }).catch(() => {
        return false;
    });
}
