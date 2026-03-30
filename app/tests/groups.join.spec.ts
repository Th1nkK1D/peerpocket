import { expect, test } from '@playwright/test';
import { baseUser, gotoSeededRoute, installAppMocks } from './helpers';

const joinUrl = '/groups/join?id=group-party&name=Party';

test('joins a shared group and exposes navigation actions', async ({
	page,
}) => {
	await gotoSeededRoute(page, joinUrl, {
		user: baseUser,
	});

	await expect(page.getByText("You've been invited to")).toBeVisible();
	await page.getByRole('button', { name: 'Join the group' }).click();

	await expect(page.getByText("You've joined")).toBeVisible();
	await page.getByRole('link', { name: 'Go to the group' }).click();
	await expect(page).toHaveURL(/\/groups\/group-party\/expenses$/);
});

test('shows the already-joined state for existing members', async ({
	page,
}) => {
	await installAppMocks(page);
	await gotoSeededRoute(page, joinUrl, {
		user: baseUser,
		groups: [
			{
				id: 'group-party',
				name: 'Party',
				members: [
					{
						id: baseUser.hashedId,
						name: baseUser.name,
					},
				],
			},
		],
	});

	await expect(
		page.getByRole('link', { name: 'Go to the group' }),
	).toBeVisible();
	await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
});
