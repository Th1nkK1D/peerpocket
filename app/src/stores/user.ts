import { createSyncStore } from '../hooks/sync-store';

export const USER_STORE_PREFIX = 'user';

const valuesSchema = {
	id: { type: 'string' },
	hashedId: { type: 'string' },
	name: { type: 'string' },
} as const;

const tablesSchema = {
	groups: {
		name: { type: 'string', default: '' },
		joinedAt: { type: 'number', default: 0 },
		archivedAt: { type: 'number' },
	},
} as const;

export const setupUserStore = (storeId: string) =>
	createSyncStore(storeId, valuesSchema, tablesSchema);

export type UserStore = Awaited<ReturnType<typeof setupUserStore>>;
