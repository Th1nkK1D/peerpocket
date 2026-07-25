// Kills stale dev servers left on the playwright webServer ports, so the
// CI/pre-push run (reuseExistingServer: false) can't fail on a busy port.
// Local runs without CI reuse existing servers by design, so they are spared.
const PORTS = ['3000', '8000'];

if (!process.env.CI) process.exit(0);

const output = await new Response(Bun.spawn(['ss', '-tlnp']).stdout).text();
const portPattern = new RegExp(`:(${PORTS.join('|')})\\s`);

const killed = new Set<number>();
for (const line of output.split('\n')) {
	const port = line.match(portPattern);
	if (!port) continue;
	for (const [, pid] of line.matchAll(/pid=(\d+)/g)) {
		const id = Number(pid);
		if (killed.has(id)) continue;
		try {
			process.kill(id, 'SIGTERM');
			killed.add(id);
			console.log(`Killed stale process ${id} on port ${port[1]}`);
		} catch (_) {}
	}
}

if (killed.size > 0) {
	await Bun.sleep(1000);
}
