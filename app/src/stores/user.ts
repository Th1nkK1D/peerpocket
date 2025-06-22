import { createSyncStore } from './factory';

const valuesSchema = {
	name: { type: 'string' },
} as const;

const tablesSchema = {
	groups: {
		name: { type: 'string' },
	},
} as const;

export const setupUserStore = (storeId: string) =>
	createSyncStore(storeId, valuesSchema, tablesSchema);
