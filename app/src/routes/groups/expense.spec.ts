import { expect, test } from '@playwright/test';
import {
	baseUser,
	buildFullGroupSeed,
	expectOnExpenses,
	fillSampleExpense,
	gotoSeededRoute,
	tripGroup,
} from '../../mocks/playwright';

test('redirects back to groups for unknown group ids', async ({ page }) => {
	await gotoSeededRoute(page, '/groups/expense?groupId=missing', {
		user: baseUser,
	});

	await expect(page).toHaveURL(/\/groups$/);
});

test('adds a new expense and uses the split controls', async ({ page }) => {
	await gotoSeededRoute(page, `/groups/expense?groupId=${tripGroup.id}`, {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [
					{ id: baseUser.hashedId, name: baseUser.name },
					{ id: 'hashed-bob', name: 'Bob' },
				],
			},
		],
	});

	await fillSampleExpense(page, { notes: 'Lunch' });
	await page.getByRole('button', { name: 'Select none' }).click();
	await expect(page.getByRole('button', { name: 'Select all' })).toBeVisible();
	await page.getByRole('button', { name: 'Select all' }).click();
	await expect(page.getByRole('button', { name: 'Select none' })).toBeVisible();
	await page.getByRole('button', { name: 'Split selections equally' }).click();
	await page.getByRole('button', { name: 'Reset' }).click();
	await page.getByRole('button', { name: 'Split selections equally' }).click();
	await page.getByRole('button', { name: 'Add' }).click();

	await expectOnExpenses(page);
	await expect(page.getByText('Lunch')).toBeVisible();
	await expect(page.getByText('45.00')).toBeVisible();
});

test('edits an existing expense', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/expense?groupId=${tripGroup.id}&expenseId=expense-dinner`,
		buildFullGroupSeed(),
	);

	await expect(page.getByLabel('Total')).toHaveValue('90');
	await expect(page.getByLabel('Notes')).toHaveValue('Dinner');
	await page.getByLabel('Notes').fill('Team dinner');
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByRole('button', { name: 'Update' }).click();

	await expectOnExpenses(page);
	await expect(page.getByText('Team dinner')).toBeVisible();
});
