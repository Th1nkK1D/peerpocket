import { expect, test } from '@playwright/test';
import {
	buildFullGroupSeed,
	gotoSeededRoute,
	tripGroup,
} from '../../../mocks/playwright';

test('renders the group layout and tab navigation', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/expenses`,
		buildFullGroupSeed(),
	);

	await expect(
		page.getByRole('heading', { name: tripGroup.name }),
	).toBeVisible();

	await page.getByRole('tab', { name: 'Summary' }).click();
	await expect(page).toHaveURL(new RegExp(`/groups/${tripGroup.id}/summary$`));

	await page.getByRole('tab', { name: 'Expenses' }).click();
	await expect(page).toHaveURL(new RegExp(`/groups/${tripGroup.id}/expenses$`));

	await page.getByRole('tab', { name: 'Members' }).click();
	await expect(page).toHaveURL(new RegExp(`/groups/${tripGroup.id}/members$`));
});

test('redirects away when the active user is not in the group list', async ({
	page,
}) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}/expenses`, {
		user: {
			id: 'user-alice',
			hashedId: 'hashed-alice',
			name: 'Alice',
		},
	});

	await expect(page).toHaveURL(/\/groups$/);
});
