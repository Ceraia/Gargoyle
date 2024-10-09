import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { createBanner } from "@skyra/start-banner";
import type { StoreRegistryValue } from "@sapphire/pieces";
import { blue, gray, green, yellow } from "colorette";
import gradient from "gradient-string";
import figlet from "figlet";
import { Server } from "http";

const dev = process.env.NODE_ENV !== "production";

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
	private readonly style = dev ? yellow : blue;

	public override run() {
		this.printBanner();
		this.printStoreDebugInformation();
		this.startHealthServer();
	}

	private printBanner() {
		const success = green("+");

		console.log(
			createBanner({
				name: [gradient.retro.multiline(figlet.textSync("Gargoyle"))],
				extra: [
					//
					`[${success}] Gateway`,
				],
			})
		);
	}

	private startHealthServer() {
		const server = new Server((req, res) => {
			if (req.url == "/health") {
				res.writeHead(200, {
					"Content-Type": "text/plain",
				});
				res.end("OK");
			}
		});
		server.listen(3000); // Start the server on port 3000
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];
		const last = stores.pop()!;

		for (const store of stores) logger.info(this.styleStore(store, false));
		logger.info(this.styleStore(last, true));
	}

	private styleStore(store: StoreRegistryValue, last: boolean) {
		return gray(`${last ? "└─" : "├─"} Loaded ${this.style(store.size.toString().padEnd(3, " "))} ${store.name}.`);
	}
}
