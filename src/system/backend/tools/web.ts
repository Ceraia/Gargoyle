import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';

export default async function executeWebRequest(client: GargoyleClient, request: Request): Promise<Response> {
    const url = new URL(request.url);
    const commandName = url.pathname.split('/').pop();

    const command = client.commands.find((command) => {
        return (
            command.slashCommand?.name === commandName ||
            command.slashCommands.find((slashcommand) => {
                return slashcommand.name === commandName;
            })
        );
    });

    if (!command) {
        client.logger.error(`Command ${commandName} not found.`);
        return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
    } else {
        client.logger.trace(`Executing command ${commandName} from web request.`);
        return command.executeApiRequest(client, request);
    }
}
