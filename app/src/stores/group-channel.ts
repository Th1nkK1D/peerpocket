import { decode, encode } from '@msgpack/msgpack';

const IV_LENGTH = 12;
const encoder = new TextEncoder();

/**
 * Derives a relay topic and an AES-GCM key from a store secret, so the relay
 * routes messages without learning the secret or reading their content.
 * @param secret - The store id, which embeds the random group id
 */
export async function createGroupChannel(secret: string) {
	const ikm = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		'HKDF',
		false,
		['deriveBits', 'deriveKey'],
	);
	const hkdf = (purpose: string) => ({
		name: 'HKDF',
		hash: 'SHA-256',
		salt: new Uint8Array(),
		info: encoder.encode(`peerpocket-${purpose}-v1`),
	});

	const [topicBits, key] = await Promise.all([
		crypto.subtle.deriveBits(hkdf('topic'), ikm, 256),
		crypto.subtle.deriveKey(
			hkdf('key'),
			ikm,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt'],
		),
	]);

	return {
		topic: `v1:${Array.from(new Uint8Array(topicBits), (b) => b.toString(16).padStart(2, '0')).join('')}`,
		async seal(data: unknown) {
			const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
			const cipher = await crypto.subtle.encrypt(
				{ name: 'AES-GCM', iv },
				key,
				encode(data),
			);
			const sealed = new Uint8Array(IV_LENGTH + cipher.byteLength);
			sealed.set(iv);
			sealed.set(new Uint8Array(cipher), IV_LENGTH);
			return sealed;
		},
		async open(sealed: Uint8Array) {
			return decode(
				await crypto.subtle.decrypt(
					{ name: 'AES-GCM', iv: sealed.slice(0, IV_LENGTH) },
					key,
					sealed.slice(IV_LENGTH),
				),
			);
		},
	};
}
