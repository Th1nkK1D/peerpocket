// Captures the landing page app screenshots from the running dev server (127.0.0.1:8000)
// Run with `bun scripts/landing-screenshots.ts`, needs ImageMagick's `magick` for WebP

import { chromium, type Page } from '@playwright/test';
import { $ } from 'bun';

const BASE_URL = 'http://127.0.0.1:8000';
const OUT_DIR = new URL(
	'../app/src/components/landing/screens/',
	import.meta.url,
).pathname;
const DAY = 86_400_000;

const me = { id: 'user-mint', hashedId: 'hashed-mint', name: 'Mint' };
const ploy = 'hashed-ploy';
const ben = 'hashed-ben';
const kai = 'hashed-kai';
const everyone = [me.hashedId, ploy, ben, kai];
const groupId = 'group-chiang-mai';

function daysAgo(days: number, hour: number) {
	const date = new Date(Date.now() - days * DAY);
	date.setHours(hour, 0, 0, 0);
	return date.getTime();
}

const expenses = [
	{
		id: 'mango',
		notes: 'Mango sticky rice',
		category: 'Food & Drinks',
		amount: 240,
		paidBy: ben,
		splitWith: everyone,
		paidOn: daysAgo(0, 16),
	},
	{
		id: 'khao-soi',
		notes: 'Khao soi lunch',
		category: 'Food & Drinks',
		amount: 480,
		paidBy: ploy,
		splitWith: everyone,
		paidOn: daysAgo(0, 13),
	},
	{
		id: 'cooking',
		notes: 'Thai cooking class',
		category: 'Activities',
		amount: 4800,
		paidBy: me.hashedId,
		splitWith: everyone,
		paidOn: daysAgo(0, 9),
	},
	{
		id: 'songthaew',
		notes: 'Songthaew to Doi Suthep',
		category: 'Transportation',
		amount: 600,
		paidBy: ben,
		splitWith: everyone,
		paidOn: daysAgo(1, 15),
	},
	{
		id: 'bazaar',
		notes: 'Night bazaar souvenirs',
		category: 'Shopping',
		amount: 1350,
		paidBy: kai,
		splitWith: [me.hashedId, ploy, kai],
		paidOn: daysAgo(1, 20),
	},
	{
		id: 'guesthouse',
		notes: 'Old city guesthouse',
		category: 'Accommodation',
		amount: 5600,
		paidBy: me.hashedId,
		splitWith: everyone,
		paidOn: daysAgo(2, 14),
	},
	{
		id: 'airport',
		notes: 'Taxi from the airport',
		category: 'Transportation',
		amount: 320,
		paidBy: ploy,
		splitWith: everyone,
		paidOn: daysAgo(2, 11),
	},
];

const seedFor = (user: typeof me) => ({
	reset: true,
	enableRelay: true,
	user,
	groups: [
		{
			id: groupId,
			name: 'Chiang Mai trip',
			members: [
				{ id: me.hashedId, name: me.name },
				{ id: ploy, name: 'Ploy' },
				{ id: ben, name: 'Ben' },
				{ id: kai, name: 'Kai' },
			],
			expenses: expenses.map(
				({ id, notes, category, amount, paidBy, paidOn }) => ({
					id,
					notes,
					category,
					amount,
					currency: 'THB',
					paidByMemberId: paidBy,
					paidOn,
				}),
			),
			splits: expenses.flatMap(({ id, amount, splitWith }) =>
				splitWith.map((memberId) => ({
					id: `${id}-${memberId}`,
					expenseId: id,
					memberId,
					amount: amount / splitWith.length,
				})),
			),
		},
	],
});

async function capture(page: Page, name: string) {
	await $`magick png:- -quality 85 ${OUT_DIR}${name}.webp < ${await page.screenshot()}`;
}

const browser = await chromium.launch({
	executablePath: '/etc/profiles/per-user/lkz/bin/chromium',
});

async function openAs(user: typeof me) {
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		deviceScaleFactor: 2,
		colorScheme: 'light',
	});
	await context.addInitScript((value) => {
		Object.assign(window, { __PEERPOCKET_E2E__: { seed: value } });
	}, seedFor(user));
	const page = await context.newPage();
	await page.goto(`${BASE_URL}/groups/${groupId}?tab=expenses`);
	return page;
}

// Friends online in the same group, so the status bar shows live peers instead of "No connection"
await openAs({ id: 'user-ploy', hashedId: ploy, name: 'Ploy' });
await openAs({ id: 'user-ben', hashedId: ben, name: 'Ben' });
const page = await openAs(me);

await page.getByText(/2 peers/).waitFor({ timeout: 30_000 });
await capture(page, 'expenses');

await page.getByText('Summary', { exact: true }).click();
await page.getByText('Who needs to pay me').waitFor();
// Let the tab slide transition settle
await page.waitForTimeout(1_000);
await capture(page, 'summary');

await page.goto(`${BASE_URL}/groups/expense?groupId=${groupId}`);
await page.getByLabel('Total').fill('1250');
await page.getByRole('combobox', { name: 'Category' }).click();
await page.getByRole('option', { name: 'Food & Drinks' }).click();
await page.getByLabel('Notes').fill('Riverside dinner');
// Let the category menu fade out, then clear the focus and the hover it leaves behind
await page.waitForTimeout(1_000);
await page.evaluate(() =>
	(document.activeElement as HTMLElement | null)?.blur(),
);
await page.mouse.move(0, 0);
await page.waitForTimeout(300);
await capture(page, 'add-expense');

await browser.close();
