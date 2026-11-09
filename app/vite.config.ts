import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	define: {
		global: 'globalThis',
	},
	envPrefix: 'PUBLIC_',
	resolve: {
		// simple-peer's source needs Node's `events`, which Vite stubs out in the browser; its bundled build doesn't
		alias: [
			{ find: /^simple-peer$/, replacement: 'simple-peer/simplepeer.min.js' },
		],
	},
	plugins: [
		tanstackRouter({
			target: 'react',
			autoCodeSplitting: true,
			routeFileIgnorePattern: '\\.spec\\.tsx?$',
		}),
		react(),
		VitePWA({
			registerType: 'prompt',
			includeAssets: [
				'favicon.svg',
				'apple-touch-icon.png',
				'favicon-192x192-20261109.png',
				'favicon-512x512-20261109.png',
				'maskable-512x512-20261109.png',
			],
			workbox: {
				cleanupOutdatedCaches: true,
				globPatterns: ['**/*.{js,css,html,woff2}'],
			},
			manifest: {
				id: '/',
				name: 'PeerPocket',
				short_name: 'PeerPocket',
				description: 'Peer-to-peer expense tracker',
				theme_color: '#000000',
				background_color: '#9fa8da',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: 'favicon-192x192-20261109.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'favicon-512x512-20261109.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: 'maskable-512x512-20261109.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
			},
		}),
	],
	server: {
		host: '127.0.0.1',
		port: 8000,
	},
});
