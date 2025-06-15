import { createSyncStore } from './factory';

const valuesSchema = {} as const;

const tablesSchema = {
	groups: {
		name: { type: 'string' },
	},
} as const;

export const useUserStore = createSyncStore('user', valuesSchema, tablesSchema);
