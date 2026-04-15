import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './src/routes',
	fullyParallel: true,
	retries: 0,
	use: {
		baseURL: 'http://127.0.0.1:8000',
		trace: 'on-first-retry',
		launchOptions: {
			executablePath: '/etc/profiles/per-user/lkz/bin/chromium',
		},
	},
	webServer: {
		command: '../node_modules/.bin/rsbuild dev --host 127.0.0.1 --port 8000',
		url: 'http://127.0.0.1:8000',
		reuseExistingServer: true,
		timeout: 120000,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
