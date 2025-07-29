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

export type WebsocketMessage =
	| SubscribeMessage
	| PeerChangeMessage
	| SyncMessage;

export function formatMessage(message: WebsocketMessage) {
	return encode(message);
}

export async function parsedMessage(message: Buffer<ArrayBufferLike> | Blob) {
	if (message instanceof Blob) {
		return decodeAsync(message.stream()) as Promise<WebsocketMessage>;
	}

	return decode(message) as WebsocketMessage;
}
