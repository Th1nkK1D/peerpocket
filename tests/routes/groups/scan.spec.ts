import { expect, type Page, test } from '@playwright/test';
import {
	baseUser,
	gotoSeededRoute,
	installAppMocks,
	mockScan,
} from '../../mocks/playwright';

const joinUrl = /\/groups\/join\?id=group-party&name=Party$/;

async function gotoScanner(page: Page) {
	await mockScan(page, {});
	await gotoSeededRoute(page, '/groups/scan', { user: baseUser });
}

function pasteInvite(page: Page) {
	return page.getByRole('button', { name: 'Paste invite link' }).click();
}

test('shows an error when the camera cannot be accessed', async ({ page }) => {
	await mockScan(page, { error: 'Camera blocked' });
	await gotoSeededRoute(page, '/groups/scan', { user: baseUser });

	await expect(page.getByText('Camera blocked')).toBeVisible();
	await expect(page.getByTestId('scanner-mock')).toBeVisible();
	await expect(
		page.getByRole('button', { name: 'Paste invite link' }),
	).toBeVisible();
});

test('shows an error for invalid QR codes', async ({ page }) => {
	await mockScan(page, {
		detectedCodes: ['https://example.com/not-a-group'],
	});
	await gotoSeededRoute(page, '/groups/scan', { user: baseUser });

	await expect(
		page.getByText('Could not read a valid group link from that QR code.'),
	).toBeVisible();
});

test('redirects for valid group links', async ({ page }) => {
	await mockScan(page, {
		detectedCodes: [
			'http://127.0.0.1:8000/groups/join?id=group-party&name=Party',
		],
	});
	await gotoSeededRoute(page, '/groups/scan', { user: baseUser });

	await expect(page).toHaveURL(joinUrl);
});

test('joins a group from a pasted invite link', async ({ page }) => {
	await gotoScanner(page);

	await page.evaluate(() =>
		navigator.clipboard.writeText(
			`${window.location.origin}/groups/join?id=group-party&name=Party`,
		),
	);
	await pasteInvite(page);
	await expect(page).toHaveURL(joinUrl);
});

test('joins a group from the landing URL an invited visitor was redirected to', async ({
	page,
}) => {
	await installAppMocks(page);
	await page.goto('/groups/join?id=group-party&name=Party');
	await expect(page).toHaveURL(/path=/);
	const landingUrl = page.url();

	await gotoScanner(page);
	await page.evaluate((url) => navigator.clipboard.writeText(url), landingUrl);
	await pasteInvite(page);
	await expect(page).toHaveURL(joinUrl);
});

test('falls back to manual entry when the clipboard has no invite', async ({
	page,
}) => {
	await gotoScanner(page);

	await pasteInvite(page);
	const dialog = page.getByRole('dialog', { name: 'Paste invite link' });
	await dialog.getByLabel('Invite link').fill('https://example.com');
	await dialog.getByRole('button', { name: 'Join' }).click();
	await expect(dialog).toContainText('Not a group invite link');

	await dialog
		.getByLabel('Invite link')
		.fill('https://peerpocket.app/groups/join?id=group-party&name=Party');
	await dialog.getByRole('button', { name: 'Join' }).click();
	await expect(page).toHaveURL(joinUrl);
});

test('falls back to manual entry when clipboard read is denied', async ({
	page,
}) => {
	await gotoScanner(page);

	await page.evaluate(() => {
		navigator.clipboard.readText = () => Promise.reject(new Error('denied'));
	});
	await pasteInvite(page);
	await expect(
		page.getByRole('dialog', { name: 'Paste invite link' }),
	).toBeVisible();
});
