import { expect, type Page, test } from '@playwright/test';
import dayjs from 'dayjs';

import {
	baseUser,
	bob,
	buildFullGroupSeed,
	type E2ESeed,
	gotoSeededRoute,
	now,
	tripGroup,
} from '../../../mocks/playwright';

test('shows expense totals, category bars, and outstanding balances', async ({
	page,
}) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}?tab=summary`,
		buildFullGroupSeed(),
	);

	await expect(page.getByRole('combobox', { name: 'Member' })).toContainText(
		'Alice',
	);
	await expect(page.getByText('My expense')).toBeVisible();
	await expect(page.getByText('Group expense')).toBeVisible();
	await expect(page.getByText('Food')).toBeVisible();
	await expect(page.getByText('Transport')).toBeVisible();
	await expect(page.getByText('Who I need to pay to')).toBeVisible();
	await expect(page.getByText('Who needs to pay me')).toBeVisible();
	await expect(page.getByRole('cell', { name: 'Bob' })).toBeVisible();
});

test('groups summary by date', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}?tab=summary`,
		buildFullGroupSeed(),
	);

	await page.getByRole('button', { name: 'Group expenses by' }).last().click();
	await page.getByRole('menuitem', { name: 'By date' }).click();

	await expect(page.getByText('Thu, 21 Mar 24')).toBeVisible();
	await expect(page.getByText('Wed, 20 Mar 24')).toBeVisible();

	await page.getByRole('button', { name: 'Group expenses by' }).last().click();
	await expect(page.getByRole('menuitem', { name: 'By date' })).toHaveClass(
		/Mui-selected/,
	);
});

test('shows summary for another selected member', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}?tab=summary`,
		buildFullGroupSeed(),
	);

	await page.getByRole('combobox', { name: 'Member' }).click();
	await page.getByRole('option', { name: 'Bob' }).click();

	await expect(page.getByRole('combobox', { name: 'Member' })).toContainText(
		'Bob',
	);
	await expect(page.getByText("Bob's expense")).toBeVisible();
	await expect(page.getByText('Who Bob needs to pay to')).toBeVisible();
	await expect(page.getByRole('cell', { name: 'Alice' })).toBeVisible();
});

function mixedCurrencySeed({ withUnknown = false } = {}): E2ESeed {
	return {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [
					{ id: baseUser.hashedId, name: baseUser.name },
					{ id: bob.id, name: bob.name },
				],
				expenses: [
					{
						id: 'exp-thb',
						amount: 100,
						currency: 'THB',
						category: 'Food',
						paidOn: now,
						paidByMemberId: baseUser.hashedId,
					},
					{
						id: 'exp-jpy',
						amount: 400,
						currency: 'JPY',
						category: 'Food',
						paidOn: now,
						paidByMemberId: bob.id,
					},
					...(withUnknown
						? [
								{
									id: 'exp-old',
									amount: 10,
									category: 'Food',
									paidOn: now,
									paidByMemberId: baseUser.hashedId,
								},
							]
						: []),
				],
				splits: [
					{
						id: 's1',
						expenseId: 'exp-thb',
						memberId: baseUser.hashedId,
						amount: 50,
					},
					{ id: 's2', expenseId: 'exp-thb', memberId: bob.id, amount: 50 },
					{
						id: 's3',
						expenseId: 'exp-jpy',
						memberId: baseUser.hashedId,
						amount: 200,
					},
					{ id: 's4', expenseId: 'exp-jpy', memberId: bob.id, amount: 200 },
					...(withUnknown
						? [{ id: 's5', expenseId: 'exp-old', memberId: bob.id, amount: 10 }]
						: []),
				],
			},
		],
	};
}

async function mockThbRates(page: Page, rates: Record<string, number> | null) {
	await page.route('**/currency-api@*/v1/currencies/thb.json', (route) =>
		rates
			? route.fulfill({
					json: {
						date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
						thb: rates,
					},
				})
			: route.abort(),
	);
}

async function convertTo(page: Page, option: string) {
	await page.getByRole('combobox', { name: 'Currency' }).click();
	await page.getByRole('option', { name: option }).click();
}

const card = (page: Page, label: string) =>
	page.locator('.MuiCard-root').filter({ hasText: label });

test('hides the currency select when the group uses one currency', async ({
	page,
}) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}?tab=summary`,
		buildFullGroupSeed(),
	);

	await expect(page.getByText('My expense')).toBeVisible();
	await expect(page.getByRole('combobox', { name: 'Currency' })).toHaveCount(0);
});

test('shows mixed currencies separately by default', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}?tab=summary`,
		mixedCurrencySeed({ withUnknown: true }),
	);

	await expect(page.getByRole('combobox', { name: 'Currency' })).toContainText(
		'As spent',
	);
	await expect(card(page, 'My expense')).toHaveText(
		/^My expense¥200\.00฿50\.00$/,
	);
	await expect(card(page, 'Group expense')).toHaveText(
		/^Group expense¥400\.00฿100\.0010\.00$/,
	);
	await expect(page.getByText('฿ Thai Baht')).toBeVisible();
	await expect(page.getByText('¥ Japanese Yen')).toBeVisible();

	const bobRows = page.getByRole('row').filter({ hasText: 'Bob' });
	await expect(bobRows).toHaveCount(2);
	await expect(bobRows.nth(0)).toHaveText(/^Bob¥200\.00$/);
	await expect(bobRows.nth(1)).toHaveText(/^Bob฿50\.0010\.00$/);
	await expect(
		page.getByRole('row').filter({ hasText: 'Total' }).nth(1),
	).toHaveText(/^Total฿50\.0010\.00$/);
});

test('converts to a currency with fetched and edited rates', async ({
	page,
}) => {
	await mockThbRates(page, { jpy: 4, thb: 1 });
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}?tab=summary`,
		mixedCurrencySeed(),
	);

	await convertTo(page, '฿ THB · Thai Baht');
	await expect(
		page.getByText('Converted at rates from yesterday'),
	).toBeVisible();
	await expect(card(page, 'My expense')).toHaveText(/My expense฿100\.00$/);
	await expect(card(page, 'Group expense')).toHaveText(
		/Group expense฿200\.00$/,
	);
	await expect(page.getByText('No one')).toHaveCount(2);

	await page.getByRole('button', { name: 'Conversion rates' }).click();
	const rate = page.getByLabel('Japanese Yen');
	await expect(rate).toHaveValue('0.25');
	await rate.fill('0.5');
	await page.getByRole('button', { name: 'Done' }).click();

	await expect(page.getByText('Converted at custom rates')).toBeVisible();
	await expect(card(page, 'My expense')).toHaveText(/My expense฿150\.00$/);
	await expect(
		page.getByRole('cell', { name: '฿50.00' }).first(),
	).toBeVisible();

	await page.getByRole('button', { name: 'Conversion rates' }).click();
	await page.getByRole('button', { name: 'Reset JPY rate' }).click();
	await expect(rate).toHaveValue('0.25');
	await page.getByRole('button', { name: 'Done' }).click();
	await expect(card(page, 'My expense')).toHaveText(/My expense฿100\.00$/);
});

test('keeps expenses without a currency unconverted', async ({ page }) => {
	await mockThbRates(page, { jpy: 4, thb: 1 });
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}?tab=summary`,
		mixedCurrencySeed({ withUnknown: true }),
	);

	await convertTo(page, '฿ THB · Thai Baht');
	await expect(card(page, 'Group expense')).toHaveText(
		/^Group expense฿200\.0010\.00$/,
	);
	await expect(
		page.getByText('No currency · not converted').first(),
	).toBeVisible();
});

test('skips conversion when only expenses without a currency remain', async ({
	page,
}) => {
	const rateRequests: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('currency-api'))
			rateRequests.push(request.url());
	});
	const seed = mixedCurrencySeed();
	seed.groups![0]!.expenses![1]!.currency = '';
	await gotoSeededRoute(page, `/groups/${tripGroup.id}?tab=summary`, seed);

	await convertTo(page, '฿ THB · Thai Baht');
	await expect(card(page, 'My expense')).toHaveText(
		/^My expense฿50\.00200\.00$/,
	);
	await expect(
		page.getByRole('button', { name: 'Conversion rates' }),
	).toHaveCount(0);
	expect(rateRequests).toEqual([]);
});

test('lets rates be entered manually when fetching fails', async ({ page }) => {
	await mockThbRates(page, null);
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}?tab=summary`,
		mixedCurrencySeed(),
	);

	await convertTo(page, '฿ THB · Thai Baht');
	await expect(
		page.getByText('Rates unavailable — enter manually'),
	).toBeVisible();
	await expect(card(page, 'My expense')).toContainText('¥200.00');

	await page.getByRole('button', { name: 'Conversion rates' }).click();
	await page.getByLabel('Japanese Yen').fill('0.25');
	await page.getByRole('button', { name: 'Done' }).click();
	await expect(card(page, 'My expense')).toHaveText(/My expense฿100\.00$/);
});

test('shows empty outstanding sections when there is no balance', async ({
	page,
}) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}?tab=summary`, {
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

	await expect(page.getByText('No one').first()).toBeVisible();
});
