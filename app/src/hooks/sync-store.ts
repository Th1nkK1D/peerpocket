import { formatMessage, parsedMessage } from '@peerpocket/libs/message';
import { useMemo, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
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
		const [peerCount, setPeerCount] = useState(0);
		const [isSyncing, setIsSyncing] = useState(false);
		const skipRelay = isE2EAndRelayDisabled();
		const syncDebounceRef = useRef<NodeJS.Timeout>(null);

		const setDebouncedSyncing = (syncing: boolean) => {
			if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
			if (syncing) {
				setIsSyncing(true);
			} else {
				syncDebounceRef.current = setTimeout(() => setIsSyncing(false), 500);
			}
		};

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
							sendMessage(
								formatMessage({
									type: 'SYNC',
									storeId: id,
									payload: [toClientId, ...args],
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
						case 'SYNC':
							return messageReceiver.current(...data.payload);
						case 'PEER_CHANGE':
							if (data.count > 1 && data.count > peerCount) {
								await synchronizer.current?.startSync();
							}
							return setPeerCount(data.count);
					}
				},
				onClose() {
					setPeerCount(0);
					setIsSyncing(false);
					synchronizer.current?.stopSync();
				},
			},
			!skipRelay,
		);

		return { peerCount, isSyncing };
	}

	return {
		...store,
		useTableRows,
		useValues: () => useValues(store),
		usePeerSync,
	};
}
