import { expect, test } from '@playwright/test';
import {
	baseUser,
	buildFullGroupSeed,
	gotoSeededRoute,
	tripGroup,
} from '../../../mocks/playwright';

test('shows the empty state for groups without expenses', async ({ page }) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}/expenses`, {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [{ id: baseUser.hashedId, name: baseUser.name }],
			},
		],
	});

	await expect(
		page.getByText('Look like no one has taking a note just yet.'),
	).toBeVisible();
});

test('opens expense details', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/expenses`,
		buildFullGroupSeed(),
	);

	await page.getByText('Dinner').click();
	await expect(page.getByRole('dialog')).toContainText('Paid by Alice');
	await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
});

test('navigates to edit expense', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/expenses`,
		buildFullGroupSeed(),
	);

	await page.getByText('Dinner').click();
	await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible();
	await page.getByRole('link', { name: 'Edit' }).click();

	await expect(page).toHaveURL(
		new RegExp(
			`/groups/expense\\?groupId=${tripGroup.id}&expenseId=expense-dinner`,
		),
	);
});

test('deletes an expense', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/expenses`,
		buildFullGroupSeed(),
	);

	await page.getByText('Dinner').click();
	await page.getByRole('button', { name: 'Delete' }).click();
	await expect(page.getByRole('dialog')).toContainText(
		'You are about to delete',
	);
	await page.getByRole('button', { name: 'Yes, delete it' }).click();

	await expect(page.getByText('Dinner')).toHaveCount(0);
});
