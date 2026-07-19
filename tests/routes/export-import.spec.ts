import { expect, test } from '@playwright/test';
import {
	baseUser,
	buildFullGroupSeed,
	disableReseed,
	gotoSeededRoute,
	installAppMocks,
	now,
	readGroupStoreTables,
	tripGroup,
} from '../mocks/playwright';

test('export page renders with mode selection', async ({ page }) => {
	await gotoSeededRoute(page, '/groups/export', buildFullGroupSeed());

	await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible();
	await expect(page.getByText('Full Export')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Export' })).toBeDisabled();
});

test('exports identity JSON via download', async ({ page }) => {
	await gotoSeededRoute(page, '/groups/export', buildFullGroupSeed());

	await page.getByRole('heading', { name: 'Identity' }).click();
	await expect(page.getByRole('button', { name: 'Export' })).toBeEnabled();

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Export' }).click(),
	]);

	const content = await (await download.createReadStream()).toArray();
	const json = JSON.parse(Buffer.concat(content).toString('utf-8'));

	expect(json.user.name).toBe(baseUser.name);
	expect(json.user.id).toBe(baseUser.id);
	expect(json.groups).toBeUndefined();
	expect(json.groupStores).toBeUndefined();
	expect(typeof json.exportedAt).toBe('string');
});

test('exports full JSON with group stores via download', async ({ page }) => {
	await gotoSeededRoute(page, '/groups/export', buildFullGroupSeed());

	await page.getByText('Full Export').click();
	await expect(page.getByRole('button', { name: 'Export' })).toBeEnabled();

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Export' }).click(),
	]);

	const content = await (await download.createReadStream()).toArray();
	const json = JSON.parse(Buffer.concat(content).toString('utf-8'));

	expect(json.user.name).toBe(baseUser.name);
	expect(Object.keys(json.groups).length).toBeGreaterThan(0);
	expect(json.groupStores).toBeDefined();

	const groupId = Object.keys(json.groups)[0];
	const store = json.groupStores[groupId];
	expect(store.members).toBeDefined();
	expect(store.expenses).toBeDefined();
	expect(store.splits).toBeDefined();

	const memberId = Object.keys(store.members)[0];
	const member = store.members[memberId];
	expect(typeof member.name).toBe('string');
	expect(typeof member.joinedAt).toBe('number');
});

test('import success flow: upload user-data JSON, confirm, see groups', async ({
	page,
}) => {
	await installAppMocks(page);
	await page.goto('/');

	const exportJson = {
		exportedAt: new Date().toISOString(),
		user: {
			id: 'import-test-user',
			hashedId: 'hashed-import-test',
			name: 'Import Test',
		},
		groups: {
			'group-import-test': {
				name: 'Imported Group',
				joinedAt: Date.now(),
			},
		},
	};

	await page.setInputFiles('input[type="file"]', {
		name: 'test-import.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(exportJson)),
	});

	await expect(page.getByText('Import Data')).toBeVisible();
	await expect(page.getByText('User Name: Import Test')).toBeVisible();

	await page.getByRole('button', { name: 'Import' }).click();

	await expect(page).toHaveURL(/\/groups$/);

	await page.getByLabel('Menu').click();
	await expect(page.getByText('Import Test')).toBeVisible();
});

test('import shows dialog for full export and confirms with replace warning', async ({
	page,
}) => {
	await installAppMocks(page);
	await page.goto('/');

	const exportJson = {
		exportedAt: new Date().toISOString(),
		user: {
			id: 'full-import-user',
			hashedId: 'hashed-full-import',
			name: 'Full Import',
		},
		groups: {
			'group-full-1': {
				name: 'Full Group',
				joinedAt: Date.now(),
			},
		},
		groupStores: {
			'group-full-1': {
				members: {
					'hashed-full-import': {
						name: 'Full Import',
						joinedAt: Date.now(),
					},
				},
				expenses: {},
				splits: {},
			},
		},
	};

	await page.setInputFiles('input[type="file"]', {
		name: 'test-full-import.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(exportJson)),
	});

	await expect(page.getByText('Import Data')).toBeVisible();
	await expect(page.getByText('Mode: Full Export')).toBeVisible();
	await expect(
		page.getByText('This will replace all existing data on this device.'),
	).toBeVisible();

	await page.getByRole('button', { name: 'Import' }).click();

	await expect(page).toHaveURL(/\/groups$/);
	await page.getByLabel('Menu').click();
	await expect(page.getByText('Full Import')).toBeVisible();
});

test('import cancel closes dialog without navigating', async ({ page }) => {
	await installAppMocks(page);
	await page.goto('/');

	const exportJson = {
		exportedAt: new Date().toISOString(),
		user: { id: 'cancel-user', hashedId: 'hashed-cancel', name: 'Cancel' },
		groups: {},
	};

	await page.setInputFiles('input[type="file"]', {
		name: 'test-cancel.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(exportJson)),
	});

	await expect(page.getByText('Import Data')).toBeVisible();
	await page.getByRole('button', { name: 'Cancel' }).click();

	await expect(page.getByText('Import Data')).not.toBeVisible();
	await expect(page.getByLabel('Enter your name')).toBeVisible();
});

test('import invalid JSON shows error message', async ({ page }) => {
	await installAppMocks(page);
	await page.goto('/');

	await page.setInputFiles('input[type="file"]', {
		name: 'invalid.json',
		mimeType: 'application/json',
		buffer: Buffer.from('not valid json'),
	});

	await expect(
		page.getByText('Import failed: invalid file format'),
	).toBeVisible();
});

test('import JSON with wrong schema shows error', async ({ page }) => {
	await installAppMocks(page);
	await page.goto('/');

	await page.setInputFiles('input[type="file"]', {
		name: 'wrong-schema.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify({ not: 'valid' })),
	});

	await expect(
		page.getByText('Import failed: invalid file format'),
	).toBeVisible();
});

test('import full data shows group on groups page', async ({ page }) => {
	await installAppMocks(page);
	await page.goto('/');

	const now = Date.now();
	const exportJson = {
		exportedAt: new Date().toISOString(),
		user: {
			id: 'full-group-test',
			hashedId: 'hashed-full-group-test',
			name: 'FullGroupTest',
		},
		groups: {
			'group-show': {
				name: 'ShowGroup',
				joinedAt: now,
			},
		},
		groupStores: {
			'group-show': {
				members: {
					'hashed-full-group-test': {
						name: 'FullGroupTest',
						joinedAt: now,
					},
				},
				expenses: {},
				splits: {},
			},
		},
	};

	await page.setInputFiles('input[type="file"]', {
		name: 'test-group-show.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(exportJson)),
	});

	await expect(page.getByText('Import Data')).toBeVisible();
	await page.getByRole('button', { name: 'Import' }).click();

	await expect(page).toHaveURL(/\/groups$/);
	await expect(page.getByRole('heading', { name: 'ShowGroup' })).toBeVisible();
});

test('full round-trip: export full, then import on fresh landing', async ({
	browser,
	page,
}) => {
	// Step 1: Export full data from a seeded page
	await gotoSeededRoute(page, '/groups/export', buildFullGroupSeed());

	await page.getByText('Full Export').click();
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Export' }).click(),
	]);

	const content = await (await download.createReadStream()).toArray();
	const exportedBuffer = Buffer.concat(content);

	const exportedJson = JSON.parse(exportedBuffer.toString('utf-8'));
	expect(exportedJson.user.name).toBe(baseUser.name);
	expect(exportedJson.groupStores).toBeDefined();
	const firstGroupId = Object.keys(exportedJson.groups)[0];
	expect(firstGroupId).toBeTruthy();
	const store = exportedJson.groupStores[firstGroupId];
	expect(store.members).toBeDefined();
	// Cell values should be plain (unwrapped from TinyBase stamps)
	const firstMember = Object.values(store.members)[0] as any;
	expect(typeof firstMember.name).toBe('string');

	// Step 2: Import into a fresh context (simulating a completely new session)
	const freshContext = await browser.newContext();
	const freshPage = await freshContext.newPage();

	await installAppMocks(freshPage);
	await freshPage.goto('/');

	await freshPage.setInputFiles('input[type="file"]', {
		name: 'roundtrip.json',
		mimeType: 'application/json',
		buffer: exportedBuffer,
	});

	await expect(freshPage.getByText('Import Data')).toBeVisible();
	await freshPage.getByRole('button', { name: 'Import' }).click();

	// Step 3: Verify imported data
	await expect(freshPage).toHaveURL(/\/groups$/);
	await expect(freshPage.getByRole('heading', { name: 'Trip' })).toBeVisible();

	await freshPage.getByLabel('Menu').click();
	await expect(freshPage.getByText(baseUser.name)).toBeVisible();

	await freshContext.close();
});

test('import placeholder and claims ledger in consistent post-claim state', async ({
	browser,
}) => {
	const importedAt = Date.now();
	const placeholderSeed = {
		exportedAt: new Date().toISOString(),
		user: {
			id: baseUser.id,
			hashedId: baseUser.hashedId,
			name: baseUser.name,
		},
		groups: {
			[tripGroup.id]: {
				name: tripGroup.name,
				joinedAt: importedAt,
			},
		},
		groupStores: {
			[tripGroup.id]: {
				members: {
					[baseUser.hashedId]: {
						name: baseUser.name,
						joinedAt: importedAt,
					},
					'placeholder-dan': {
						name: 'Dan',
						joinedAt: importedAt - 1000,
						isPlaceholder: true,
					},
				},
				claims: {
					'placeholder-erin': {
						hashedId: 'hashed-bob',
						claimedAt: importedAt - 500,
					},
				},
				expenses: {},
				splits: {},
			},
		},
	};

	const freshContext = await browser.newContext();
	const freshPage = await freshContext.newPage();

	await installAppMocks(freshPage);
	await freshPage.goto('/');

	await freshPage.setInputFiles('input[type="file"]', {
		name: 'placeholder-import.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(placeholderSeed)),
	});

	await expect(freshPage.getByText('Import Data')).toBeVisible();
	await freshPage.getByRole('button', { name: 'Import' }).click();

	await expect(freshPage).toHaveURL(/\/?groups$/);

	const tables = await readGroupStoreTables(freshPage, tripGroup.id);
	expect(tables.members?.['placeholder-dan']?.isPlaceholder).toBe(true);
	expect(tables.claims?.['placeholder-erin']?.hashedId).toBe('hashed-bob');

	await freshPage.goto(`/groups/${tripGroup.id}?tab=members`);
	await expect(
		freshPage.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toBeVisible();
	await expect(freshPage.getByText('Not joined yet')).toBeVisible();

	await freshContext.close();
});

test('full round-trip: claim, export, import on fresh device keeps claims and retargeted FKs', async ({
	browser,
}) => {
	const contextA = await browser.newContext();
	const pageA = await contextA.newPage();

	await gotoSeededRoute(pageA, `/groups/${tripGroup.id}?tab=members`, {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [
					{ id: baseUser.hashedId, name: baseUser.name, joinedAt: now },
					{
						id: 'placeholder-dan',
						name: 'Dan',
						joinedAt: now + 60000,
						isPlaceholder: true,
					},
				],
				expenses: [
					{
						id: 'exp-1',
						amount: 60,
						category: 'Food',
						notes: 'Dinner',
						paidOn: now,
						paidByMemberId: 'placeholder-dan',
					},
				],
				splits: [
					{
						id: 'split-1',
						expenseId: 'exp-1',
						memberId: 'placeholder-dan',
						amount: 30,
					},
					{
						id: 'split-2',
						expenseId: 'exp-1',
						memberId: baseUser.hashedId,
						amount: 30,
					},
				],
			},
		],
	});

	await pageA
		.getByRole('listitem')
		.filter({ hasText: 'Dan' })
		.getByRole('button', { name: 'Member actions' })
		.click();
	await pageA.getByRole('menuitem', { name: 'Claim as me' }).click();
	await pageA.getByRole('button', { name: 'Claim' }).click();
	await expect(
		pageA.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toHaveCount(0);

	await disableReseed(pageA);
	await pageA.goto('/groups/export');
	await pageA.getByText('Full Export').click();
	const [download] = await Promise.all([
		pageA.waitForEvent('download'),
		pageA.getByRole('button', { name: 'Export' }).click(),
	]);
	const chunks = await (await download.createReadStream()).toArray();
	const exportBuffer = Buffer.concat(chunks);

	await contextA.close();

	const freshContext = await browser.newContext();
	const freshPage = await freshContext.newPage();

	await installAppMocks(freshPage);
	await freshPage.goto('/');
	await freshPage.setInputFiles('input[type="file"]', {
		name: 'round-trip.json',
		mimeType: 'application/json',
		buffer: exportBuffer,
	});
	await expect(freshPage.getByText('Import Data')).toBeVisible();
	await freshPage.getByRole('button', { name: 'Import' }).click();
	await expect(freshPage).toHaveURL(/\/?groups$/);

	const tables = await readGroupStoreTables(freshPage, tripGroup.id);
	expect(tables.claims?.['placeholder-dan']?.hashedId).toBe(baseUser.hashedId);
	expect(tables.members?.['placeholder-dan']).toBeUndefined();
	expect(tables.members?.[baseUser.hashedId]?.name).toBe(baseUser.name);
	expect(tables.members?.[baseUser.hashedId]?.joinedAt).toBe(now);
	expect(tables.expenses?.['exp-1']?.paidByMemberId).toBe(baseUser.hashedId);
	expect(tables.splits?.['split-1']?.memberId).toBe(baseUser.hashedId);
	expect(tables.splits?.['split-2']?.memberId).toBe(baseUser.hashedId);

	await freshContext.close();
});
