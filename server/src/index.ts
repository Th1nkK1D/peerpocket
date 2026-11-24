import { formatMessage, parsedMessage } from '@peerpocket/libs/message';
import type { Message, Peer } from 'crossws';
import { serve } from 'crossws/server';

import { startUsage } from './usage';

const usage = process.env.STATS_DB
	? startUsage(process.env.STATS_DB)
	: undefined;

serve({
	websocket: {
		open() {
			usage?.connect();
		},
		async message(peer: Peer, { rawData }: Message) {
			const raw = rawData as string | Buffer<ArrayBufferLike>;
			usage?.received(raw.length);
			if (raw.length === 4 && raw.toString() === 'ping') {
				send(peer, 'pong');
				return;
			}

			const data = await parsedMessage(rawData as Buffer<ArrayBufferLike>);

			switch (data.type) {
				case 'SUBSCRIBE':
					usage?.store(data.storeId);
					peer.subscribe(data.storeId);
					publish(
						peer,
						data.storeId,
						formatMessage({
							type: 'PEER_JOIN',
							storeId: data.storeId,
							peerId: peer.id,
						}),
					);
					// Self-join so the new peer discovers its own id
					send(
						peer,
						formatMessage({
							type: 'PEER_JOIN',
							storeId: data.storeId,
							peerId: peer.id,
						}),
					);
					for (const p of peer.peers) {
						if (p !== peer && p.topics.has(data.storeId)) {
							send(
								peer,
								formatMessage({
									type: 'PEER_JOIN',
									storeId: data.storeId,
									peerId: p.id,
								}),
							);
						}
					}
					broadcastPeerChange(peer, data.storeId);
					return;
				case 'SYNC': {
					usage?.sync();
					usage?.store(data.storeId);
					const toPeerId = data.payload[0];
					const message = formatMessage({
						type: 'SYNC',
						storeId: data.storeId,
						fromPeerId: peer.id,
						payload: data.payload,
					});

					if (toPeerId === null) {
						publish(peer, data.storeId, message);
						return;
					}

					for (const p of peer.peers) {
						if (p.id === toPeerId && p.topics.has(data.storeId)) {
							send(p, message);
							break;
						}
					}
					return;
				}
				case 'SIGNAL':
					usage?.signal();
					for (const p of peer.peers) {
						if (p.id === data.toPeerId && p.topics.has(data.storeId)) {
							send(p, raw);
							break;
						}
					}
					return;
			}
		},

		close(peer: Peer) {
			usage?.disconnect();
			peer.topics.forEach((storeId) => {
				publish(
					peer,
					storeId,
					formatMessage({
						type: 'PEER_LEAVE',
						storeId,
						peerId: peer.id,
					}),
				);
				broadcastPeerChange(peer, storeId);
			});
		},
	},
	fetch: () => new Response('PeerPocket relay server is running'),
});

function send(peer: Peer, data: string | Uint8Array) {
	peer.send(data);
	usage?.sent(data.length);
}

function publish(peer: Peer, storeId: string, data: Uint8Array) {
	peer.publish(storeId, data);
	usage?.sent(
		data.length *
			peer.peers
				.values()
				.filter((p) => p !== peer && p.topics.has(storeId))
				.toArray().length,
	);
}

function broadcastPeerChange(peer: Peer, storeId: string) {
	const count = peer.peers
		.values()
		.reduce((sum, p) => sum + (p.topics.has(storeId) ? 1 : 0), 0);

	publish(
		peer,
		storeId,
		formatMessage({
			type: 'PEER_CHANGE',
			storeId,
			count,
		}),
	);

	if (peer.websocket.readyState === 1) {
		send(
			peer,
			formatMessage({
				type: 'PEER_CHANGE',
				storeId,
				count,
			}),
		);
	}
}
