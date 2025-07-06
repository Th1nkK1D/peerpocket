import { Person } from '@mui/icons-material';
import {
	Avatar,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
} from '@mui/material';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { useTabView } from '../hooks/tab-view';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../stores/group';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/groups/$groupId')({
	component: RouteComponent,
	async beforeLoad({ params, context }) {
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
			group: await setupGroupStore(groupStoreId),
		};
	},
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { group, user } = Route.useLoaderData();

	const userStore = user.useStore();
	const groupStore = group.useStore();

	const groupValues = groupStore.useValues();
	const members = groupStore.useTableRows('members');

	const { Tabs, Tab, TabPanel, activeTab } = useTabView('group');

	return (
		<AuthenticatedLayout
			title={groupValues.name}
			userStore={userStore}
			className="!p-0"
		>
			<Tabs aria-label="Group transactions and members" variant="fullWidth">
				<Tab label="Transactions" index={0} />
				<Tab label={`Members (${members.length})`} index={1} />
			</Tabs>
			<TabPanel className="flex-1 flex flex-col" value={activeTab} index={0}>
				<p className="text-center m-auto">
					Look like no one has taking a note just yet.
				</p>
			</TabPanel>
			<TabPanel value={activeTab} index={1}>
				<List>
					{members.map((member) => (
						<ListItem key={member.hashedId}>
							<ListItemAvatar>
								<Avatar>
									<Person />
								</Avatar>
							</ListItemAvatar>
							<ListItemText
								primary={member.name}
								secondary={`Joined at ${new Date(member.joinedAt).toLocaleString()}`}
							/>
						</ListItem>
					))}
				</List>
			</TabPanel>
		</AuthenticatedLayout>
	);
}
