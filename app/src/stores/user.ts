import { createSyncStore } from './factory';

export const USER_STORE_PREFIX = 'user';

const valuesSchema = {
	id: { type: 'string' },
	hashedId: { type: 'string' },
	name: { type: 'string' },
} as const;

const tablesSchema = {
	groups: {
		name: { type: 'string' },
	},
} as const;

export const setupUserStore = (storeId: string) =>
	createSyncStore(storeId, valuesSchema, tablesSchema);
