interface SubscribeMessage {
	type: 'SUBSCRIBE';
	storeId: string;
}

interface SyncMessage {
	type: 'SYNC';
	storeId: string;
	payload: [any, any, any, any];
}

export type WebsocketMessage = SubscribeMessage | SyncMessage;

export function formatMessage(message: WebsocketMessage) {
	return JSON.stringify(message);
}

export function parsedMessage(message: string): WebsocketMessage {
	return JSON.parse(message);
}
