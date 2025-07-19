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
	const { user, group, userGroupInfo } = Route.useLoaderData();

	const { peerCount } = group.useStore();

	return (
		<AuthenticatedLayout
			title={userGroupInfo.name}
			userStore={user.useStore()}
			className="!p-0"
		>
			<div className="flex flex-row py-2 px-3 justify-center items-center gap-2">
				<div
					className={`size-2 rounded-full ${
						peerCount === 0
							? 'bg-error'
							: peerCount === 1
								? 'bg-warning'
								: 'bg-success'
					}`}
				>
					<div className="size-2 rounded-full bg-inherit animate-ping"></div>
				</div>
				<span className="text-xs text-gray-400">
					{peerCount === 0
						? 'SYNC OFF - No connection to the broadcast server'
						: peerCount === 1
							? 'Sync OFF - Only you are online'
							: `Sync ON - ${peerCount - 1} peers connected`}
				</span>
			</div>
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
