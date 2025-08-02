import { Paper } from '@mui/material';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { NavigationTabs } from '../components/navigation-tabs';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../stores/group';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/groups/$groupId')({
	component: RouteComponent,
	async beforeLoad({ params, context }) {
		if (!context.user.hasRow('groups', params.groupId)) {
			throw redirect({
				to: '/groups',
				replace: true,
			});
		}

		const groupStoreId = idHelper.createStoreId(
			GROUP_STORE_PREFIX,
			params.groupId,
		);

		return {
			...context,
			userGroupInfo: {
				id: params.groupId,
				...context.user.getRow('groups', params.groupId),
			},
			group: await setupGroupStore(groupStoreId),
		};
	},
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user, group, userGroupInfo } = Route.useLoaderData();

	const peerCount = group.usePeerSync();

	return (
		<AuthenticatedLayout
			title={userGroupInfo.name}
			userStore={user}
			className="!p-0"
		>
			<Paper elevation={1} className="rounded-none">
				<div className="flex flex-row items-center justify-center gap-2 px-3 pt-2 pb-1">
					<div
						className={`size-2 rounded-full ${
							peerCount === 0
								? 'bg-error'
								: peerCount === 1
									? 'bg-warning'
									: 'bg-success'
						}`}
					>
						<div className="size-2 animate-ping rounded-full bg-inherit"></div>
					</div>
					<span className="text-gray-400 text-xs">
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
							label: 'Summary',
							to: 'summary',
							replace: true,
						},
						{
							label: 'Expenses',
							to: 'expenses',
							replace: true,
						},
						{ label: 'Members', to: 'members', replace: true },
					]}
				/>
			</Paper>
			<div className="flex flex-1 flex-col overflow-y-scroll">
				<Outlet />
			</div>
		</AuthenticatedLayout>
	);
}
