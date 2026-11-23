import { expect, test } from '@playwright/test';

import {
	buildFullGroupSeed,
	gotoSeededRoute,
	installAppMocks,
} from '../mocks/playwright';

test('opens get started from the landing page for a new user', async ({
	page,
}) => {
	await installAppMocks(page);
	await page.goto('/');

	await expect(page.getByRole('heading', { name: 'PeerPocket' })).toBeVisible();
	await page.getByRole('link', { name: 'Get started' }).click();

	await expect(page).toHaveURL(/\/get-started/);
	await expect(page.getByLabel('Enter your name')).toBeVisible();
});

test('opens groups from the landing page for an active user', async ({
	page,
}) => {
	await gotoSeededRoute(page, '/', buildFullGroupSeed());

	await page.getByRole('link', { name: 'Get started' }).click();

	await expect(page).toHaveURL(/\/groups$/);
});

test('redirects the installed app from the landing page to groups', async ({
	page,
}) => {
	await page.addInitScript(() => {
		const matchMedia = window.matchMedia.bind(window);
		window.matchMedia = (query) =>
			query === '(display-mode: standalone)'
				? ({ matches: true } as MediaQueryList)
				: matchMedia(query);
	});
	await gotoSeededRoute(page, '/', buildFullGroupSeed());

	await expect(page).toHaveURL(/\/groups$/);
});

test('forwards a legacy landing invite link to get started', async ({
	page,
}) => {
	const params = encodeURIComponent(
		JSON.stringify({ id: 'group-party', name: 'Party' }),
	);
	await gotoSeededRoute(
		page,
		`/?path=/groups/join&params=${params}`,
		buildFullGroupSeed(),
	);

	await expect(page).toHaveURL(/\/groups\/join\?id=group-party&name=Party$/);
});
