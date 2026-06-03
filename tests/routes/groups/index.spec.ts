import { expect, test } from '@playwright/test';
import {
	buildFullGroupSeed,
	createUserFromLanding,
	gotoSeededRoute,
	openSpeedDialAction,
	tripGroup,
} from '../../mocks/playwright';

test('shows the empty state and speed dial actions', async ({ page }) => {
	await createUserFromLanding(page);

	await expect(page.getByText('No active group yet')).toBeVisible();

	await openSpeedDialAction(page, 'Create');
	await expect(page).toHaveURL(/\/groups\/create$/);

	await page.goto('/groups');
	await openSpeedDialAction(page, 'Join');
	await expect(page).toHaveURL(/\/groups\/scan$/);
});

test('opens groups from the list', async ({ page }) => {
	await gotoSeededRoute(page, '/groups', buildFullGroupSeed());

	await page.getByRole('heading', { name: tripGroup.name }).click();
	await expect(page).toHaveURL(
		new RegExp(`/groups/${tripGroup.id}[?&]tab=expenses`),
	);
});

test('removes groups from the list', async ({ page }) => {
	await gotoSeededRoute(page, '/groups', buildFullGroupSeed());

	await page.getByRole('button', { name: 'Group options' }).click();
	await page.getByRole('menuitem', { name: 'Remove' }).click();
	await expect(page.getByRole('dialog')).toContainText(
		`Remove ${tripGroup.name}?`,
	);
	await page.getByRole('button', { name: 'Remove' }).click();

	await expect(page.getByText('No active group yet')).toBeVisible();
});

test('archives a group', async ({ page }) => {
	await gotoSeededRoute(page, '/groups', buildFullGroupSeed());

	await page.getByRole('button', { name: 'Group options' }).click();
	await page.getByRole('menuitem', { name: 'Archive' }).click();

	await expect(page.getByText('No active group yet')).toBeVisible();

	await page.getByLabel('Filter groups').click();
	await page.getByRole('menuitem', { name: 'Archived' }).click();

	await expect(
		page.getByRole('heading', { name: tripGroup.name }),
	).toBeVisible();
});

test('unarchives a group', async ({ page }) => {
	await gotoSeededRoute(page, '/groups', buildFullGroupSeed());

	await page.getByRole('button', { name: 'Group options' }).click();
	await page.getByRole('menuitem', { name: 'Archive' }).click();

	await page.getByLabel('Filter groups').click();
	await page.getByRole('menuitem', { name: 'Archived' }).click();

	await page.getByRole('button', { name: 'Group options' }).click();
	await page.getByRole('menuitem', { name: 'Unarchive' }).click();

	await expect(page.getByText('No archived groups')).toBeVisible();

	await page.getByLabel('Filter groups').click();
	await page.getByRole('menuitem', { name: 'Active' }).click();

	await expect(
		page.getByRole('heading', { name: tripGroup.name }),
	).toBeVisible();
});

test('destroys local data from the menu', async ({ page }) => {
	await gotoSeededRoute(page, '/groups', buildFullGroupSeed());

	await page.getByRole('button', { name: 'Menu' }).click();
	await page.getByText('Log out').click();
	await expect(page.getByRole('dialog')).toContainText('Log out?');
	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect
		.poll(() =>
			page.evaluate(() => ({
				activeUserStoreId: localStorage.getItem('ACTIVE_USER_STORE_ID'),
				storageSize: localStorage.length,
			})),
		)
		.toEqual({
			activeUserStoreId: null,
			storageSize: 0,
		});
});
