import { decode, decodeAsync, encode } from '@msgpack/msgpack';

interface SubscribeMessage {
	type: 'SUBSCRIBE';
	storeId: string;
}

interface PeerChangeMessage {
	type: 'PEER_CHANGE';
	storeId: string;
	count: number;
}

interface SyncMessage {
	type: 'SYNC';
	storeId: string;
	payload: [any, any, any, any];
}

interface SignalMessage {
	type: 'SIGNAL';
	storeId: string;
	toPeerId: string;
	fromPeerId: string;
	signal: any;
}

interface PeerJoinMessage {
	type: 'PEER_JOIN';
	storeId: string;
	peerId: string;
}

interface PeerLeaveMessage {
	type: 'PEER_LEAVE';
	storeId: string;
	peerId: string;
}

export type WebsocketMessage =
	| SubscribeMessage
	| PeerChangeMessage
	| SyncMessage
	| SignalMessage
	| PeerJoinMessage
	| PeerLeaveMessage;

export function formatMessage(message: WebsocketMessage) {
	return encode(message);
}

export async function parsedMessage(message: Buffer<ArrayBufferLike> | Blob) {
	if (message instanceof Blob) {
		return decodeAsync(message.stream()) as Promise<WebsocketMessage>;
	}

	return decode(message) as WebsocketMessage;
}
