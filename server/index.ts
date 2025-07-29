import { formatMessage, parsedMessage } from '@peerpocket/libs/message';

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
					ws.data = [...(ws.data ?? []), data.storeId];
					broadcastPeerChange(data.storeId);
					return;
				case 'SYNC':
					ws.publish(data.storeId, message);
					return;
			}
		},
		async close(ws) {
			ws.data?.forEach((storeId) => broadcastPeerChange(storeId));
		},
	} as Bun.WebSocketHandler<string[]>,
});

function broadcastPeerChange(storeId: string) {
	server.publish(
		storeId,
		formatMessage({
			type: 'PEER_CHANGE',
			storeId,
			count: server.subscriberCount(storeId),
		}),
	);
}

console.log(`Listening on http://${server.hostname}:${server.port}`);
