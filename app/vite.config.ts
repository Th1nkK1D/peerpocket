import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	define: {
		global: 'globalThis',
	},
	envPrefix: 'PUBLIC_',
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
				'favicon-72x72.png',
				'favicon-192x192.png',
				'favicon-512x512.png',
				'maskable-512x512.png',
			],
			workbox: {
				cleanupOutdatedCaches: true,
			},
			manifest: {
				id: '/',
				name: 'PeerPocket',
				short_name: 'PeerPocket',
				description: 'Peer-to-peer expense tracker',
				theme_color: '#673ab7',
				background_color: '#ffffff',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: 'favicon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'favicon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: 'maskable-512x512.png',
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
