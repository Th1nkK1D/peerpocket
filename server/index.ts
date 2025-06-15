import { parsedMessage } from '@peerpocket/libs/message';

const server = Bun.serve({
	fetch(req, server) {
		if (!server.upgrade(req)) {
			return new Response('Signaling server is running');
		}
	},
	websocket: {
		async message(ws, message) {
			const data = await parsedMessage(message as Buffer<ArrayBufferLike>);

			switch (data.type) {
				case 'SUBSCRIBE':
					ws.subscribe(data.storeId);
					return;
				case 'UNSUBSCRIBE':
					ws.unsubscribe(data.storeId);
					return;
				case 'SYNC':
					server.publish(data.storeId, message);
					return;
			}
		},
	},
});

console.log(`Listening on http://${server.hostname}:${server.port}`);
