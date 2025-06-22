import { createFileRoute, redirect } from '@tanstack/react-router';
import { setupUserStore } from '../stores/user';
import { activeUserStoreId } from '../utils/active-user';

export const Route = createFileRoute('/groups')({
	component: RouteComponent,
	beforeLoad() {
		const userStoreId = activeUserStoreId.get();

		if (!userStoreId) {
			throw redirect({
				to: '/',
				replace: true,
			});
		}

		return { userStoreId };
	},
	loader({ context }) {
		const userStore = setupUserStore(context.userStoreId);

		return {
			userStore,
		};
	},
});

function RouteComponent() {
	const { userStore } = Route.useLoaderData();

	const user = userStore.useStore();
	const userValues = user.useValues();

	return <div>Hi, {userValues.name}</div>;
}
