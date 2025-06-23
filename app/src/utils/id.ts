import { customAlphabet } from 'nanoid';

const SEPARATOR = '-';

const nanoid = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	36,
);

function generate() {
	return nanoid();
}

async function hash(secretId: string) {
	const hash = await crypto.subtle.digest(
		'SHA-1',
		new TextEncoder().encode(secretId),
	);

	return btoa(String.fromCharCode(...new Uint8Array(hash)))
		.replaceAll('=', '')
		.replaceAll('+', '-')
		.replaceAll('/', '_');
}

function createStoreId(storeName: string, secretId: string = generate()) {
	return [storeName, secretId].join(SEPARATOR);
}

function extractFromStoreId(storeId: string) {
	return storeId.split(SEPARATOR)[0];
}

export const idHelper = {
	generate,
	hash,
	createStoreId,
	extractFromStoreId,
};
