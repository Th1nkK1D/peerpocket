import { expect, test } from '@playwright/test';
import {
	baseUser,
	buildFullGroupSeed,
	expectOnExpenses,
	gotoSeededRoute,
	tripGroup,
} from '../../../mocks/playwright';

test('renders the group layout and tab navigation', async ({ page }) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}`, buildFullGroupSeed());

	await expect(
		page.getByRole('heading', { name: tripGroup.name }),
	).toBeVisible();

	await page.getByRole('tab', { name: 'Summary' }).click();
	await expect(page).toHaveURL(
		new RegExp(`/groups/${tripGroup.id}[?&]tab=summary`),
	);

	await page.getByRole('tab', { name: 'Expenses' }).click();
	await expect(page).toHaveURL(
		new RegExp(`/groups/${tripGroup.id}[?&]tab=expenses`),
	);

	await page.getByRole('tab', { name: 'Members' }).click();
	await expect(page).toHaveURL(
		new RegExp(`/groups/${tripGroup.id}[?&]tab=members`),
	);
});

test('redirects away when the active user is not in the group list', async ({
	page,
}) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}`, {
		user: {
			id: 'user-alice',
			hashedId: 'hashed-alice',
			name: 'Alice',
		},
	});

	await expect(page).toHaveURL(/\/groups$/);
});

test('merges expenses from two peers via sync union', async ({ browser }) => {
	const groupSeed = {
		...tripGroup,
		members: [
			{ id: baseUser.hashedId, name: baseUser.name },
			{ id: 'hashed-bob', name: 'Bob' },
		],
		expenses: [
			{
				id: 'expense-1',
				amount: 100,
				currency: '',
				category: 'Food',
				notes: 'Initial expense',
				paidOn: Date.now(),
				paidByMemberId: baseUser.hashedId,
				createdAt: Date.now(),
			},
		],
	};

	const contextA = await browser.newContext();
	const contextB = await browser.newContext();
	const pageA = await contextA.newPage();
	const pageB = await contextB.newPage();

	await gotoSeededRoute(pageA, `/groups/${tripGroup.id}?tab=expenses`, {
		user: baseUser,
		groups: [groupSeed],
		enableRelay: true,
	});

	await gotoSeededRoute(pageB, `/groups/${tripGroup.id}?tab=expenses`, {
		user: { id: 'user-bob', hashedId: 'hashed-bob', name: 'Bob' },
		groups: [groupSeed],
		enableRelay: true,
	});

	await expect(pageA.getByText('Initial expense')).toBeVisible();
	await expect(pageB.getByText('Initial expense')).toBeVisible();

	// Peer A creates expense
	await pageA.goto(`/groups/expense?groupId=${tripGroup.id}`);
	await pageA.getByLabel('Total').fill('200');
	await pageA.getByLabel('Notes').fill('Expense A');
	await pageA.getByRole('button', { name: 'Next' }).click();
	await pageA.getByRole('button', { name: 'Split selections equally' }).click();
	await pageA.getByRole('button', { name: 'Add' }).click();
	await expectOnExpenses(pageA, tripGroup.id);
	await expect(pageA.getByText('Expense A')).toBeVisible();

	// Peer B creates expense
	await pageB.goto(`/groups/expense?groupId=${tripGroup.id}`);
	await pageB.getByLabel('Total').fill('300');
	await pageB.getByLabel('Notes').fill('Expense B');
	await pageB.getByRole('button', { name: 'Next' }).click();
	await pageB.getByRole('button', { name: 'Split selections equally' }).click();
	await pageB.getByRole('button', { name: 'Add' }).click();
	await expectOnExpenses(pageB, tripGroup.id);
	await expect(pageB.getByText('Expense B')).toBeVisible();

	// Wait for sync - expect synced data to appear
	await expect(pageA.getByText('Expense B')).toBeVisible({ timeout: 10000 });
	await expect(pageB.getByText('Expense A')).toBeVisible({ timeout: 10000 });

	// Both peers should have all 3 expenses
	await expect(pageA.getByText('Initial expense')).toBeVisible();
	await expect(pageA.getByText('Expense A')).toBeVisible();

	await expect(pageB.getByText('Initial expense')).toBeVisible();
	await expect(pageB.getByText('Expense B')).toBeVisible();

	await contextA.close();
	await contextB.close();
});

test('merges members from two peers joining independently', async ({
	browser,
}) => {
	const groupSeed = {
		...tripGroup,
		members: [],
		expenses: [],
	};

	const contextA = await browser.newContext();
	const contextB = await browser.newContext();
	const pageA = await contextA.newPage();
	const pageB = await contextB.newPage();

	await gotoSeededRoute(pageA, `/groups/${tripGroup.id}?tab=members`, {
		user: baseUser,
		groups: [groupSeed],
		enableRelay: true,
	});

	await gotoSeededRoute(pageB, `/groups/${tripGroup.id}?tab=members`, {
		user: { id: 'user-bob', hashedId: 'hashed-bob', name: 'Bob' },
		groups: [groupSeed],
		enableRelay: true,
	});

	await expect(pageA.getByText('Members')).toBeVisible();
	await expect(pageB.getByText('Members')).toBeVisible();

	// Each peer sees themselves
	await expect(
		pageA.locator('li').filter({ hasText: baseUser.name }).first(),
	).toBeVisible();
	await expect(
		pageB.locator('li').filter({ hasText: 'Bob' }).first(),
	).toBeVisible();

	// Wait for sync - expect synced members to appear
	await expect(
		pageA.locator('li').filter({ hasText: 'Bob' }).first(),
	).toBeVisible({ timeout: 10000 });
	await expect(
		pageB.locator('li').filter({ hasText: baseUser.name }).first(),
	).toBeVisible({ timeout: 10000 });

	// Both peers should see both members
	await expect(
		pageA.locator('li').filter({ hasText: baseUser.name }).first(),
	).toBeVisible();

	await expect(
		pageB.locator('li').filter({ hasText: 'Bob' }).first(),
	).toBeVisible();

	await contextA.close();
	await contextB.close();
});
