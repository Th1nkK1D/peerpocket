import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { createMergeableStore } from 'tinybase/with-schemas';

const valuesSchema = {} as const;

const tablesSchema = {
	groups: {
		name: { type: 'string' },
	},
} as const;

export const userStore =
	createMergeableStore('user').setTablesSchema(tablesSchema);

// @ts-expect-error https://tinybase.org/guides/persistence/an-intro-to-persistence/
createLocalPersister(userStore, 'userStore').startAutoPersisting();

export const userUiReact = UiReact as UiReact.WithSchemas<
	[typeof tablesSchema, typeof valuesSchema]
>;
