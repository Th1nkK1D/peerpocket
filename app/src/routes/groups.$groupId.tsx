import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { NavigationTabs } from '../components/navigation-tabs';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../stores/group';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/groups/$groupId')({
	component: RouteComponent,
	async beforeLoad({ params, context }) {
		const groupStoreId = idHelper.createStoreId(
			GROUP_STORE_PREFIX,
			params.groupId,
		);

		const userStore = context.user.getStore();

		if (!userStore.hasRow('groups', params.groupId)) {
			throw redirect({
				to: '/groups',
				replace: true,
			});
		}

		return {
			...context,
			userGroupInfo: userStore.getRow('groups', params.groupId),
			group: await setupGroupStore(groupStoreId),
		};
	},
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user, userGroupInfo } = Route.useLoaderData();

	return (
		<AuthenticatedLayout
			title={userGroupInfo.name}
			userStore={user.useStore()}
			className="!p-0"
		>
			<NavigationTabs
				variant="fullWidth"
				tabs={[
					{
						label: 'Expenses',
						to: 'expenses',
						replace: true,
					},
					{ label: 'Members', to: 'members', replace: true },
				]}
			/>
			<Outlet />
		</AuthenticatedLayout>
	);
}
