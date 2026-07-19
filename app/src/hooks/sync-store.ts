import { decode, encode } from '@msgpack/msgpack';
import { formatMessage, parsedMessage } from '@peerpocket/libs/message';
import { useEffect, useMemo, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import SimplePeer from 'simple-peer';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import {
	createCustomSynchronizer,
	type Message,
	type Receive,
	type Synchronizer,
} from 'tinybase/synchronizers/with-schemas';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import {
	createMergeableStore,
	type Row,
	type TablesSchema,
	type ValuesSchema,
} from 'tinybase/with-schemas';

function isE2EAndRelayDisabled(): boolean {
	try {
		const config = (window as any).__PEERPOCKET_E2E__;
		if (config?.seed && config.seed.enableRelay !== true) {
			return true;
		}
	} catch (_) {}
	return false;
}

export async function createSyncStore<
	VS extends ValuesSchema,
	TS extends TablesSchema,
>(id: string, valuesSchema: VS, tablesSchema: TS) {
	type TableName = Exclude<keyof TS & string, number>;
	type RowValue<N extends TableName> = Row<TS, N, false>;

	const store = createMergeableStore(id)
		.setValuesSchema(valuesSchema)
		.setTablesSchema(tablesSchema);

	// @ts-expect-error https://tinybase.org/guides/persistence/an-intro-to-persistence/
	const persistence = createLocalPersister(store, id);
	await persistence.startAutoPersisting();

	const { useTable, useValues } = UiReact as UiReact.WithSchemas<
		[typeof tablesSchema, typeof valuesSchema]
	>;

	type withRowId<T> = { id: string } & T;

	function useTableRows<N extends TableName>(name: N): withRowId<RowValue<N>>[];
	function useTableRows<N extends TableName, T>(
		name: N,
		method: (rows: withRowId<RowValue<N>>[]) => T,
	): T;
	function useTableRows<N extends TableName>(
		name: N,
		method: (rows: withRowId<RowValue<N>>[]) => unknown = (rows) => rows,
	) {
		const table = useTable(name, store);
		return useMemo(
			() =>
				method(
					Object.entries(table).map(([id, value]) => ({
						id,
						...value,
					})),
				),
			[table, method],
		);
	}

	function usePeerSync() {
		const synchronizer = useRef<Synchronizer<any>>(null);
		const messageReceiver = useRef<Receive>(() => {});
		const [onlinePeerCount, setOnlinePeerCount] = useState(0);
		const [connectedPeerCount, setConnectedPeerCount] = useState(0);
		const [isSyncing, setIsSyncing] = useState(false);
		const skipRelay = isE2EAndRelayDisabled();
		const syncDebounceRef = useRef<NodeJS.Timeout>(null);

		const myPeerIdRef = useRef<string | null>(null);
		const peerConnections = useRef<
			Map<string, { peer: SimplePeer.Instance; connected: boolean }>
		>(new Map());
		const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

		function trackTimeout(timeout: NodeJS.Timeout) {
			activeTimeouts.current.add(timeout);
		}

		function clearAllTimeouts() {
			for (const t of activeTimeouts.current) clearTimeout(t);
			activeTimeouts.current.clear();
			if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
		}

		// Teardown on unmount — don't rely on useWebSocket's onClose firing.
		useEffect(
			() => () => {
				for (const t of activeTimeouts.current) clearTimeout(t);
				activeTimeouts.current.clear();
				if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
				for (const [, conn] of peerConnections.current) {
					conn.peer.destroy();
				}
				peerConnections.current.clear();
			},
			[],
		);

		const { sendMessage } = useWebSocket(
			import.meta.env.PUBLIC_RELAY_URL,
			{
				retryOnError: true,
				shouldReconnect: () => !skipRelay,
				onOpen() {
					synchronizer.current = createCustomSynchronizer(
						store,
						function send(
							toClientId: string | null,
							...args: [requestId: string, message: Message, body: any]
						) {
							const payload: [any, any, any, any] = [toClientId, ...args];

							if (toClientId !== null) {
								const conn = peerConnections.current.get(toClientId);
								if (conn?.connected) {
									try {
										conn.peer.send(encode(payload));
										return;
									} catch (err) {
										console.warn('[PeerSync] unicast failed:', err);
									}
								}
							}

							sendMessage(
								formatMessage({
									type: 'SYNC',
									storeId: id,
									payload,
								}),
							);
						},
						function registerReceive(receive: Receive) {
							messageReceiver.current = receive;
						},
						() => {},
						10000,
					);

					synchronizer.current.addStatusListener((_synchronizer, status) => {
						setDebouncedSyncing(status !== 0);
					});

					sendMessage(
						formatMessage({
							type: 'SUBSCRIBE',
							storeId: id,
						}),
					);

					synchronizer.current.startSync();
				},
				async onMessage(event: MessageEvent) {
					const data = await parsedMessage(event.data);

					if (data.storeId !== id) return;

					switch (data.type) {
						case 'PEER_JOIN':
							if (myPeerIdRef.current === null) {
								myPeerIdRef.current = data.peerId;
							} else if (data.peerId !== myPeerIdRef.current) {
								if (myPeerIdRef.current < data.peerId) {
									connectToPeer(data.peerId);
								}
								// else: remote has smaller ID — they initiate after learning about us
							}
							return;
						case 'PEER_LEAVE':
							{
								const conn = peerConnections.current.get(data.peerId);
								if (conn) {
									conn.peer.destroy();
									peerConnections.current.delete(data.peerId);
									if (updateConnectedCount() === 0) {
										setDebouncedSyncing(false);
									}
								}
							}
							return;
						case 'SIGNAL':
							if (
								data.toPeerId === myPeerIdRef.current &&
								data.fromPeerId !== myPeerIdRef.current
							) {
								const conn = peerConnections.current.get(data.fromPeerId);
								if (conn) {
									conn.peer.signal(data.signal);
								} else {
									// Peer not ready yet — connect and retry until ready
									connectToPeer(data.fromPeerId);
									waitForSignal(data.fromPeerId, data.signal);
								}
							}
							return;
						case 'SYNC': {
							// Drop the transport toClientId; use the relay-stamped sender.
							const [, ...rest] = data.payload;
							if (data.fromPeerId) {
								messageReceiver.current(data.fromPeerId, ...rest);
							}
							return;
						}
						case 'PEER_CHANGE':
							if (data.count > 1 && data.count > onlinePeerCount) {
								await synchronizer.current?.startSync();
							}
							return setOnlinePeerCount(data.count);
					}
				},
				onClose() {
					myPeerIdRef.current = null;
					clearAllTimeouts();
					for (const [, conn] of peerConnections.current) {
						conn.peer.destroy();
					}
					peerConnections.current.clear();
					setOnlinePeerCount(0);
					setConnectedPeerCount(0);
					setIsSyncing(false);
					synchronizer.current?.stopSync();
				},
			},
			!skipRelay,
		);

		return { onlinePeerCount, connectedPeerCount, isSyncing };

		function setDebouncedSyncing(syncing: boolean) {
			if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
			if (syncing) {
				setIsSyncing(true);
			} else {
				syncDebounceRef.current = setTimeout(() => setIsSyncing(false), 500);
			}
		}

		function updateConnectedCount(): number {
			const count = Array.from(peerConnections.current.values()).filter(
				(c) => c.connected,
			).length;
			setConnectedPeerCount(count);
			return count;
		}

		function connectToPeer(remotePeerId: string) {
			if (
				remotePeerId === myPeerIdRef.current ||
				peerConnections.current.has(remotePeerId)
			)
				return;

			const peer = new SimplePeer({
				initiator:
					myPeerIdRef.current !== null && myPeerIdRef.current < remotePeerId,
				config: {
					iceServers: [
						{ urls: 'stun:stun.l.google.com:19302' },
						{ urls: 'stun:stun1.l.google.com:19302' },
						{ urls: 'stun:global.stun.twilio.com:3478' },
						{ urls: 'stun:stun.services.mozilla.com:3478' },
					],
				},
			});

			peerConnections.current.set(remotePeerId, {
				peer,
				connected: false,
			});

			peer.on('signal', (signal) => {
				if (myPeerIdRef.current) {
					sendMessage(
						formatMessage({
							type: 'SIGNAL',
							storeId: id,
							toPeerId: remotePeerId,
							fromPeerId: myPeerIdRef.current,
							signal,
						}),
					);
				}
			});

			peer.on('data', (data: Uint8Array) => {
				const conn = peerConnections.current.get(remotePeerId);
				if (!conn?.connected) return;
				try {
					const decoded = decode(data) as [string | null, any, any, any];
					// Payload starts with toClientId (transport-level); replace with actual sender
					const [, ...rest] = decoded;
					messageReceiver.current(remotePeerId, ...rest);
				} catch (err) {
					console.warn('[PeerSync] decode failed:', err);
				}
			});

			peer.on('connect', () => {
				const conn = peerConnections.current.get(remotePeerId);
				if (conn) {
					conn.connected = true;
					updateConnectedCount();
					setDebouncedSyncing(true);
				}
			});

			peer.on('close', () => {
				peerConnections.current.delete(remotePeerId);
				if (updateConnectedCount() === 0) {
					setDebouncedSyncing(false);
				}
			});

			peer.on('error', (err) => {
				console.warn('[PeerSync] peer error:', err);
				peer.destroy();
				peerConnections.current.delete(remotePeerId);
				if (updateConnectedCount() === 0) {
					setDebouncedSyncing(false);
				}
			});
		}

		function waitForSignal(fromPeerId: string, signal: any, attempts = 0) {
			const conn = peerConnections.current.get(fromPeerId);
			if (conn) {
				conn.peer.signal(signal);
			} else if (attempts < 20) {
				const t = setTimeout(
					() => waitForSignal(fromPeerId, signal, attempts + 1),
					50,
				);
				trackTimeout(t);
			}
		}
	}

	return {
		...store,
		useTableRows,
		useValues: () => useValues(store),
		usePeerSync,
	};
}
