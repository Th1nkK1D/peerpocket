import { expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { createUsage } from './usage';

test('aggregates per day, hashes stores, rolls over at midnight', () => {
	const path = join(mkdtempSync(join(tmpdir(), 'usage-')), 'usage.db');
	let now = new Date('2026-11-24T23:59:00Z');
	const usage = createUsage(path, () => now);

	usage.connect();
	usage.connect();
	usage.disconnect();
	usage.store('secret-store');
	usage.store('secret-store');
	usage.sync();
	usage.received(100);
	usage.sent(300);
	usage.flush();
	usage.sync();

	now = new Date('2026-11-25T00:01:00Z');
	usage.signal();
	usage.store('secret-store');
	usage.close();

	const db = new DatabaseSync(path);
	expect(db.prepare('SELECT * FROM daily ORDER BY day').all()).toEqual([
		{
			day: '2026-11-24',
			connections: 2,
			peak_connections: 2,
			syncs: 2,
			signals: 0,
			bytes_in: 100,
			bytes_out: 300,
		},
		{
			day: '2026-11-25',
			connections: 0,
			peak_connections: 1,
			syncs: 0,
			signals: 1,
			bytes_in: 0,
			bytes_out: 0,
		},
	]);
	const stores = db.prepare('SELECT * FROM store_day').all() as {
		store_hash: string;
	}[];
	expect(stores).toHaveLength(2);
	expect(stores[0]!.store_hash).toBe(stores[1]!.store_hash);
	expect(stores[0]!.store_hash).not.toContain('secret');
});
