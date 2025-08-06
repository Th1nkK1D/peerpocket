import { formatMessage, parsedMessage } from '@peerpocket/libs/message';
import type { Message, Peer } from 'crossws';
import { serve } from 'crossws/server';

serve({
	websocket: {
		open() {},
		async message(peer: Peer, { rawData }: Message) {
			const data = await parsedMessage(rawData as Buffer<ArrayBufferLike>);

			switch (data.type) {
				case 'SUBSCRIBE':
					peer.subscribe(data.storeId);
					broadcastPeerChange(peer, data.storeId);
					return;
				case 'SYNC':
					peer.publish(data.storeId, rawData);
					return;
			}
		},

		close(peer: Peer) {
			peer.topics.forEach((storeId) => broadcastPeerChange(peer, storeId));
		},
	},
	fetch: () => new Response('PeerPocket relay server is running'),
});

function broadcastPeerChange(peer: Peer, storeId: string) {
	const count = peer.peers
		.values()
		.reduce((sum, p) => sum + (p.topics.has(storeId) ? 1 : 0), 0);

	peer.publish(
		storeId,
		formatMessage({
			type: 'PEER_CHANGE',
			storeId,
			count,
		}),
	);

	if (peer.websocket.readyState === 1) {
		peer.send(
			formatMessage({
				type: 'PEER_CHANGE',
				storeId,
				count,
			}),
		);
	}
}
