import type { Page } from '@playwright/test';
import {
	GROUP_STORE_PREFIX,
	setupGroupStore,
} from '../../app/src/stores/group';
import { setupUserStore, USER_STORE_PREFIX } from '../../app/src/stores/user';
import { activeUserStoreId } from '../../app/src/utils/active-user';
import { idHelper } from '../../app/src/utils/id';

export type E2EMemberSeed = {
	id: string;
	name: string;
	joinedAt?: number;
	isPlaceholder?: boolean;
	claimedAt?: number;
	archivedAt?: number;
};

export type E2EClaimSeed = {
	placeholderId: string;
	hashedId: string;
	claimedAt?: number;
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
	claims?: E2EClaimSeed[];
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
	enableRelay?: boolean;
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
		__PEERPOCKET_E2E_STORES__?: Record<string, any>;
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
			const memberRow: Record<string, unknown> = {
				name: member.name,
				joinedAt: member.joinedAt ?? joinedAt,
			};
			if (member.isPlaceholder) memberRow.isPlaceholder = true;
			if (member.claimedAt) memberRow.claimedAt = member.claimedAt;
			groupStore.setRow('members', member.id, memberRow);
		}

		for (const claim of groupSeed.claims ?? []) {
			groupStore.setRow('claims', claim.placeholderId, {
				hashedId: claim.hashedId,
				claimedAt: claim.claimedAt ?? joinedAt,
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

export const now = new Date('2024-03-21T12:00:00.000Z').getTime();

export const baseUser = {
	id: 'user-alice',
	hashedId: 'hashed-alice',
	name: 'Alice',
};

export const bob = {
	id: 'hashed-bob',
	name: 'Bob',
};

export const chloe = {
	id: 'hashed-chloe',
	name: 'Chloe',
};

export const tripGroup = {
	id: 'group-trip',
	name: 'Trip',
	joinedAt: now,
};

function mergeE2EConfig(value: Partial<E2EConfig>) {
	window.__PEERPOCKET_E2E__ = {
		...(window.__PEERPOCKET_E2E__ ?? {}),
		...value,
	};
}

export async function installAppMocks(page: Page) {
	await page.addInitScript(() => {
		class ClipboardMock {
			value = '';

			async writeText(text: string) {
				this.value = text;
			}
		}

		Object.defineProperty(navigator, 'clipboard', {
			value: new ClipboardMock(),
			configurable: true,
		});
	});
}

export async function seedApp(page: Page, seed: E2ESeed = {}) {
	await page.addInitScript(mergeE2EConfig, { seed });
}

export async function mockScan(page: Page, scan: E2EScanConfig) {
	await page.addInitScript(mergeE2EConfig, { scan });
}

export async function gotoSeededRoute(
	page: Page,
	path: string,
	seed: E2ESeed = {},
) {
	await installAppMocks(page);
	await seedApp(page, { reset: true, ...seed });
	await page.goto(path);
}

export async function disableReseed(page: Page) {
	await page.addInitScript(() => {
		if (window.__PEERPOCKET_E2E__?.seed) {
			delete window.__PEERPOCKET_E2E__.seed;
		}
	});
}

type RawTables = Record<string, Record<string, Record<string, unknown>>>;

const TOMBSTONE = '\uFFFC';

function unwrapStampedTables(parsed: any): {
	tables: RawTables;
	valuesRoot: unknown;
} {
	const tablesRoot = Array.isArray(parsed?.[0]) ? parsed[0][0] : parsed[0];
	const valuesRoot = Array.isArray(parsed?.[1]) ? parsed[1][0] : parsed[1];
	const tables: RawTables = {};
	for (const [tableId, table] of Object.entries(tablesRoot ?? {})) {
		const rows = Array.isArray(table) ? table[0] : table;
		if (!rows || typeof rows !== 'object') continue;
		const outRows: Record<string, Record<string, unknown>> = {};
		for (const [rowId, row] of Object.entries(
			rows as Record<string, unknown>,
		)) {
			const cells = Array.isArray(row) ? row[0] : row;
			if (!cells || typeof cells !== 'object') continue;
			const outCells: Record<string, unknown> = {};
			for (const [cellId, cell] of Object.entries(
				cells as Record<string, unknown>,
			)) {
				const value = Array.isArray(cell) ? cell[0] : cell;
				if (value === TOMBSTONE || value === null) continue;
				outCells[cellId] = value;
			}
			if (Object.keys(outCells).length > 0) outRows[rowId] = outCells;
		}
		tables[tableId] = outRows;
	}
	return { tables, valuesRoot };
}

export async function readGroupStoreTables(
	page: Page,
	groupId: string,
): Promise<RawTables> {
	const key = `${GROUP_STORE_PREFIX}-${groupId}`;
	const raw = await page.evaluate((k) => localStorage.getItem(k), key);
	if (!raw) throw new Error(`No group store at ${key}`);
	return unwrapStampedTables(JSON.parse(raw)).tables;
}

export async function injectOfflineExpense(
	page: Page,
	groupId: string,
	expense: E2EExpenseSeed,
	split: E2ESplitSeed,
) {
	await page.evaluate(
		({ key, expense, split }) => {
			const store = window.__PEERPOCKET_E2E_STORES__?.[key];
			if (!store) throw new Error(`No E2E store at ${key}`);
			store.setRow('expenses', expense.id, {
				amount: expense.amount,
				currency: expense.currency ?? '',
				category: expense.category,
				notes: expense.notes ?? '',
				paidOn: expense.paidOn,
				paidByMemberId: expense.paidByMemberId,
				createdAt: expense.createdAt ?? expense.paidOn,
			});
			store.setRow('splits', split.id, {
				expenseId: split.expenseId,
				memberId: split.memberId,
				amount: split.amount,
			});
		},
		{
			key: `${GROUP_STORE_PREFIX}-${groupId}`,
			expense,
			split,
		},
	);
}

export async function createUserFromLanding(page: Page, name = 'Alice') {
	await installAppMocks(page);
	await page.goto('/');
	await page.getByLabel('Enter your name').fill(name);
	await page.getByRole('button', { name: 'Get started' }).click();
	await page.getByRole('button', { name: 'Skip' }).click();
}

export async function openSpeedDialAction(
	page: Page,
	name: string,
	dialLabel = 'Group actions',
) {
	// Hover to open the SpeedDial rather than click: a click both hovers (open)
	// and toggles (close), which races and can leave the menu shut under load.
	await page.getByLabel(dialLabel).hover();
	await page.getByRole('menuitem', { name }).click();
}

export async function fillSampleExpense(
	page: Page,
	values?: { notes?: string },
) {
	await page.getByLabel('Total').fill('90');
	await page.getByLabel('Notes').fill(values?.notes ?? 'Dinner');
	await page.getByRole('button', { name: 'Next' }).click();
}

export async function expectOnExpenses(page: Page, groupId = tripGroup.id) {
	await page.waitForURL(new RegExp(`/groups/${groupId}[?&]tab=expenses`));
}

export function buildFullGroupSeed(): E2ESeed {
	return {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [
					{
						id: baseUser.hashedId,
						name: baseUser.name,
						joinedAt: now,
					},
					{
						id: bob.id,
						name: bob.name,
						joinedAt: now - 1000,
					},
					{
						id: chloe.id,
						name: chloe.name,
						joinedAt: now - 2000,
					},
				],
				expenses: [
					{
						id: 'expense-dinner',
						amount: 90,
						currency: '',
						category: 'Food',
						notes: 'Dinner',
						paidOn: now,
						paidByMemberId: baseUser.hashedId,
						createdAt: now,
					},
					{
						id: 'expense-cab',
						amount: 30,
						currency: '',
						category: 'Transport',
						notes: 'Cab',
						paidOn: now - 86400000,
						paidByMemberId: bob.id,
						createdAt: now - 86400000,
					},
				],
				splits: [
					{
						id: 'split-dinner-alice',
						expenseId: 'expense-dinner',
						memberId: baseUser.hashedId,
						amount: 30,
					},
					{
						id: 'split-dinner-bob',
						expenseId: 'expense-dinner',
						memberId: bob.id,
						amount: 30,
					},
					{
						id: 'split-dinner-chloe',
						expenseId: 'expense-dinner',
						memberId: chloe.id,
						amount: 30,
					},
					{
						id: 'split-cab-alice',
						expenseId: 'expense-cab',
						memberId: baseUser.hashedId,
						amount: 15,
					},
					{
						id: 'split-cab-bob',
						expenseId: 'expense-cab',
						memberId: bob.id,
						amount: 15,
					},
				],
			},
		],
	};
}
