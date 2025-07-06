import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../stores/group';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/groups/$groupId')({
	component: RouteComponent,
	beforeLoad: ({ params, context }) => {
		const groupStoreId = idHelper.createStoreId(
			GROUP_STORE_PREFIX,
			params.groupId,
		);

		if (!localStorage.getItem(groupStoreId)) {
			throw redirect({
				to: '/groups',
				replace: true,
			});
		}

		return {
			...context,
			group: setupGroupStore(groupStoreId),
		};
	},
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { group, user } = Route.useLoaderData();
	const userStore = user.useStore();
	const groupValues = group.useStore().useValues();

	return (
		<AuthenticatedLayout title={groupValues.name} userStore={userStore}>
			Group page
		</AuthenticatedLayout>
	);
}
