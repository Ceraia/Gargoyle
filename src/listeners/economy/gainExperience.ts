import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { Message } from "discord.js";

@ApplyOptions<Listener.Options>({
    event: "messageCreate",
})
export class UserEvent extends Listener {
    public override run(message: Message) {
        this.container.database.getGuildUser(message.author.id, message.guildId!).then((user) => {
            user.experience += 1;
            user.save();
        });
    }
}
