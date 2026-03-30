import { expect, test } from '@playwright/test';
import {
	baseUser,
	buildFullGroupSeed,
	gotoSeededRoute,
	tripGroup,
} from './helpers';

test('shows expense totals, category bars, and outstanding balances', async ({
	page,
}) => {
	await gotoSeededRoute(
		page,
		`/groups/${tripGroup.id}/summary`,
		buildFullGroupSeed(),
	);

	await expect(page.getByText('My expense')).toBeVisible();
	await expect(page.getByText('Group expense')).toBeVisible();
	await expect(page.getByText('Food')).toBeVisible();
	await expect(page.getByText('Transport')).toBeVisible();
	await expect(page.getByText('Who I need to pay to')).toBeVisible();
	await expect(page.getByText('Who need to pay me')).toBeVisible();
	await expect(page.getByText('Bob')).toBeVisible();
});

test('shows empty outstanding sections when there is no balance', async ({
	page,
}) => {
	await gotoSeededRoute(page, `/groups/${tripGroup.id}/summary`, {
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

	await expect(page.getByText('No one')).toHaveCount(2);
});
