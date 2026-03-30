import { expect, test } from '@playwright/test';
import { createUserFromLanding } from './helpers';

test('creates a group, shows share controls, and navigates from the share step', async ({
	page,
}) => {
	await createUserFromLanding(page);
	await page.goto('/groups/create');

	await page.getByLabel('Group name').fill('Weekend Trip');
	await page.getByRole('button', { name: 'Create Group' }).click();

	await expect(page.getByText('Your group has been created!')).toBeVisible();
	await expect(page.getByLabel('Copy link')).toBeVisible();
	const sharedLink = page.getByRole('textbox');
	await expect(sharedLink).toHaveValue(/\/groups\/join\?id=/);

	await page.getByLabel('Copy link').click();
	await expect
		.poll(() =>
			page.evaluate(() => (navigator.clipboard as { value?: string }).value),
		)
		.toBe(await sharedLink.inputValue());

	await page.getByRole('link', { name: 'Return home' }).click();
	await expect(page).toHaveURL(/\/groups$/);
});
