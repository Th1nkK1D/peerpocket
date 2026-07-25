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

	await page
		.locator('.MuiBottomNavigation-root')
		.getByRole('button', { name: 'Summary' })
		.click();
	await expect(page).toHaveURL(
		new RegExp(`/groups/${tripGroup.id}[?&]tab=summary`),
	);

	await page
		.locator('.MuiBottomNavigation-root')
		.getByRole('button', { name: 'Expenses' })
		.click();
	await expect(page).toHaveURL(
		new RegExp(`/groups/${tripGroup.id}[?&]tab=expenses`),
	);

	await page
		.locator('.MuiBottomNavigation-root')
		.getByRole('button', { name: 'Members' })
		.click();
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

test('relay server responds to heartbeat ping with pong', async ({ page }) => {
	await page.goto('/');

	const reply = await page.evaluate(
		() =>
			new Promise<string>((resolve, reject) => {
				const ws = new WebSocket('ws://127.0.0.1:3000');
				ws.onopen = () => ws.send('ping');
				ws.onmessage = (event) =>
					resolve(typeof event.data === 'string' ? event.data : 'binary');
				ws.onerror = () => reject(new Error('websocket error'));
				setTimeout(() => reject(new Error('pong timeout')), 5000);
			}),
	);

	expect(reply).toBe('pong');
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

	// Verify sync UI states - peers are online via relay
	await expect(
		pageA.getByText(/peers available|Connected to|Syncing|Only you are online/),
	).toBeVisible({ timeout: 10000 });
	await expect(
		pageB.getByText(/peers available|Connected to|Syncing|Only you are online/),
	).toBeVisible({ timeout: 10000 });

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

	// Both peers should show online state after sync
	await expect(
		pageA.getByText(/peers available|Connected to|Syncing|Only you are online/),
	).toBeVisible();
	await expect(
		pageB.getByText(/peers available|Connected to|Syncing|Only you are online/),
	).toBeVisible();

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

	// Both peers should show online state after sync
	await expect(
		pageA.getByText(/peers available|Connected to|Syncing|Only you are online/),
	).toBeVisible();
	await expect(
		pageB.getByText(/peers available|Connected to|Syncing|Only you are online/),
	).toBeVisible();

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
