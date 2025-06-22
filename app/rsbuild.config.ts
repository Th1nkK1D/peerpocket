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
		title: 'PeerPocket',
		meta: {
			name: 'viewport',
			content: 'initial-scale=1, width=device-width',
		},
		tags: {
			tag: 'link',
			attrs: {
				href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
				rel: 'stylesheet',
			},
		},
	},
});
