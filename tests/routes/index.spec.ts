import { expect, test } from '@playwright/test';

import {
	baseUser,
	buildFullGroupSeed,
	gotoSeededRoute,
	installAppMocks,
	offerInstallPrompt,
} from '../mocks/playwright';

test('creates a user and redirect to groups page', async ({ page }) => {
	await installAppMocks(page);
	await page.goto('/');

	await page.getByLabel('Enter your name').fill(baseUser.name);
	await page.getByRole('button', { name: 'Get started' }).click();

	await expect(page.getByText('Save Your Identity')).toBeVisible();
	await page.getByRole('button', { name: 'Skip' }).click();

	await expect(page).toHaveURL(/\/groups$/);
	await expect(page.getByText('No active group yet')).toBeVisible();
});

test('creates a user and downloads identity file', async ({ page }) => {
	await installAppMocks(page);
	await page.goto('/');

	await page.getByLabel('Enter your name').fill(baseUser.name);
	await page.getByRole('button', { name: 'Get started' }).click();

	await expect(page.getByText('Save Your Identity')).toBeVisible();

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Save Identity' }).click(),
	]);

	const content = await (await download.createReadStream()).toArray();
	const json = JSON.parse(Buffer.concat(content).toString('utf-8'));

	expect(json.user.name).toBe(baseUser.name);
	expect(json.user.id).toBeTruthy();
	expect(json.user.hashedId).toBeTruthy();
	expect(json.groups).toBeUndefined();
	expect(json.groupStores).toBeUndefined();
	expect(typeof json.exportedAt).toBe('string');

	await expect(page).toHaveURL(/\/groups$/);
});

test('nudges to install with the reason without blocking sign up', async ({
	page,
}) => {
	await installAppMocks(page);
	await page.goto('/');

	const nudge = page.getByTestId('install-nudge');
	await expect(nudge).toContainText('Install PeerPocket before you start');
	await expect(nudge).toContainText('can be wiped');
	await expect(nudge).toContainText('Look in your browser menu');
	await expect(nudge).toContainText('Already installed?');
	await expect(nudge).not.toContainText('invitation');
	await expect(page.getByLabel('Enter your name')).toBeVisible();
});

test('shows the install button when the browser offers a prompt', async ({
	page,
}) => {
	await installAppMocks(page);
	await page.goto('/groups/join?id=g1&name=Trip');

	const nudge = page.getByTestId('install-nudge');
	await expect(nudge).toContainText("invitation won't carry over");

	await offerInstallPrompt(page);
	await expect(nudge).not.toContainText('Already installed?');
	await nudge.getByRole('button', { name: 'Install app' }).click();
	await expect(nudge).toContainText('PeerPocket is installed');
	await expect(nudge).toContainText('keep a backup with Export data');
	await expect(nudge).toContainText("invitation won't carry over");

	await page.reload();
	await expect(nudge).toContainText('PeerPocket is installed');

	await offerInstallPrompt(page);
	await expect(nudge).toContainText('Install PeerPocket before you start');
});

test.describe('in an Android in-app browser', () => {
	test.use({
		userAgent:
			'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0 Mobile Safari/537.36',
	});

	test('copies the current link', async ({ page }) => {
		await installAppMocks(page);
		await page.goto('/groups/join?id=g1&name=Trip');

		const nudge = page.getByTestId('install-nudge');
		await expect(nudge).toContainText('open this page in Chrome');

		await nudge.getByRole('button', { name: 'Copy link' }).click();
		await expect(page.getByText('Link copied')).toBeVisible();
		expect(
			await page.evaluate(
				() => (navigator.clipboard as { value?: string }).value,
			),
		).toBe(page.url());
	});

	test('shows the link for manual copy when the clipboard fails', async ({
		page,
	}) => {
		await installAppMocks(page);
		await page.goto('/');
		await page.evaluate(() => {
			navigator.clipboard.writeText = () => Promise.reject(new Error('denied'));
		});

		await page
			.getByTestId('install-nudge')
			.getByRole('button', { name: 'Copy link' })
			.click();

		await expect(page.getByLabel('Copy this link')).toHaveValue(page.url());
		await expect(page.getByText('Link copied')).toBeHidden();
	});
});

test('hides the install nudge when running as installed app', async ({
	page,
}) => {
	await installAppMocks(page);
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'standalone', { value: true });
	});
	await page.goto('/');

	await expect(page.getByLabel('Enter your name')).toBeVisible();
	await expect(page.getByTestId('install-nudge')).toBeHidden();
});

test('redirects away from the landing route when there is an active user', async ({
	page,
}) => {
	await gotoSeededRoute(page, '/', buildFullGroupSeed());

	await expect(page).toHaveURL(/\/groups$/);
	await expect(page.getByRole('heading', { name: 'PeerPocket' })).toBeVisible();
});

test('keeps the invite when an active user opens a landing invite link', async ({
	page,
}) => {
	const params = encodeURIComponent(
		JSON.stringify({ id: 'group-party', name: 'Party' }),
	);
	await gotoSeededRoute(
		page,
		`/?path=/groups/join&params=${params}`,
		buildFullGroupSeed(),
	);

	await expect(page).toHaveURL(/\/groups\/join\?id=group-party&name=Party$/);
});

test('ignores a landing redirect path outside the groups routes', async ({
	page,
}) => {
	await gotoSeededRoute(
		page,
		`/?path=${encodeURIComponent('https://example.com')}`,
		buildFullGroupSeed(),
	);

	await expect(page).toHaveURL(/\/groups$/);
});
