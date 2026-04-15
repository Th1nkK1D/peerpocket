import { expect, test } from '@playwright/test';
import {
	buildFullGroupSeed,
	clickSwipeAction,
	createUserFromLanding,
	gotoSeededRoute,
	openSpeedDialAction,
	tripGroup,
} from '../../mocks/playwright';

test('shows the empty state and speed dial actions', async ({ page }) => {
	await createUserFromLanding(page);

	await expect(page.getByText('You have no groups yet.')).toBeVisible();

	await openSpeedDialAction(page, 'Create');
	await expect(page).toHaveURL(/\/groups\/create$/);

	await page.goto('/groups');
	await openSpeedDialAction(page, 'Join');
	await expect(page).toHaveURL(/\/groups\/scan$/);
});

test('opens groups from the list', async ({ page }) => {
	await gotoSeededRoute(page, '/groups', buildFullGroupSeed());

	await page.getByRole('heading', { name: tripGroup.name }).click();
	await expect(page).toHaveURL(new RegExp(`/groups/${tripGroup.id}/expenses$`));
});

test('removes groups from the list', async ({ page }) => {
	await gotoSeededRoute(page, '/groups', buildFullGroupSeed());

	await clickSwipeAction(page, 'Remove', { itemText: tripGroup.name });
	await expect(page.getByRole('dialog')).toContainText(
		`Remove ${tripGroup.name}?`,
	);
	await page.getByRole('button', { name: 'Remove' }).click();

	await expect(page.getByText('You have no groups yet.')).toBeVisible();
});

test('destroys local data from the menu', async ({ page }) => {
	await gotoSeededRoute(page, '/groups', buildFullGroupSeed());

	await page.getByRole('button', { name: 'Menu' }).click();
	await page.getByText('Destroy data').click();
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
