import { expect, test } from '@playwright/test';

import {
	baseUser,
	buildFullGroupSeed,
	expectOnExpenses,
	fillSampleExpense,
	gotoSeededRoute,
	readGroupStoreTables,
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
	await expect(page.getByText('45.00').first()).toBeVisible();
});

test('saves the picked currency and defaults the next expense to it', async ({
	page,
}) => {
	await gotoSeededRoute(page, `/groups/expense?groupId=${tripGroup.id}`, {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [{ id: baseUser.hashedId, name: baseUser.name }],
			},
		],
	});

	const currency = page.getByRole('combobox', { name: 'Currency' });
	await expect(currency).toHaveValue('฿ THB · Thai Baht');
	await currency.fill('JPY');
	await page.getByRole('option', { name: '¥ JPY · Japanese Yen' }).click();
	await expect(page.getByText('¥', { exact: true })).toBeVisible();
	await fillSampleExpense(page, { notes: 'Ramen' });
	await page.getByRole('button', { name: 'Split selections equally' }).click();
	await page.getByRole('button', { name: 'Add' }).click();

	await expectOnExpenses(page);
	await expect(page.getByText('Total ¥90.00')).toBeVisible();
	const tables = await readGroupStoreTables(page, tripGroup.id);
	expect(Object.values(tables.expenses ?? {})[0]?.currency).toBe('JPY');

	await page.getByRole('link', { name: 'Add new expense' }).click();
	await expect(page.getByRole('combobox', { name: 'Currency' })).toHaveValue(
		'¥ JPY · Japanese Yen',
	);
});

test('requires a currency for new expenses', async ({ page }) => {
	await gotoSeededRoute(page, `/groups/expense?groupId=${tripGroup.id}`, {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [{ id: baseUser.hashedId, name: baseUser.name }],
			},
		],
	});

	await page.getByRole('combobox', { name: 'Currency' }).fill('');
	await fillSampleExpense(page);

	await expect(page.getByText('Select a currency')).toBeVisible();
	await expect(page.getByLabel('Notes')).toBeVisible();
});

test('keeps the currency of an edited expense without changing the default', async ({
	page,
}) => {
	const seed = buildFullGroupSeed();
	seed.groups![0]!.expenses![0]!.currency = 'USD';
	await gotoSeededRoute(
		page,
		`/groups/expense?groupId=${tripGroup.id}&expenseId=expense-dinner`,
		seed,
	);

	await expect(page.getByRole('combobox', { name: 'Currency' })).toHaveValue(
		'US$ USD · US Dollar',
	);
	await page.getByLabel('Notes').fill('Team dinner');
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByRole('button', { name: 'Update' }).click();

	await expectOnExpenses(page);
	const tables = await readGroupStoreTables(page, tripGroup.id);
	expect(tables.expenses?.['expense-dinner']?.currency).toBe('USD');

	await page.getByRole('link', { name: 'Add new expense' }).click();
	await expect(page.getByRole('combobox', { name: 'Currency' })).toHaveValue(
		'฿ THB · Thai Baht',
	);
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
