import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css';
import { initializeE2E } from './utils/e2e';

const rootEl = document.getElementById('root');

async function bootstrap() {
	await initializeE2E();

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
