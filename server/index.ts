import { parsedMessage } from '@peerpocket/libs/message';

const server = Bun.serve({
	fetch(req, server) {
		const success = server.upgrade(req);

		if (!success) {
			new Response('Signaling server is running');
		}
	},
	websocket: {
		message(ws, message) {
			const data = parsedMessage(message as string);

			switch (data.type) {
				case 'SUBSCRIBE':
					ws.subscribe(data.storeId);
					return;
				case 'SYNC':
					server.publish(data.storeId, message);
					return;
			}
		},
	},
});

console.log(`Listening on http://${server.hostname}:${server.port}`);
