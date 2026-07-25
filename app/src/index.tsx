import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css';
import { initializeE2E } from '../../tests/mocks/playwright';

// Recover when a lazy route chunk vanished after a new deployment
window.addEventListener('vite:preloadError', (event) => {
	event.preventDefault();
	window.location.reload();
});

const rootEl = document.getElementById('root');

async function bootstrap() {
	if ('__PEERPOCKET_E2E__' in window) {
		await initializeE2E();
	}

	if (rootEl) {
		const root = ReactDOM.createRoot(rootEl);
		root.render(
			<React.StrictMode>
				<App />
			</React.StrictMode>,
		);
	}
}

void bootstrap();
