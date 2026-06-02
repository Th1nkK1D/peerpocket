import { expect, test } from '@playwright/test';
import {
	baseUser,
	bob,
	buildFullGroupSeed,
	chloe,
	gotoSeededRoute,
	tripGroup,
} from '../../../mocks/playwright';

async function clickMemberAction(
	page: import('@playwright/test').Page,
	memberName: string,
	action: string,
) {
	await page
		.getByRole('listitem')
		.filter({ hasText: memberName })
		.getByRole('button', { name: 'Member actions' })
		.click();
	await page.getByRole('menuitem', { name: action }).click();
}

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

	await clickMemberAction(page, baseUser.name, 'Remove');
	await expect(page.getByRole('dialog')).toContainText('Cannot remove Alice');
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

	await clickMemberAction(page, bob.name, 'Remove');
	await expect(page.getByRole('dialog')).toContainText('Cannot remove Bob');
	await expect(page.getByRole('dialog')).toContainText(
		'This member cannot be removed because they are related to an expense or split.',
	);
	await page.getByRole('button', { name: 'Close' }).click();
});

test('shows delete guardrails for members tied to splits', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/members`,
		buildFullGroupSeed(),
	);

	await clickMemberAction(page, chloe.name, 'Remove');
	await expect(page.getByRole('dialog')).toContainText('Cannot remove Chloe');
	await expect(page.getByRole('dialog')).toContainText(
		'This member cannot be removed because they are related to an expense or split.',
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

	await clickMemberAction(page, 'Dan', 'Remove');
	await expect(page.getByRole('dialog')).toContainText('Remove Dan?');
	await page.getByRole('button', { name: 'Remove' }).click();

	await expect(page.getByText('Dan')).toHaveCount(0);
});
