import { DatabaseSync } from 'node:sqlite';

type Row = Record<string, string | number>;

const path = process.argv[2] ?? process.env.STATS_DB ?? 'usage.db';
const db = new DatabaseSync(path, { readOnly: true });

const firstSeen =
	'SELECT store_hash, min(day) AS first_day FROM store_day GROUP BY store_hash';

const summary = db.prepare(`
	SELECT
		(SELECT count(DISTINCT store_hash) FROM store_day WHERE day >= date('now', $offset)) AS stores,
		(SELECT count(*) FROM (${firstSeen}) WHERE first_day >= date('now', $offset)) AS new_stores,
		coalesce(sum(connections), 0) AS connections,
		coalesce(max(peak_connections), 0) AS peak_connections,
		coalesce(sum(syncs), 0) AS syncs,
		coalesce(sum(signals), 0) AS signals,
		coalesce(sum(bytes_in), 0) AS bytes_in,
		coalesce(sum(bytes_out), 0) AS bytes_out
	FROM daily WHERE day >= date('now', $offset)
`);

const daily = db
	.prepare(
		`SELECT
			d.day AS label,
			(SELECT count(*) FROM store_day s WHERE s.day = d.day) AS stores,
			(SELECT count(*) FROM (${firstSeen}) WHERE first_day = d.day) AS new_stores,
			d.*
		FROM daily d ORDER BY d.day DESC LIMIT 30`,
	)
	.all() as Row[];

const periods = [
	['Today', '0 days'],
	['Last 7 days', '-6 days'],
	['Last 30 days', '-29 days'],
] as const;
const totals = periods.map(([label, offset]) => ({
	...(summary.get({ offset }) as Row),
	label,
}));

const { since } = db.prepare('SELECT min(day) AS since FROM daily').get() as {
	since: string | null;
};

const num = (n: number) => n.toLocaleString('en-US');
const bytes = (n: number) => {
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let i = 0;
	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i++;
	}
	return `${i ? n.toFixed(1) : n} ${units[i]}`;
};

const columns = [
	['Stores', 'stores', num],
	['New', 'new_stores', num],
	['Connections', 'connections', num],
	['Peak conns', 'peak_connections', num],
	['Syncs', 'syncs', num],
	['Signals', 'signals', num],
	['In', 'bytes_in', bytes],
	['Out', 'bytes_out', bytes],
] as const;

function table(first: string, rows: Row[]) {
	const header = [first, ...columns.map((c) => c[0])];
	const cells = rows.map((r) => [
		String(r.label),
		...columns.map(([, key, format]) => format(r[key] as number)),
	]);
	const widths = header.map((h, i) =>
		Math.max(h.length, ...cells.map((c) => c[i]!.length)),
	);
	for (const line of [header, ...cells]) {
		console.log(
			line
				.map((c, i) => (i ? c.padStart(widths[i]!) : c.padEnd(widths[i]!)))
				.join('   '),
		);
	}
}

console.log(`PeerPocket relay usage  (db: ${path})`);
console.log(
	since
		? `Collecting since ${since} · days in UTC\n`
		: 'No usage recorded yet\n',
);
table('', totals);
console.log();
table('Day', daily);
