import { expect, test } from '@playwright/test';
import {
	baseUser,
	buildFullGroupSeed,
	gotoSeededRoute,
	installAppMocks,
} from './helpers';

test('creates a user and redirect to groups page', async ({ page }) => {
	await installAppMocks(page);
	await page.goto('/');

	await page.getByLabel('Enter your name').fill(baseUser.name);
	await page.getByRole('button', { name: 'Get started' }).click();

	await expect(page).toHaveURL(/\/groups$/);
	await expect(page.getByText('You have no groups yet.')).toBeVisible();
});

test('redirects away from the landing route when there is an active user', async ({
	page,
}) => {
	await gotoSeededRoute(page, '/', buildFullGroupSeed());

	await expect(page).toHaveURL(/\/groups$/);
	await expect(page.getByRole('heading', { name: 'PeerPocket' })).toBeVisible();
});
