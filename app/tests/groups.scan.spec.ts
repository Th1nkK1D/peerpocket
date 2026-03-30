import { expect, test } from '@playwright/test';
import { baseUser, gotoSeededRoute, mockScan } from './helpers';

test('shows an error when the camera cannot be accessed', async ({ page }) => {
	await mockScan(page, { error: 'Camera blocked' });
	await gotoSeededRoute(page, '/groups/scan', { user: baseUser });

	await expect(page.getByText('Camera blocked')).toBeVisible();
	await expect(page.getByTestId('scanner-mock')).toBeVisible();
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

	await expect(page).toHaveURL(/\/groups\/join\?id=group-party&name=Party$/);
});
