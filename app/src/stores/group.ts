import { createSyncStore } from './factory';

export const GROUP_STORE_PREFIX = 'group';

const valuesSchema = {
	id: { type: 'string', default: '' },
	name: { type: 'string', default: '' },
} as const;

const tablesSchema = {
	members: {
		name: { type: 'string', default: '' },
		hashedId: { type: 'string', default: '' },
		joinedAt: { type: 'number', default: 0 },
		archivedAt: { type: 'number' },
	},
} as const;

export const setupGroupStore = (storeId: string) =>
	createSyncStore(storeId, valuesSchema, tablesSchema);
