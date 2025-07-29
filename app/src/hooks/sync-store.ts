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

	function useTableRows<N extends TableName>(name: N): RowValue<N>[];
	function useTableRows<N extends TableName, T>(
		name: N,
		method: (rows: RowValue<N>[]) => T[],
	): T[];
	function useTableRows<N extends TableName>(
		name: N,
		method: (rows: RowValue<N>[]) => unknown = (rows) => rows,
	) {
		const table = useTable(name, store);
		return useMemo(() => method(Object.values(table)), [table, method]);
	}

	function usePeerSync() {
		const synchronizer = useRef<Synchronizer<any>>(null);
		const messageReceiver = useRef<Receive>(() => {});
		const [peerCount, setPeerCount] = useState(0);

		const { sendMessage } = useWebSocket('ws://localhost:3000', {
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
						return setPeerCount(data.count);
				}
			},
			onClose() {
				setPeerCount(0);
				synchronizer.current?.stopSync();
			},
		});

		return peerCount;
	}

	return {
		...store,
		useTableRows,
		useValues: () => useValues(store),
		usePeerSync,
	};
}
