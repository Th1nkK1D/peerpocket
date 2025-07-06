import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { setupUserStore } from '../stores/user';
import { activeUserStoreId } from '../utils/active-user';

export const Route = createFileRoute('/groups')({
	component: RouteComponent,
	async beforeLoad() {
		const userStoreId = activeUserStoreId.get();

		if (!userStoreId) {
			throw redirect({
				to: '/',
				replace: true,
			});
		}

		return { user: await setupUserStore(userStoreId) };
	},
	loader: ({ context }) => context,
});

function RouteComponent() {
	return <Outlet />;
}
