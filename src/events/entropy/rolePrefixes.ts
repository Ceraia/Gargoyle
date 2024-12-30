import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { Events, GuildMember } from 'discord.js';

export default class Ready extends GargoyleEvent {
    public event = Events.GuildMemberUpdate as const;

    public async execute(_client: GargoyleClient, member: GuildMember): Promise<void> {
        if (member.guild.id !== '1039152052644880435') return;

        const updatedMember = await member.fetch(true);
        let namePrefix = '[';

        updatedMember.roles.cache.forEach((role) => {
            if (role.name === '@everyone') return;
            namePrefix += role.name.split('')[0].toUpperCase();
        });

        namePrefix += `] ${updatedMember.user.displayName}`;

        updatedMember.setNickname(namePrefix).catch(() => {});
    }
}
