import { expect, test } from '@playwright/test';

import {
	buildFullGroupSeed,
	gotoSeededRoute,
	installAppMocks,
} from '../../mocks/playwright';

test('redirects unauthenticated access to the get started route with return params', async ({
	page,
}) => {
	await installAppMocks(page);
	await page.goto('/groups/create');

	await expect(page).toHaveURL(/\/get-started\?path=%2Fgroups%2Fcreate/);
	await expect(page.getByLabel("What's your name?")).toBeVisible();
});

test('loads authenticated child routes when an active user exists', async ({
	page,
}) => {
	await gotoSeededRoute(page, '/groups', buildFullGroupSeed());

	await expect(page).toHaveURL(/\/groups$/);
	await expect(page.getByRole('heading', { name: 'PeerPocket' })).toBeVisible();
});
