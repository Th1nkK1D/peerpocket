import { formatMessage, parsedMessage } from '@peerpocket/libs/message';
import { useEffect } from 'react';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import {
	type Message,
	type Receive,
	createCustomSynchronizer,
} from 'tinybase/synchronizers/with-schemas';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore } from 'tinybase/with-schemas';

const valuesSchema = {} as const;

const tablesSchema = {
	groups: {
		name: { type: 'string' },
	},
} as const;

const store = createMergeableStore('user').setTablesSchema(tablesSchema);

// @ts-expect-error https://tinybase.org/guides/persistence/an-intro-to-persistence/
createLocalPersister(store, 'userStore').startAutoPersisting();

export function useUserStore() {
	const { useTable } = UiReact as UiReact.WithSchemas<
		[typeof tablesSchema, typeof valuesSchema]
	>;

	useEffect(() => {
		const ws = new WebSocket('ws://localhost:3000');

		const synchronizer = createCustomSynchronizer(
			store,
			function send(
				toClientId: string | null,
				...args: [requestId: string, message: Message, body: any]
			) {
				ws.send(
					formatMessage({
						type: 'SYNC',
						storeId: 'user-id',
						payload: [toClientId, ...args],
					}),
				);
			},
			function registerReceive(receive: Receive) {
				ws.addEventListener('message', async (event) => {
					const data = await parsedMessage(event.data);

					if (data.type === 'SYNC') {
						receive(...data.payload);
					}
				});
			},
			function destroy() {
				ws.close();
			},
			10000,
		);

		ws.addEventListener('open', () => {
			ws.send(
				formatMessage({
					type: 'SUBSCRIBE',
					storeId: 'user-id',
				}),
			);

			synchronizer.startSync();
		});
	});

	return {
		store,
		useTable: (name: keyof typeof tablesSchema) => useTable(name, store as any),
	};
}
