import * as z from 'zod';
import { GROUP_STORE_PREFIX } from '../stores/group';
import { USER_STORE_PREFIX } from '../stores/user';

const groupRowSchema = z.object({
	name: z.string(),
	joinedAt: z.number(),
	archivedAt: z.number().optional(),
});

const memberRowSchema = z.object({
	name: z.string(),
	joinedAt: z.number(),
	archivedAt: z.number().optional(),
});

const expenseRowSchema = z.object({
	amount: z.number(),
	currency: z.string(),
	category: z.string(),
	notes: z.string(),
	paidOn: z.number(),
	paidByMemberId: z.string(),
	createdAt: z.number(),
	updatedAt: z.number().optional(),
});

const splitRowSchema = z.object({
	expenseId: z.string(),
	memberId: z.string(),
	amount: z.number(),
	settledAt: z.number().optional(),
});

const groupStoreSchema = z.object({
	members: z.record(memberRowSchema),
	expenses: z.record(expenseRowSchema),
	splits: z.record(splitRowSchema),
});

export const exportDataSchema = z.object({
	exportedAt: z.string(),
	user: z.object({
		id: z.string(),
		hashedId: z.string(),
		name: z.string(),
	}),
	groups: z.record(groupRowSchema).optional(),
	groupStores: z.record(groupStoreSchema).optional(),
});

export type ExportData = z.infer<typeof exportDataSchema>;

/**
 * Detects if export data is full mode by checking for non-empty groupStores.
 * @param data - The parsed export data
 * @returns true if groupStores exists and has entries
 */
export function isFullExport(data: ExportData): boolean {
	return (
		data.groupStores !== undefined && Object.keys(data.groupStores).length > 0
	);
}

/**
 * Generates export filename in format `{name}-{mode}-{timestamp}.json`.
 * @param userName - User's display name (lowercased in output)
 * @param mode - Export mode: 'identity' or 'full'
 * @returns Filename string
 */
export function generateFilename(
	userName: string,
	mode: 'identity' | 'full',
): string {
	const now = new Date();
	const timestamp = [
		now.getFullYear(),
		String(now.getMonth() + 1).padStart(2, '0'),
		String(now.getDate()).padStart(2, '0'),
		'T',
		String(now.getHours()).padStart(2, '0'),
		String(now.getMinutes()).padStart(2, '0'),
		String(now.getSeconds()).padStart(2, '0'),
	].join('');

	return `${userName.toLowerCase()}-${mode}-${timestamp}.json`;
}

/**
 * Triggers browser download of JSON data as a file.
 * @param data - Export data object
 * @param fileName - Filename for the downloaded file
 */
export function downloadJson(data: ExportData, fileName: string): void {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Performs data import by writing to localStorage in TinyBase format.
 * @param data - Parsed export data
 * @param isFull - If true, clears all stores before writing
 * @returns The user store ID for activeUserStoreId
 */
export function performImport(data: ExportData, isFull: boolean): string {
	const userStoreId = `${USER_STORE_PREFIX}-${data.user.id}`;

	if (isFull) {
		clearAllStores();
	}

	writeStoreToLocalStorage(
		userStoreId,
		data.groups ? { groups: data.groups } : {},
		{
			id: data.user.id,
			hashedId: data.user.hashedId,
			name: data.user.name,
		},
	);

	if (isFull && data.groupStores) {
		for (const [groupId, groupData] of Object.entries(data.groupStores)) {
			const groupStoreId = `${GROUP_STORE_PREFIX}-${groupId}`;
			writeStoreToLocalStorage(
				groupStoreId,
				{
					members: groupData.members || {},
					expenses: groupData.expenses || {},
					splits: groupData.splits || {},
				},
				{},
			);
		}
	}

	return userStoreId;
}

function clearAllStores(): void {
	for (let i = localStorage.length - 1; i >= 0; i--) {
		const key = localStorage.key(i);
		if (
			key &&
			(key.startsWith(`${USER_STORE_PREFIX}-`) ||
				key.startsWith(`${GROUP_STORE_PREFIX}-`))
		) {
			localStorage.removeItem(key);
		}
	}
}

function toMergeableStoreFormat(
	tables: Record<string, Record<string, any>>,
	values: Record<string, any>,
) {
	// Plain format [tables, values] — the persister routes this through setContent
	// which accepts plain objects. Using the stamped/mergeable format would require
	// [value, hlc, checksum] tuples at every level (table, row, cell), which is
	// overkill for import where we don't have HLCs or conflict history.
	return [tables, values];
}

function writeStoreToLocalStorage(
	storeId: string,
	tables: Record<string, Record<string, any>>,
	values: Record<string, any>,
): void {
	localStorage.setItem(
		storeId,
		JSON.stringify(toMergeableStoreFormat(tables, values)),
	);
}
