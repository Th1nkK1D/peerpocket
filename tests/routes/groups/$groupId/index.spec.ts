import { expect, test } from '@playwright/test';
import {
	buildFullGroupSeed,
	gotoSeededRoute,
	tripGroup,
} from '../../../mocks/playwright';

test('redirects the bare group route to expenses', async ({ page }) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}`, buildFullGroupSeed());

	await expect(page).toHaveURL(new RegExp(`/groups/${tripGroup.id}/expenses$`));
});
