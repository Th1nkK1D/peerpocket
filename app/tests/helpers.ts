import { expect, type Page } from '@playwright/test';
import type { E2EConfig, E2EScanConfig, E2ESeed } from '../src/utils/e2e';

export const now = new Date('2024-03-21T12:00:00.000Z').getTime();

export const baseUser = {
	id: 'user-alice',
	hashedId: 'hashed-alice',
	name: 'Alice',
};

export const bob = {
	id: 'hashed-bob',
	name: 'Bob',
};

export const chloe = {
	id: 'hashed-chloe',
	name: 'Chloe',
};

export const tripGroup = {
	id: 'group-trip',
	name: 'Trip',
	joinedAt: now,
};

function mergeE2EConfig(value: Partial<E2EConfig>) {
	window.__PEERPOCKET_E2E__ = {
		...(window.__PEERPOCKET_E2E__ ?? {}),
		...value,
	};
}

export async function installAppMocks(page: Page) {
	await page.addInitScript(() => {
		class ClipboardMock {
			value = '';

			async writeText(text: string) {
				this.value = text;
			}
		}

		Object.defineProperty(navigator, 'clipboard', {
			value: new ClipboardMock(),
			configurable: true,
		});
	});
}

export async function seedApp(page: Page, seed: E2ESeed = {}) {
	await page.addInitScript(mergeE2EConfig, { seed });
}

export async function mockScan(page: Page, scan: E2EScanConfig) {
	await page.addInitScript(mergeE2EConfig, { scan });
}

export async function gotoSeededRoute(
	page: Page,
	path: string,
	seed: E2ESeed = {},
) {
	await installAppMocks(page);
	await seedApp(page, { reset: true, ...seed });
	await page.goto(path);
}

export async function createUserFromLanding(page: Page, name = 'Alice') {
	await installAppMocks(page);
	await page.goto('/');
	await page.getByLabel('Enter your name').fill(name);
	await page.getByRole('button', { name: 'Get started' }).click();
}

export async function openSpeedDialAction(page: Page, name: string) {
	await page.getByLabel('Group actions').click();
	await page.getByRole('menuitem', { name }).click();
}

export async function clickSwipeAction(
	page: Page,
	label: string,
	options?: { itemText?: string; index?: number },
) {
	const scope = options?.itemText
		? page
				.locator('.swipeable-list-item')
				.filter({ hasText: options.itemText })
				.first()
		: page;

	await scope
		.locator('.swipe-action', { hasText: label })
		.nth(options?.index ?? 0)
		.evaluate((element: HTMLElement) => {
			element.click();
		});
}

export async function fillSampleExpense(
	page: Page,
	values?: { notes?: string },
) {
	await page.getByLabel('Total').fill('90');
	await page.getByLabel('Notes').fill(values?.notes ?? 'Dinner');
	await page.getByRole('button', { name: 'Next' }).click();
}

export async function expectOnExpenses(page: Page, groupId = tripGroup.id) {
	await expect(page).toHaveURL(new RegExp(`/groups/${groupId}/expenses$`));
}

export function buildFullGroupSeed(): E2ESeed {
	return {
		user: baseUser,
		groups: [
			{
				...tripGroup,
				members: [
					{
						id: baseUser.hashedId,
						name: baseUser.name,
						joinedAt: now,
					},
					{
						id: bob.id,
						name: bob.name,
						joinedAt: now - 1000,
					},
					{
						id: chloe.id,
						name: chloe.name,
						joinedAt: now - 2000,
					},
				],
				expenses: [
					{
						id: 'expense-dinner',
						amount: 90,
						currency: '',
						category: 'Food',
						notes: 'Dinner',
						paidOn: now,
						paidByMemberId: baseUser.hashedId,
						createdAt: now,
					},
					{
						id: 'expense-cab',
						amount: 30,
						currency: '',
						category: 'Transport',
						notes: 'Cab',
						paidOn: now - 86400000,
						paidByMemberId: bob.id,
						createdAt: now - 86400000,
					},
				],
				splits: [
					{
						id: 'split-dinner-alice',
						expenseId: 'expense-dinner',
						memberId: baseUser.hashedId,
						amount: 30,
					},
					{
						id: 'split-dinner-bob',
						expenseId: 'expense-dinner',
						memberId: bob.id,
						amount: 30,
					},
					{
						id: 'split-dinner-chloe',
						expenseId: 'expense-dinner',
						memberId: chloe.id,
						amount: 30,
					},
					{
						id: 'split-cab-alice',
						expenseId: 'expense-cab',
						memberId: baseUser.hashedId,
						amount: 15,
					},
					{
						id: 'split-cab-bob',
						expenseId: 'expense-cab',
						memberId: bob.id,
						amount: 15,
					},
				],
			},
		],
	};
}
