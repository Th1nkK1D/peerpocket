import { CircularProgress, Paper, Typography } from '@mui/material';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AuthenticatedLayout } from '../../../components/authenticated-layout';
import { NavigationTabs } from '../../../components/navigation-tabs';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../../../stores/group';
import { idHelper } from '../../../utils/id';

export const Route = createFileRoute('/groups/$groupId')({
	component: RouteComponent,
	async beforeLoad({ params, context }) {
		const { user } = context;

		if (!user.hasRow('groups', params.groupId)) {
			throw redirect({
				to: '/groups',
				replace: true,
			});
		}

		const groupStoreId = idHelper.createStoreId(
			GROUP_STORE_PREFIX,
			params.groupId,
		);

		const group = await setupGroupStore(groupStoreId);
		const hashedId = user.getValue('hashedId') as string;

		if (!group.hasRow('members', hashedId)) {
			group.setRow('members', hashedId, {
				name: user.getValue('name') as string,
				joinedAt: user.getCell('groups', params.groupId, 'joinedAt'),
			});
		}

		return {
			...context,
			userGroupInfo: {
				id: params.groupId,
				...context.user.getRow('groups', params.groupId),
			},
			group,
		};
	},
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user, group, userGroupInfo } = Route.useLoaderData();
	const { peerCount, isSyncing } = group.usePeerSync();

	return (
		<AuthenticatedLayout
			title={userGroupInfo.name}
			userStore={user}
			className="!p-0"
		>
			<Paper elevation={1} className="rounded-none">
				<div className="flex flex-row items-center justify-center gap-2 px-3 pt-2 pb-1">
					{isSyncing && peerCount > 1 ? (
						<CircularProgress size={8} className="text-success" />
					) : (
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
					)}
					<Typography variant="caption" color="textSecondary">
						{isSyncing && peerCount > 1
							? `Syncing with ${peerCount - 1} peer`
							: peerCount === 0
								? 'No connection to the relay server'
								: peerCount === 1
									? 'Only you are online'
									: `Online with ${peerCount - 1} peer`}
					</Typography>
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

			<Outlet />
		</AuthenticatedLayout>
	);
}
