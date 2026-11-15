import { StartClient } from '@tanstack/react-start/client';
import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';

import { initializeE2E } from '../../tests/mocks/playwright';
import './hooks/install-prompt';
import {
	activeUserStoreId,
	requestPersistentStorage,
} from './utils/active-user';

// Recover when a lazy route chunk vanished after a new deployment
window.addEventListener('vite:preloadError', (event) => {
	event.preventDefault();
	window.location.reload();
});

async function bootstrap() {
	if ('__PEERPOCKET_E2E__' in window) {
		await initializeE2E();
	}

	if (activeUserStoreId.get()) {
		requestPersistentStorage();
	}

	startTransition(() => {
		hydrateRoot(
			document,
			<StrictMode>
				<StartClient />
			</StrictMode>,
		);
	});
}

void bootstrap();
