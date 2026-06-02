import { expect, test } from '@playwright/test';
import {
	baseUser,
	buildFullGroupSeed,
	gotoSeededRoute,
	installAppMocks,
} from '../mocks/playwright';

test('creates a user and redirect to groups page', async ({ page }) => {
	await installAppMocks(page);
	await page.goto('/');

	await page.getByLabel('Enter your name').fill(baseUser.name);
	await page.getByRole('button', { name: 'Get started' }).click();

	await expect(page.getByText('Save Your Identity')).toBeVisible();
	await page.getByRole('button', { name: 'Skip' }).click();

	await expect(page).toHaveURL(/\/groups$/);
	await expect(page.getByText('You have no groups yet.')).toBeVisible();
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

test('redirects away from the landing route when there is an active user', async ({
	page,
}) => {
	await gotoSeededRoute(page, '/', buildFullGroupSeed());

	await expect(page).toHaveURL(/\/groups$/);
	await expect(
		page.getByRole('heading', { name: 'Your Groups' }),
	).toBeVisible();
});
