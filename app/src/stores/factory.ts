/** biome-ignore-all lint/correctness/useHookAtTopLevel: top-level function is not a hook */
import { formatMessage, parsedMessage } from '@peerpocket/libs/message';
import { useEffect } from 'react';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import {
	createCustomSynchronizer,
	type Message,
	type Receive,
} from 'tinybase/synchronizers/with-schemas';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import {
	createMergeableStore,
	type TablesSchema,
	type ValuesSchema,
} from 'tinybase/with-schemas';

const ws = new WebSocket('ws://localhost:3000');

export async function createSyncStore<
	VS extends ValuesSchema,
	TS extends TablesSchema,
>(id: string, valuesSchema: VS, tablesSchema: TS) {
	const store = createMergeableStore(id)
		.setValuesSchema(valuesSchema)
		.setTablesSchema(tablesSchema);

	// @ts-expect-error https://tinybase.org/guides/persistence/an-intro-to-persistence/
	const persistence = createLocalPersister(store, id);

	await persistence.startAutoPersisting();

	function getStore() {
		return { store, persistence };
	}

	function useStore() {
		const { useTable, useValues } = UiReact as UiReact.WithSchemas<
			[typeof tablesSchema, typeof valuesSchema]
		>;

		useEffect(() => {
			let messageHandler: (event: MessageEvent) => void;

			const synchronizer = createCustomSynchronizer(
				store,
				function send(
					toClientId: string | null,
					...args: [requestId: string, message: Message, body: any]
				) {
					ws.send(
						formatMessage({
							type: 'SYNC',
							storeId: id,
							payload: [toClientId, ...args],
						}),
					);
				},
				function registerReceive(receive: Receive) {
					messageHandler = async (event: MessageEvent) => {
						const data = await parsedMessage(event.data);

						if (data.type === 'SYNC' && data.storeId === id) {
							receive(...data.payload);
						}
					};

					ws.addEventListener('message', messageHandler);
				},
				cleanupSync,
				10000,
			);

			if (ws.readyState === WebSocket.OPEN) {
				enableSync();
			} else {
				ws.addEventListener('open', enableSync);
			}

			ws.addEventListener('close', synchronizer.destroy);

			function enableSync() {
				ws.send(
					formatMessage({
						type: 'SUBSCRIBE',
						storeId: id,
					}),
				);

				return synchronizer.startSync();
			}

			function cleanupSync() {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(
						formatMessage({
							type: 'UNSUBSCRIBE',
							storeId: id,
						}),
					);
				}

				ws.removeEventListener('open', enableSync);
				ws.removeEventListener('close', synchronizer.destroy);
				ws.removeEventListener('message', messageHandler);
			}

			return () => {
				cleanupSync();
				synchronizer.stopSync();
			};
		});

		return {
			store,
			useTable: (name: Exclude<keyof TS & string, number>) =>
				useTable(name, store),
			useValues: () => useValues(store),
		};
	}

	return {
		getStore,
		useStore,
	};
}
