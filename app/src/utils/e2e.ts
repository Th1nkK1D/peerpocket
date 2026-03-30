import { GROUP_STORE_PREFIX, setupGroupStore } from '../stores/group';
import { setupUserStore, USER_STORE_PREFIX } from '../stores/user';
import { activeUserStoreId } from './active-user';
import { idHelper } from './id';

export type E2EMemberSeed = {
	id: string;
	name: string;
	joinedAt?: number;
	archivedAt?: number;
};

export type E2EExpenseSeed = {
	id: string;
	amount: number;
	currency?: string;
	category: string;
	notes?: string;
	paidOn: number;
	paidByMemberId: string;
	createdAt?: number;
	updatedAt?: number;
};

export type E2ESplitSeed = {
	id: string;
	expenseId: string;
	memberId: string;
	amount: number;
	settledAt?: number;
};

export type E2EGroupSeed = {
	id: string;
	name: string;
	joinedAt?: number;
	members?: E2EMemberSeed[];
	expenses?: E2EExpenseSeed[];
	splits?: E2ESplitSeed[];
};

export type E2EUserSeed = {
	id: string;
	name: string;
	hashedId?: string;
};

export type E2ESeed = {
	reset?: boolean;
	user?: E2EUserSeed;
	groups?: E2EGroupSeed[];
};

export type E2EScanConfig = {
	detectedCodes?: string[];
	error?: string;
};

export type E2EConfig = {
	seed?: E2ESeed;
	scan?: E2EScanConfig;
};

declare global {
	interface Window {
		__PEERPOCKET_E2E__?: E2EConfig;
	}
}

export function getE2EConfig() {
	return window.__PEERPOCKET_E2E__;
}

export async function initializeE2E() {
	const seed = getE2EConfig()?.seed;

	if (!seed) {
		return;
	}

	if (seed.reset) {
		localStorage.clear();
	}

	if (!seed.user) {
		return;
	}

	const joinedAt = Date.now();
	const userStoreId = idHelper.createStoreId(USER_STORE_PREFIX, seed.user.id);
	const hashedId = seed.user.hashedId ?? (await idHelper.hash(seed.user.id));
	const userStore = await setupUserStore(userStoreId);

	userStore.setValues({
		id: seed.user.id,
		hashedId,
		name: seed.user.name,
	});

	for (const groupSeed of seed.groups ?? []) {
		userStore.setRow('groups', groupSeed.id, {
			name: groupSeed.name,
			joinedAt: groupSeed.joinedAt ?? joinedAt,
		});

		const groupStore = await setupGroupStore(
			idHelper.createStoreId(GROUP_STORE_PREFIX, groupSeed.id),
		);

		for (const member of groupSeed.members ?? []) {
			groupStore.setRow('members', member.id, {
				name: member.name,
				joinedAt: member.joinedAt ?? joinedAt,
				archivedAt: member.archivedAt,
			});
		}

		for (const expense of groupSeed.expenses ?? []) {
			groupStore.setRow('expenses', expense.id, {
				amount: expense.amount,
				currency: expense.currency ?? '',
				category: expense.category,
				notes: expense.notes ?? '',
				paidOn: expense.paidOn,
				paidByMemberId: expense.paidByMemberId,
				createdAt: expense.createdAt ?? expense.paidOn,
				updatedAt: expense.updatedAt,
			});
		}

		for (const split of groupSeed.splits ?? []) {
			groupStore.setRow('splits', split.id, {
				expenseId: split.expenseId,
				memberId: split.memberId,
				amount: split.amount,
				settledAt: split.settledAt,
			});
		}
	}

	activeUserStoreId.set(userStoreId);
}
