import { expect, test } from '@playwright/test';
import {
	baseUser,
	bob,
	buildFullGroupSeed,
	chloe,
	clickSwipeAction,
	gotoSeededRoute,
	tripGroup,
} from '../../../mocks/playwright';

test('shows members', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/members`,
		buildFullGroupSeed(),
	);

	await expect(
		page.getByRole('listitem').filter({ hasText: baseUser.name }),
	).toBeVisible();
	await expect(
		page.getByRole('listitem').filter({ hasText: bob.name }),
	).toBeVisible();
});

test('shares group invite link', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/members`,
		buildFullGroupSeed(),
	);

	await page.getByLabel('Add new member').click();
	await expect(page.getByText('Add new members')).toBeVisible();
	const sharedLink = page.getByRole('textbox');
	await page.getByLabel('Copy link').click();
	await expect
		.poll(() =>
			page.evaluate(() => (navigator.clipboard as { value?: string }).value),
		)
		.toBe(await sharedLink.inputValue());
	await page.getByRole('button', { name: 'Done' }).click();
});

test('shows delete guardrails for the current user', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/members`,
		buildFullGroupSeed(),
	);

	await clickSwipeAction(page, 'Delete', { itemText: baseUser.name });
	await expect(page.getByRole('dialog')).toContainText('Cannot delete Alice');
	await page.getByRole('button', { name: 'Close' }).click();
});

test('shows delete guardrails for members tied to expenses', async ({
	page,
}) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/members`,
		buildFullGroupSeed(),
	);

	await clickSwipeAction(page, 'Delete', { itemText: bob.name });
	await expect(page.getByRole('dialog')).toContainText('Cannot delete Bob');
	await expect(page.getByRole('dialog')).toContainText(
		'This member cannot be deleted because they are related to an expense or split.',
	);
	await page.getByRole('button', { name: 'Close' }).click();
});

test('shows delete guardrails for members tied to splits', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/members`,
		buildFullGroupSeed(),
	);

	await clickSwipeAction(page, 'Delete', { itemText: chloe.name });
	await expect(page.getByRole('dialog')).toContainText('Cannot delete Chloe');
	await expect(page.getByRole('dialog')).toContainText(
		'This member cannot be deleted because they are related to an expense or split.',
	);
	await page.getByRole('button', { name: 'Close' }).click();
});

test('deletes members that are not tied to expenses or the current user', async ({
	page,
}) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}/members`, {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [
					{ id: baseUser.hashedId, name: baseUser.name },
					{ id: 'hashed-dan', name: 'Dan' },
				],
			},
		],
	});

	await clickSwipeAction(page, 'Delete', { itemText: 'Dan' });
	await expect(page.getByRole('dialog')).toContainText('Delete Dan?');
	await page.getByRole('button', { name: 'Delete' }).click();

	await expect(page.getByText('Dan')).toHaveCount(0);
});
