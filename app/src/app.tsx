import { createRouter, RouterProvider } from '@tanstack/react-router';

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
