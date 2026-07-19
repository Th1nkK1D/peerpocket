import { idHelper } from './id';

interface MinimalStore {
	hasRow(table: string, rowId: string): boolean;
	setRow(table: string, rowId: string, cell: Record<string, unknown>): unknown;
	delRow(table: string, rowId: string): unknown;
	getRow(table: string, rowId: string): Record<string, unknown> | undefined;
	getTable(table: string): Record<string, Record<string, unknown>> | undefined;
	setCell(
		table: string,
		rowId: string,
		cellId: string,
		value: unknown,
	): unknown;
}

export function createPlaceholder(group: MinimalStore, name: string): string {
	const id = `placeholder-${idHelper.generate()}`;
	group.setRow('members', id, {
		name,
		joinedAt: Date.now(),
		isPlaceholder: true,
	});
	return id;
}

export function claimPlaceholder(
	group: MinimalStore,
	placeholderId: string,
	hashedId: string,
) {
	if (!group.hasRow('members', placeholderId)) return;
	const old = group.getRow('members', placeholderId) ?? {};
	const claimedAt = Date.now();
	const existing = group.getRow('members', hashedId);
	group.setRow('claims', placeholderId, { hashedId, claimedAt });
	group.setRow('members', hashedId, {
		...existing,
		name: existing?.name ?? old.name,
		joinedAt: existing?.joinedAt ?? old.joinedAt,
		claimedAt,
	});
	group.delRow('members', placeholderId);
	cascadeForeignKeys(group, placeholderId, hashedId);
}

export function reconcileClaims(group: MinimalStore) {
	const claims = group.getTable('claims') ?? {};
	for (const [placeholderId, claim] of Object.entries(claims)) {
		const hashedId = claim.hashedId as string | undefined;
		if (!hashedId) continue;
		cascadeForeignKeys(group, placeholderId, hashedId);
	}
}

function cascadeForeignKeys(
	group: MinimalStore,
	fromMemberId: string,
	toMemberId: string,
) {
	const expenses = group.getTable('expenses') ?? {};
	for (const [id, exp] of Object.entries(expenses)) {
		if (exp?.paidByMemberId === fromMemberId) {
			group.setCell('expenses', id, 'paidByMemberId', toMemberId);
		}
	}
	const splits = group.getTable('splits') ?? {};
	for (const [id, split] of Object.entries(splits)) {
		if (split?.memberId === fromMemberId) {
			group.setCell('splits', id, 'memberId', toMemberId);
		}
	}
}
