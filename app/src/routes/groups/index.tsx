import {
	ArchiveOutlined,
	DeleteOutlined,
	FilterList,
	GroupAdd,
	QrCodeScannerOutlined,
	UnarchiveOutlined,
} from '@mui/icons-material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import Typography from '@mui/material/Typography';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { useState } from 'react';
import { ActionMenu } from '../../components/action-menu';
import { AuthenticatedLayout } from '../../components/authenticated-layout';
import { FabsContainer } from '../../components/fabs-container';
import { GROUP_STORE_PREFIX } from '../../stores/group';
import { idHelper } from '../../utils/id';

export const Route = createFileRoute('/groups/')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user } = Route.useLoaderData();
	const navigate = useNavigate();
	const [selectedGroup, setSelectedGroup] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [filter, setFilter] = useState<'active' | 'archived'>('active');

	const groups = user.useTableRows('groups', (groups) =>
		groups
			.filter((g) => (filter === 'active' ? !g.archivedAt : g.archivedAt))
			.sort((a, z) => z.joinedAt - a.joinedAt),
	);

	function archiveGroup(id: string) {
		user.setCell('groups', id, 'archivedAt', Date.now());
	}

	function unarchiveGroup(id: string) {
		user.delCell('groups', id, 'archivedAt');
	}

	function removeGroup() {
		if (!selectedGroup) return;

		user.delRow('groups', selectedGroup.id);
		localStorage.removeItem(
			idHelper.createStoreId(GROUP_STORE_PREFIX, selectedGroup.id),
		);
		setSelectedGroup(null);
	}

	return (
		<AuthenticatedLayout title="PeerPockets" userStore={user} hideBackButton>
			<div className="m-3 mb-0 flex flex-1 flex-col gap-3">
				<div className="flex justify-between">
					<Typography variant="h5">Groups</Typography>
					<ActionMenu
						ariaLabel="Filter groups"
						triggerIcon={<FilterList fontSize="small" />}
						items={[
							{
								label: 'Active',
								selected: filter === 'active',
								onClick: () => setFilter('active'),
							},
							{
								label: 'Archived',
								selected: filter === 'archived',
								onClick: () => setFilter('archived'),
							},
						]}
					/>
				</div>
				{groups.length ? (
					<div className="flex flex-col gap-3">
						{groups.map(({ id, name, joinedAt, archivedAt }) => (
							<Card
								key={id}
								className="w-full"
								elevation={2}
								variant={archivedAt ? 'outlined' : 'elevation'}
							>
								<CardContent className="flex items-start gap-2 py-3 pr-2 pl-5">
									<Link
										to="/groups/$groupId"
										params={{ groupId: id }}
										className="flex flex-1 flex-col"
									>
										<Typography variant="h6">{name}</Typography>
										<Typography variant="body2" color="textSecondary">
											Joined {dayjs(joinedAt).format('DD MMM YY')}
										</Typography>
									</Link>
									<ActionMenu
										ariaLabel="Group options"
										items={[
											archivedAt
												? {
														label: 'Unarchive',
														icon: (
															<UnarchiveOutlined
																fontSize="small"
																className="text-warning"
															/>
														),
														onClick: () => unarchiveGroup(id),
													}
												: {
														label: 'Archive',
														icon: (
															<ArchiveOutlined
																fontSize="small"
																className="text-warning"
															/>
														),
														onClick: () => archiveGroup(id),
													},
											{
												label: 'Remove',
												icon: (
													<DeleteOutlined
														fontSize="small"
														className="text-error"
													/>
												),
												onClick: () => setSelectedGroup({ id, name }),
											},
										]}
									/>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<Typography variant="body2" className="m-auto max-w-48 text-center">
						{filter === 'active'
							? 'You have no active group yet, create one or join one'
							: 'No archived groups'}
					</Typography>
				)}
			</div>
			<Dialog
				open={!!selectedGroup}
				onClose={() => setSelectedGroup(null)}
				fullWidth
			>
				{selectedGroup ? (
					<>
						<DialogTitle>Remove {selectedGroup.name}?</DialogTitle>
						<DialogContent>
							<DialogContentText>
								Your data won't be remove from your peer's devices and you can
								re-join the group anytime.
							</DialogContentText>
						</DialogContent>
						<DialogActions>
							<Button color="inherit" onClick={() => setSelectedGroup(null)}>
								Cancel
							</Button>
							<Button color="error" onClick={removeGroup}>
								Remove
							</Button>
						</DialogActions>
					</>
				) : null}
			</Dialog>
			<FabsContainer>
				<SpeedDial
					ariaLabel="Group actions"
					icon={<SpeedDialIcon />}
					direction="up"
				>
					<SpeedDialAction
						icon={<GroupAdd />}
						onClick={() => navigate({ to: '/groups/create' })}
						slotProps={{
							tooltip: { title: 'Create', open: true },
							fab: { color: 'primary' },
						}}
					/>
					<SpeedDialAction
						icon={<QrCodeScannerOutlined />}
						onClick={() => navigate({ to: '/groups/scan' })}
						slotProps={{
							tooltip: { title: 'Join', open: true },
							fab: { color: 'secondary' },
						}}
					/>
				</SpeedDial>
			</FabsContainer>
		</AuthenticatedLayout>
	);
}
