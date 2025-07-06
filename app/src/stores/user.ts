import { createSyncStore } from './factory';

export const USER_STORE_PREFIX = 'user';

const valuesSchema = {
	id: { type: 'string', default: '' },
	hashedId: { type: 'string', default: '' },
	name: { type: 'string', default: '' },
} as const;

const tablesSchema = {
	groups: {
		id: { type: 'string', default: '' },
		name: { type: 'string', default: '' },
		joinedAt: { type: 'number', default: 0 },
		archivedAt: { type: 'number' },
	},
} as const;

export const setupUserStore = (storeId: string) =>
	createSyncStore(storeId, valuesSchema, tablesSchema);

export type UserStore = ReturnType<typeof setupUserStore>;
