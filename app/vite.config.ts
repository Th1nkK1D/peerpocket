import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { type VitePluginPWAAPI, VitePWA } from 'vite-plugin-pwa';

// vite-plugin-pwa isn't environment-aware, so keep it out of Start's server build
const pwa = VitePWA({
	registerType: 'prompt',
	outDir: 'dist',
	includeAssets: [
		'favicon.svg',
		'apple-touch-icon.png',
		'favicon-192x192-20261110.png',
		'favicon-512x512-20261110.png',
		'maskable-512x512-20261110.png',
	],
	workbox: {
		cleanupOutdatedCaches: true,
		globPatterns: ['**/*.{js,css,html,woff2,svg}'],
		// index.html is the static landing page, so app routes fall back to the SPA shell
		navigateFallback: '_shell.html',
		runtimeCaching: [
			{
				urlPattern:
					/^https:\/\/cdn\.jsdelivr\.net\/npm\/@fawazahmed0\/currency-api@/,
				handler: 'NetworkFirst',
				options: {
					cacheName: 'currency-rates',
					networkTimeoutSeconds: 5,
					expiration: { maxEntries: 20 },
				},
			},
		],
	},
	manifest: {
		id: '/',
		name: 'PeerPocket',
		short_name: 'PeerPocket',
		description: 'Peer-to-peer expense tracker',
		theme_color: '#000000',
		background_color: '#5c6bc0',
		display: 'standalone',
		scope: '/',
		start_url: '/groups',
		icons: [
			{
				src: 'favicon-192x192-20261110.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: 'favicon-512x512-20261110.png',
				sizes: '512x512',
				type: 'image/png',
			},
			{
				src: 'maskable-512x512-20261110.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
		],
	},
}).map((plugin) =>
	plugin.name === 'vite-plugin-pwa:build'
		? {
				...plugin,
				applyToEnvironment: (environment) => environment.name === 'client',
			}
		: plugin,
);

const pwaApi = pwa.find((plugin) => plugin.name === 'vite-plugin-pwa')
	?.api as VitePluginPWAAPI;

export default defineConfig({
	define: {
		global: 'globalThis',
	},
	envPrefix: 'PUBLIC_',
	environments: {
		client: {
			build: { outDir: 'dist' },
			optimizeDeps: { entries: ['src/**/*.tsx'] },
		},
		ssr: { build: { outDir: '.tanstack/server' } },
	},
	resolve: {
		// simple-peer's source needs Node's `events`, which Vite stubs out in the browser; its bundled build doesn't
		alias: [
			{ find: /^simple-peer$/, replacement: 'simple-peer/simplepeer.min.js' },
		],
	},
	plugins: [
		tanstackStart({
			router: {
				autoCodeSplitting: true,
				routeFileIgnorePattern: '\\.spec\\.tsx?$',
			},
			dev: { ssrStyles: { enabled: false } },
			spa: {
				enabled: true,
				maskPath: '/groups',
				prerender: { outputPath: '/_shell.html' },
			},
			pages: [{ path: '/', prerender: { enabled: true, crawlLinks: false } }],
		}),
		react(),
		...pwa,
		{
			name: 'pwa-after-prerender',
			apply: 'build',
			enforce: 'post',
			// Regenerate once Start has prerendered the shell, so index.html is precached
			buildApp: { order: 'post', handler: () => pwaApi.generateSW() },
		},
	],
	server: {
		host: '127.0.0.1',
		port: 8000,
	},
});
