import { expect, test } from '@playwright/test';
import {
	bob,
	buildFullGroupSeed,
	gotoSeededRoute,
	tripGroup,
} from '../../../mocks/playwright';

test('redirects the bare group route to expenses', async ({ page }) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}`, buildFullGroupSeed());

	await expect(page).toHaveURL(
		new RegExp(`/groups/${tripGroup.id}[?&]tab=expenses`),
	);
});

test('scrolls to the panel of the selected bottom tab', async ({ page }) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}`, buildFullGroupSeed());

	await page.getByRole('button', { name: 'Members' }).click();

	await expect(page).toHaveURL(/tab=members/);
	await expect(
		page.getByRole('listitem').filter({ hasText: bob.name }).last(),
	).toBeInViewport();
});
