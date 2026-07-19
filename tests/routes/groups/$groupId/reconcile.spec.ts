import { expect, test } from '@playwright/test';
import {
	baseUser,
	disableReseed,
	gotoSeededRoute,
	injectOfflineExpense,
	now,
	readGroupStoreTables,
	tripGroup,
} from '../../../mocks/playwright';

const reconGroup = { ...tripGroup, id: 'group-reconcile' };

test('syncs placeholder claim from A to B via relay', async ({ browser }) => {
	const seed = {
		enableRelay: true,
		user: baseUser,
		groups: [
			{
				...reconGroup,
				members: [
					{ id: baseUser.hashedId, name: baseUser.name, joinedAt: now },
					{
						id: 'placeholder-dan',
						name: 'Dan',
						joinedAt: now - 1000,
						isPlaceholder: true,
					},
				],
				expenses: [
					{
						id: 'expense-shared',
						amount: 90,
						category: 'Food',
						notes: 'Dinner',
						paidOn: now,
						paidByMemberId: baseUser.hashedId,
					},
				],
				splits: [
					{
						id: 'split-alice',
						expenseId: 'expense-shared',
						memberId: baseUser.hashedId,
						amount: 45,
					},
					{
						id: 'split-dan',
						expenseId: 'expense-shared',
						memberId: 'placeholder-dan',
						amount: 45,
					},
				],
			},
		],
	};

	const contextA = await browser.newContext();
	const pageA = await contextA.newPage();
	const contextB = await browser.newContext();
	const pageB = await contextB.newPage();

	await gotoSeededRoute(pageA, `/groups/${reconGroup.id}?tab=members`, seed);

	await gotoSeededRoute(pageB, `/groups/${reconGroup.id}?tab=members`, {
		...seed,
		user: { id: 'user-bob', hashedId: 'hashed-bob', name: 'Bob' },
	});

	// Wait for both peers to be connected
	await expect(
		pageA.getByText(/peers available|Connected to|Only you are online/),
	).toBeVisible({ timeout: 15000 });
	await expect(
		pageB.getByText(/peers available|Connected to|Only you are online/),
	).toBeVisible({ timeout: 15000 });

	// Verify both see the placeholder initially
	await expect(
		pageA.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toBeVisible();
	await expect(
		pageB.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toBeVisible();

	// On A: claim the placeholder
	await pageA
		.getByRole('listitem')
		.filter({ hasText: 'Dan' })
		.getByRole('button', { name: 'Member actions' })
		.click();
	await pageA.getByRole('menuitem', { name: 'Claim as me' }).click();
	await pageA.getByRole('button', { name: 'Claim' }).click();

	// Verify A: placeholder gone, Alice name present
	await expect(
		pageA.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toHaveCount(0);

	// Verify B: placeholder gone after sync
	await expect(
		pageB.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toHaveCount(0, { timeout: 15000 });

	// Verify B: Alice's member row appears (from sync)
	await expect(
		pageB.getByRole('listitem').filter({ hasText: baseUser.name }),
	).toBeVisible();

	await contextA.close();
	await contextB.close();
});

test('offline peer sees placeholder until sync', async ({ browser }) => {
	const contextA = await browser.newContext();
	const pageA = await contextA.newPage();
	const contextB = await browser.newContext();
	const pageB = await contextB.newPage();

	await gotoSeededRoute(pageA, `/groups/${reconGroup.id}?tab=members`, {
		enableRelay: false,
		user: baseUser,
		groups: [
			{
				...reconGroup,
				members: [
					{ id: baseUser.hashedId, name: baseUser.name, joinedAt: now },
					{
						id: 'placeholder-dan',
						name: 'Dan',
						joinedAt: now - 1000,
						isPlaceholder: true,
					},
				],
				expenses: [
					{
						id: 'expense-shared',
						amount: 90,
						category: 'Food',
						notes: 'Dinner',
						paidOn: now,
						paidByMemberId: baseUser.hashedId,
					},
				],
				splits: [
					{
						id: 'split-alice',
						expenseId: 'expense-shared',
						memberId: baseUser.hashedId,
						amount: 45,
					},
					{
						id: 'split-dan',
						expenseId: 'expense-shared',
						memberId: 'placeholder-dan',
						amount: 45,
					},
				],
			},
		],
	});

	await gotoSeededRoute(pageB, `/groups/${reconGroup.id}?tab=members`, {
		enableRelay: false,
		user: { id: 'user-bob', hashedId: 'hashed-bob', name: 'Bob' },
		groups: [
			{
				...reconGroup,
				members: [
					{ id: 'hashed-bob', name: 'Bob', joinedAt: now },
					{
						id: 'placeholder-dan',
						name: 'Dan',
						joinedAt: now - 1000,
						isPlaceholder: true,
					},
				],
			},
		],
	});

	// On A: claim the placeholder
	await pageA
		.getByRole('listitem')
		.filter({ hasText: 'Dan' })
		.getByRole('button', { name: 'Member actions' })
		.click();
	await pageA.getByRole('menuitem', { name: 'Claim as me' }).click();
	await pageA.getByRole('button', { name: 'Claim' }).click();

	// Verify A: placeholder gone
	await expect(
		pageA.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toHaveCount(0);

	// B offline: still sees Dan (no sync happened)
	await expect(
		pageB.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toBeVisible();

	await contextA.close();
	await contextB.close();
});

test('heals orphan splits after offline peer reconnects', async ({
	browser,
}) => {
	test.setTimeout(90000);
	const groupState = {
		members: [
			{ id: baseUser.hashedId, name: baseUser.name, joinedAt: now },
			{
				id: 'placeholder-dan',
				name: 'Dan',
				joinedAt: now - 1000,
				isPlaceholder: true,
			},
		],
		expenses: [
			{
				id: 'expense-shared',
				amount: 90,
				category: 'Food',
				notes: 'Dinner',
				paidOn: now,
				paidByMemberId: baseUser.hashedId,
			},
		],
		splits: [
			{
				id: 'split-alice',
				expenseId: 'expense-shared',
				memberId: baseUser.hashedId,
				amount: 45,
			},
			{
				id: 'split-dan',
				expenseId: 'expense-shared',
				memberId: 'placeholder-dan',
				amount: 45,
			},
		],
	};

	const contextA = await browser.newContext();
	const pageA = await contextA.newPage();
	const contextB = await browser.newContext();
	const pageB = await contextB.newPage();

	await gotoSeededRoute(pageA, `/groups/${reconGroup.id}?tab=members`, {
		enableRelay: true,
		user: baseUser,
		groups: [{ ...reconGroup, ...groupState }],
	});

	await gotoSeededRoute(pageB, `/groups/${reconGroup.id}?tab=members`, {
		enableRelay: false,
		user: { id: 'user-bob', hashedId: 'hashed-bob', name: 'Bob' },
		groups: [{ ...reconGroup, ...groupState }],
	});

	// On A: claim the placeholder while B is offline
	await pageA
		.getByRole('listitem')
		.filter({ hasText: 'Dan' })
		.getByRole('button', { name: 'Member actions' })
		.click();
	await pageA.getByRole('menuitem', { name: 'Claim as me' }).click();
	await pageA.getByRole('button', { name: 'Claim' }).click();
	await expect(
		pageA.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toHaveCount(0);

	// On B (offline): write a new expense whose split references the claimed placeholder
	await injectOfflineExpense(
		pageB,
		reconGroup.id,
		{
			id: 'expense-y',
			amount: 20,
			category: 'Food',
			notes: 'Snack',
			paidOn: now + 1000,
			paidByMemberId: 'hashed-bob',
		},
		{
			id: 'split-y',
			expenseId: 'expense-y',
			memberId: 'placeholder-dan',
			amount: 20,
		},
	);

	// B comes back online: dropping the seed keeps localStorage and enables the relay
	await disableReseed(pageB);
	await pageB.reload();

	// Claim syncs over: placeholder row disappears on B
	await expect(
		pageB.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toHaveCount(0, { timeout: 30000 });

	// Reconcile-on-sync healed the orphan split written while offline
	await expect
		.poll(
			async () =>
				(await readGroupStoreTables(pageB, reconGroup.id)).splits?.['split-y']
					?.memberId,
			{ timeout: 30000 },
		)
		.toBe(baseUser.hashedId);

	const tables = await readGroupStoreTables(pageB, reconGroup.id);
	expect(tables.claims?.['placeholder-dan']?.hashedId).toBe(baseUser.hashedId);
	expect(tables.splits?.['split-dan']?.memberId).toBe(baseUser.hashedId);
	expect(tables.members?.['placeholder-dan']).toBeUndefined();

	await contextA.close();
	await contextB.close();
});

test('placeholder shows ghost icon and Not joined yet subtitle', async ({
	page,
}) => {
	await gotoSeededRoute(page, `/groups/${reconGroup.id}?tab=members`, {
		user: baseUser,
		groups: [
			{
				...reconGroup,
				members: [
					{ id: baseUser.hashedId, name: baseUser.name, joinedAt: now },
					{
						id: 'placeholder-dan',
						name: 'Dan',
						joinedAt: now - 1000,
						isPlaceholder: true,
					},
				],
			},
		],
	});

	await expect(page.getByText('Dan')).toBeVisible();
	await expect(page.getByText('Not joined yet')).toBeVisible();
});
