import { expect, test } from '@playwright/test';
import {
	baseUser,
	bob,
	buildFullGroupSeed,
	chloe,
	disableReseed,
	gotoSeededRoute,
	now,
	openSpeedDialAction,
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
		`/groups/${tripGroup.id}?tab=members`,
		buildFullGroupSeed(),
	);

	await expect(
		page.getByRole('listitem').filter({ hasText: baseUser.name }).last(),
	).toBeVisible();
	await expect(
		page.getByRole('listitem').filter({ hasText: bob.name }).last(),
	).toBeVisible();
});

test('shares group invite link', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}?tab=members`,
		buildFullGroupSeed(),
	);

	await openSpeedDialAction(page, 'Invite', 'Add member');
	await expect(page.getByText('Invite new members')).toBeVisible();
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
		`/groups/${tripGroup.id}?tab=members`,
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
		`/groups/${tripGroup.id}?tab=members`,
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
		`/groups/${tripGroup.id}?tab=members`,
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
	await gotoSeededRoute(page, `/groups/${tripGroup.id}?tab=members`, {
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

test('adds placeholder member via dialog', async ({ page }) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}?tab=members`,
		buildFullGroupSeed(),
	);

	await openSpeedDialAction(page, 'Placeholder', 'Add member');
	await expect(
		page.getByRole('dialog').filter({ hasText: 'Add placeholder member' }),
	).toBeVisible();

	await page.getByLabel('Name').fill('Dan');
	await page.getByRole('button', { name: 'Add' }).click();

	await expect(
		page.getByRole('listitem').filter({ hasText: 'Dan' }),
	).toBeVisible();
	await expect(
		page.getByRole('listitem').filter({ hasText: 'Not joined yet' }),
	).toBeVisible();
});

test('removes placeholder with no expense refs', async ({ page }) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}?tab=members`, {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [
					{ id: baseUser.hashedId, name: baseUser.name },
					{
						id: 'placeholder-dan',
						name: 'Dan',
						isPlaceholder: true,
					},
				],
			},
		],
	});

	await clickMemberAction(page, 'Dan', 'Remove');
	await expect(page.getByRole('dialog')).toContainText('Remove Dan?');
	await page.getByRole('button', { name: 'Remove' }).click();

	await expect(page.getByText('Dan')).toHaveCount(0);
});

test('blocks removing placeholder tied to expense refs', async ({ page }) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}?tab=members`, {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [
					{ id: baseUser.hashedId, name: baseUser.name },
					{
						id: 'placeholder-dan',
						name: 'Dan',
						isPlaceholder: true,
					},
				],
				expenses: [
					{
						id: 'exp-1',
						amount: 50,
						category: 'Food',
						notes: 'Lunch',
						paidOn: now,
						paidByMemberId: 'placeholder-dan',
					},
				],
			},
		],
	});

	await clickMemberAction(page, 'Dan', 'Remove');
	await expect(page.getByRole('dialog')).toContainText('Cannot remove Dan');
	await expect(page.getByRole('dialog')).toContainText(
		'This member cannot be removed because they are related to an expense or split.',
	);
	await page.getByRole('button', { name: 'Close' }).click();
});

test('claims placeholder as current user', async ({ page }) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}?tab=members`, {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [
					{ id: baseUser.hashedId, name: baseUser.name, joinedAt: now },
					{
						id: 'placeholder-alis',
						name: 'Alis',
						joinedAt: now + 60000,
						isPlaceholder: true,
					},
				],
				expenses: [
					{
						id: 'exp-1',
						amount: 60,
						category: 'Food',
						notes: 'Dinner',
						paidOn: now,
						paidByMemberId: 'placeholder-alis',
					},
				],
				splits: [
					{
						id: 'split-1',
						expenseId: 'exp-1',
						memberId: 'placeholder-alis',
						amount: 30,
					},
					{
						id: 'split-2',
						expenseId: 'exp-1',
						memberId: baseUser.hashedId,
						amount: 30,
					},
				],
			},
		],
	});

	await clickMemberAction(page, 'Alis', 'Claim as me');
	await expect(
		page.getByRole('dialog').filter({ hasText: 'Claim as me?' }),
	).toBeVisible();
	await page.getByRole('button', { name: 'Claim' }).click();

	// Placeholder row gone
	await expect(
		page.getByRole('listitem').filter({ hasText: 'Alis' }),
	).toHaveCount(0);

	// The 'Not joined yet' subtitle should not exist
	await expect(page.getByText('Not joined yet')).toHaveCount(0);

	// Verify FKs retargeted and claims ledger written via full export
	await disableReseed(page);
	await page.goto('/groups/export');
	await page.getByText('Full Export').click();
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Export' }).click(),
	]);
	const content = await (await download.createReadStream()).toArray();
	const json = JSON.parse(Buffer.concat(content).toString('utf-8'));
	const store = json.groupStores[tripGroup.id];

	expect(store.claims['placeholder-alis'].hashedId).toBe(baseUser.hashedId);
	expect(store.members['placeholder-alis']).toBeUndefined();
	expect(store.members[baseUser.hashedId].name).toBe(baseUser.name);
	expect(store.members[baseUser.hashedId].joinedAt).toBe(now);
	expect(store.expenses['exp-1'].paidByMemberId).toBe(baseUser.hashedId);
	expect(store.splits['split-1'].memberId).toBe(baseUser.hashedId);
	expect(store.splits['split-2'].memberId).toBe(baseUser.hashedId);
});
