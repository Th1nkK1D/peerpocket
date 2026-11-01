export interface GroupInvite {
	id: string;
	name: string;
}

const JOIN_PATH = '/groups/join';

function readJoinParams(url: URL): Record<string, unknown> | null {
	if (url.pathname === JOIN_PATH) {
		return Object.fromEntries(url.searchParams);
	}

	// Signed-out invitees get redirected to the landing route, so this is the URL they can copy
	if (url.pathname === '/' && url.searchParams.get('path') === JOIN_PATH) {
		return JSON.parse(url.searchParams.get('params') ?? 'null');
	}

	return null;
}

export function parseGroupJoinUrl(rawValue: string): GroupInvite | null {
	try {
		const params = readJoinParams(
			new URL(rawValue.trim(), window.location.origin),
		);

		const id = String(params?.id ?? '').trim();
		const name = String(params?.name ?? '').trim();

		if (!id || !name) {
			return null;
		}

		return { id, name };
	} catch {
		return null;
	}
}
