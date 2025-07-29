import { createSyncStore } from '../hooks/sync-store';

export const GROUP_STORE_PREFIX = 'group';

const valuesSchema = {} as const;

const tablesSchema = {
	members: {
		hashedId: { type: 'string', default: '' },
		name: { type: 'string', default: '' },
		joinedAt: { type: 'number', default: 0 },
		archivedAt: { type: 'number' },
	},
	expenses: {
		id: { type: 'string', default: '' },
		amount: { type: 'number', default: 0 },
		currency: { type: 'string', default: '' },
		category: { type: 'string', default: '' },
		notes: { type: 'string', default: '' },
		paidOn: { type: 'number', default: 0 },
		paidByUserHashedId: { type: 'number', default: 0 },
		createdAt: { type: 'number', default: 0 },
		updatedAt: { type: 'number' },
	},
	splits: {
		transactionId: { type: 'string', default: '' },
		userIdHash: { type: 'number', default: 0 },
		amount: { type: 'number', default: 0 },
		settledAt: { type: 'number' },
	},
} as const;

export const setupGroupStore = (storeId: string) =>
	createSyncStore(storeId, valuesSchema, tablesSchema);
