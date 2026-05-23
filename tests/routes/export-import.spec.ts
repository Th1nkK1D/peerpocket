import { expect, test } from '@playwright/test';
import {
	baseUser,
	buildFullGroupSeed,
	gotoSeededRoute,
	installAppMocks,
} from '../mocks/playwright';

test('export page renders with mode selection', async ({ page }) => {
	await gotoSeededRoute(page, '/groups/export', buildFullGroupSeed());

	await expect(page.getByText('User Data Only')).toBeVisible();
	await expect(page.getByText('Full Export')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Export' })).toBeDisabled();
});

test('exports user data only JSON via download', async ({ page }) => {
	await gotoSeededRoute(page, '/groups/export', buildFullGroupSeed());

	await page.getByText('User Data Only').click();
	await expect(page.getByRole('button', { name: 'Export' })).toBeEnabled();

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Export' }).click(),
	]);

	const content = await (await download.createReadStream()).toArray();
	const json = JSON.parse(Buffer.concat(content).toString('utf-8'));

	expect(json.user.name).toBe(baseUser.name);
	expect(json.user.id).toBe(baseUser.id);
	expect(Object.keys(json.groups).length).toBeGreaterThan(0);
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
	await expect(page.getByText('Groups: 1')).toBeVisible();

	await page.getByRole('button', { name: 'Import' }).click();

	await expect(page).toHaveURL(/\/groups$/);

	await page.getByLabel('Menu').click();
	await expect(page.getByText('Hi, Import Test')).toBeVisible();
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
	await expect(page.getByText('Hi, Full Import')).toBeVisible();
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
	await expect(freshPage.getByText(`Hi, ${baseUser.name}`)).toBeVisible();

	await freshContext.close();
});
