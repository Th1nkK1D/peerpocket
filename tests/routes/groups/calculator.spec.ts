import { expect, type Page, test } from '@playwright/test';
import { baseUser, gotoSeededRoute, tripGroup } from '../../mocks/playwright';

async function openCalculator(page: Page) {
	await gotoSeededRoute(page, `/groups/expense?groupId=${tripGroup.id}`, {
		user: baseUser,
		groups: [tripGroup],
	});

	await page.getByLabel('Open calculator').click();
	await expect(page.getByTestId('calculator-display')).toBeVisible();
}

async function press(page: Page, ...keys: string[]) {
	for (const key of keys) {
		await page.getByRole('button', { name: key, exact: true }).click();
	}
}

test('calculates an expression and applies the result to the total', async ({
	page,
}) => {
	await openCalculator(page);

	await press(page, '1', '2', '+', '3', '×', '4');
	await expect(page.getByTestId('calculator-display')).toHaveText('12+3×4');

	await page.getByRole('button', { name: 'Calculate' }).click();
	await expect(page.getByTestId('calculator-display')).toHaveText('24');

	await page.getByRole('button', { name: 'Apply value' }).click();
	await expect(page.getByLabel('Total')).toHaveValue('24');
});

test('groups thousands and applies without an explicit calculation', async ({
	page,
}) => {
	await openCalculator(page);

	await press(page, '1', '2', '3', '4', '5', '6');
	await expect(page.getByTestId('calculator-display')).toHaveText('123,456');

	await page.getByRole('button', { name: 'Apply value' }).click();
	await expect(page.getByLabel('Total')).toHaveValue('123,456');
});

test('rejects division by zero instead of resolving to zero', async ({
	page,
}) => {
	await openCalculator(page);

	await press(page, '5', '÷', '0');
	await expect(page.getByRole('button', { name: 'Calculate' })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Apply' })).toBeDisabled();

	await press(page, 'Backspace', '2');
	await expect(page.getByRole('button', { name: 'Calculate' })).toBeEnabled();
	await page.getByRole('button', { name: 'Calculate' }).click();
	await expect(page.getByTestId('calculator-display')).toHaveText('2.5');
});

test('keeps a leading sign usable after deleting the first operand', async ({
	page,
}) => {
	await openCalculator(page);

	await press(page, '5', '-', '2');
	await expect(page.getByTestId('calculator-display')).toHaveText('5-2');

	await page.getByTestId('calculator-display').press('Home');
	await page.getByTestId('calculator-display').press('ArrowRight');
	await press(page, 'Backspace');
	await expect(page.getByTestId('calculator-display')).toHaveText('-2');

	await expect(page.getByRole('button', { name: 'Apply value' })).toBeEnabled();
	await expect(
		page.getByRole('button', { name: 'Apply', exact: true }),
	).toBeEnabled();
});

test('inserts a digit at the caret moved with the keyboard', async ({
	page,
}) => {
	await openCalculator(page);

	await press(page, '1', '2', '3');
	await page.getByTestId('calculator-display').press('ArrowLeft');
	await press(page, '9');

	await expect(page.getByTestId('calculator-display')).toHaveText('1,293');

	await page.getByRole('button', { name: 'Apply value' }).click();
	await expect(page.getByLabel('Total')).toHaveValue('1,293');
});

test('seeds the calculator from the current total and resets with AC', async ({
	page,
}) => {
	await gotoSeededRoute(page, `/groups/expense?groupId=${tripGroup.id}`, {
		user: baseUser,
		groups: [tripGroup],
	});

	await page.getByLabel('Total').fill('42.5');
	await page.getByLabel('Open calculator').click();
	await expect(page.getByTestId('calculator-display')).toHaveText('42.5');

	await page.getByRole('button', { name: 'AC', exact: true }).click();
	await expect(page.getByTestId('calculator-display')).toHaveText('0');

	await page.getByRole('button', { name: 'Close' }).click();
	await expect(page.getByLabel('Total')).toHaveValue('42.5');
});
