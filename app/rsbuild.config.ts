import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/rspack';

export default defineConfig({
	plugins: [pluginReact()],
	tools: {
		rspack: {
			plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true })],
		},
	},
	html: {
		title: 'PeerPocket - Your Peer-to-peer expense tracker',
		meta: {
			name: 'viewport',
			content: 'initial-scale=1, width=device-width',
		},
		tags: [
			{
				tag: 'link',
				attrs: {
					rel: 'icon',
					href: '/favicon-72x72.png',
				},
			},
			{
				tag: 'link',
				attrs: {
					rel: 'manifest',
					href: '/app.webmanifest',
				},
			},
			{
				tag: 'link',
				attrs: {
					rel: 'stylesheet',
					href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
				},
			},
		],
	},
});
