import { RouterProvider, createRouter } from '@tanstack/react-router';
import * as React from 'react';

import { routeTree } from './routeTree.gen';

// Set up a Router instance
const router = createRouter({
	routeTree,
	defaultPreload: 'intent',
	scrollRestoration: true,
});

// Register things for typesafety
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}
const App = () => {
	return <RouterProvider router={router} />;
};

export default App;
