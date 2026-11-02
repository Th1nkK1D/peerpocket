import { useSyncExternalStore } from 'react';

type BeforeInstallPromptEvent = Event & {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallPromptState = {
	promptEvent: BeforeInstallPromptEvent | null;
	isInstalled: boolean;
};

const LS_APP_INSTALLED_KEY = 'APP_INSTALLED';

let state: InstallPromptState = {
	promptEvent: null,
	isInstalled: localStorage.getItem(LS_APP_INSTALLED_KEY) !== null,
};
const listeners = new Set<() => void>();

function setState(next: Partial<InstallPromptState>) {
	state = { ...state, ...next };
	for (const listener of listeners) listener();
}

function markInstalled() {
	localStorage.setItem(LS_APP_INSTALLED_KEY, 'true');
	setState({ promptEvent: null, isInstalled: true });
}

// Registered at import time: the event may fire before the landing route mounts
window.addEventListener('beforeinstallprompt', (event) => {
	event.preventDefault();
	// The browser only offers this when not installed, so a stored flag is stale
	localStorage.removeItem(LS_APP_INSTALLED_KEY);
	setState({
		promptEvent: event as BeforeInstallPromptEvent,
		isInstalled: false,
	});
});

window.addEventListener('appinstalled', markInstalled);

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

async function install() {
	const { promptEvent } = state;
	if (!promptEvent) return;

	// A prompt event is single use, so clear it before prompting
	setState({ promptEvent: null });
	const choice = await promptEvent
		.prompt()
		.then(() => promptEvent.userChoice)
		.catch(() => null);

	if (choice?.outcome === 'accepted') markInstalled();
}

export function isStandalone() {
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		(navigator as { standalone?: boolean }).standalone === true
	);
}

export function isIos() {
	const ua = navigator.userAgent;
	return (
		/iPhone|iPad|iPod/.test(ua) ||
		(/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
	);
}

export function isInAppBrowser() {
	const ua = navigator.userAgent;
	return (
		/FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|musical_ly|Twitter/i.test(
			ua,
		) ||
		// Android WebViews carry a wv token, iOS ones drop the Safari token
		/; wv\)/.test(ua) ||
		(isIos() && !/Safari\//.test(ua))
	);
}

export function useInstallPrompt() {
	const { promptEvent, isInstalled } = useSyncExternalStore(
		subscribe,
		() => state,
	);

	return { canPrompt: promptEvent !== null, isInstalled, install };
}
