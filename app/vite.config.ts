import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	envPrefix: 'PUBLIC_',
	plugins: [
		tanstackRouter({
			target: 'react',
			autoCodeSplitting: true,
			routeFileIgnorePattern: '\\.spec\\.tsx?$',
		}),
		react(),
	],
	server: {
		host: '127.0.0.1',
		port: 8000,
	},
});
