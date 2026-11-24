import { createHash, randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
	PRAGMA journal_mode = WAL;
	CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
	CREATE TABLE IF NOT EXISTS daily (
		day TEXT PRIMARY KEY,
		connections INTEGER NOT NULL DEFAULT 0,
		peak_connections INTEGER NOT NULL DEFAULT 0,
		syncs INTEGER NOT NULL DEFAULT 0,
		signals INTEGER NOT NULL DEFAULT 0,
		bytes_in INTEGER NOT NULL DEFAULT 0,
		bytes_out INTEGER NOT NULL DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS store_day (
		day TEXT NOT NULL,
		store_hash TEXT NOT NULL,
		PRIMARY KEY (day, store_hash)
	) WITHOUT ROWID;
`;

export function createUsage(path: string, now = () => new Date()) {
	const db = new DatabaseSync(path);
	db.exec(SCHEMA);

	db.prepare('INSERT OR IGNORE INTO meta VALUES (?, ?)').run(
		'salt',
		randomBytes(32).toString('hex'),
	);
	const { value: salt } = db
		.prepare("SELECT value FROM meta WHERE key = 'salt'")
		.get() as { value: string };

	const upsertDaily = db.prepare(`
		INSERT INTO daily VALUES (
			$day, $connections, $peak_connections, $syncs, $signals, $bytes_in, $bytes_out
		)
		ON CONFLICT (day) DO UPDATE SET
			connections = connections + excluded.connections,
			peak_connections = max(peak_connections, excluded.peak_connections),
			syncs = syncs + excluded.syncs,
			signals = signals + excluded.signals,
			bytes_in = bytes_in + excluded.bytes_in,
			bytes_out = bytes_out + excluded.bytes_out
	`);
	const insertStore = db.prepare(
		'INSERT OR IGNORE INTO store_day VALUES (?, ?)',
	);

	let open = 0;
	let day = '';
	const fresh = () => ({
		connections: 0,
		peak_connections: open,
		syncs: 0,
		signals: 0,
		bytes_in: 0,
		bytes_out: 0,
	});
	let counts = fresh();
	let stores = new Set<string>();
	let dirty = false;

	function flush() {
		if (!dirty) return;
		db.exec('BEGIN');
		upsertDaily.run({ day, ...counts });
		for (const hash of stores) insertStore.run(day, hash);
		db.exec('COMMIT');
		counts = fresh();
		stores = new Set();
		dirty = false;
	}

	function current() {
		const today = now().toISOString().slice(0, 10);
		if (today !== day) {
			flush();
			day = today;
		}
		dirty = true;
		return counts;
	}

	return {
		connect() {
			const c = current();
			open++;
			c.connections++;
			c.peak_connections = Math.max(c.peak_connections, open);
		},
		disconnect() {
			open--;
		},
		store(storeId: string) {
			current();
			stores.add(
				createHash('sha256')
					.update(salt + storeId)
					.digest('hex')
					.slice(0, 16),
			);
		},
		sync() {
			current().syncs++;
		},
		signal() {
			current().signals++;
		},
		received(bytes: number) {
			current().bytes_in += bytes;
		},
		sent(bytes: number) {
			current().bytes_out += bytes;
		},
		flush,
		close() {
			flush();
			db.close();
		},
	};
}

export function startUsage(path: string) {
	const usage = createUsage(path);
	setInterval(usage.flush, 60_000).unref();
	for (const signal of ['SIGINT', 'SIGTERM'] as const) {
		process.once(signal, () => {
			usage.close();
			process.exit(0);
		});
	}
	return usage;
}
