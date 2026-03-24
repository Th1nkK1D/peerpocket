import {
	ArrowForward,
	DeleteOutline,
	GroupAdd,
	QrCodeScannerOutlined,
	SwipeLeft,
} from '@mui/icons-material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { useState } from 'react';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { FabsContainer } from '../components/fabs-container';
import {
	SwipeableList,
	SwipeableListItem,
	SwipeHint,
	SwipeTrailingAction,
} from '../components/swipeable-list';
import { GROUP_STORE_PREFIX } from '../stores/group';
import { idHelper } from '../utils/id';

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

	const groups = user.useTableRows('groups', (groups) =>
		groups.sort((a, z) => z.joinedAt - a.joinedAt),
	);

	function removeGroup() {
		if (!selectedGroup) return;

		user.delRow('groups', selectedGroup.id);
		localStorage.removeItem(
			idHelper.createStoreId(GROUP_STORE_PREFIX, selectedGroup.id),
		);
		setSelectedGroup(null);
	}

	function buildTrailingActions(id: string, name: string) {
		return (
			<SwipeTrailingAction
				label="Remove"
				icon={<DeleteOutline />}
				onClick={() => setSelectedGroup({ id, name })}
				className="bg-error text-error-contrast"
			/>
		);
	}

	return (
		<AuthenticatedLayout userStore={user}>
			<div className="m-3 mb-0 flex flex-1 flex-col gap-3">
				{groups.length ? (
					<SwipeableList className="flex flex-col gap-3">
						{groups.map(({ id, name, joinedAt }) => (
							<SwipeableListItem
								key={id}
								trailingActions={buildTrailingActions(id, name)}
							>
								<Card className="w-full">
									<CardActionArea
										onClick={() =>
											navigate({
												to: '/groups/$groupId',
												params: { groupId: id },
											})
										}
									>
										<CardContent className="flex items-center gap-2">
											<div className="flex-1">
												<h2 className="font-bold text-xl">{name}</h2>
												<p className="text-gray-500 text-sm">
													Joined {dayjs(joinedAt).format('DD MMM YY')}
												</p>
											</div>
											<ArrowForward />
										</CardContent>
									</CardActionArea>
								</Card>
							</SwipeableListItem>
						))}
						<SwipeHint icon={<SwipeLeft fontSize="small" />} className="pt-2">
							Swipe left to remove the group
						</SwipeHint>
					</SwipeableList>
				) : (
					<p className="m-auto text-center">
						You have no groups yet. <br /> Add one or join one!
					</p>
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
							<Button onClick={() => setSelectedGroup(null)}>Cancel</Button>
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
						tooltipTitle="Create"
						tooltipOpen
						onClick={() => navigate({ to: '/groups/create' })}
						slotProps={{ fab: { color: 'primary' } }}
					/>
					<SpeedDialAction
						icon={<QrCodeScannerOutlined />}
						tooltipTitle="Join"
						tooltipOpen
						onClick={() => navigate({ to: '/groups/scan' })}
						slotProps={{ fab: { color: 'secondary' } }}
					/>
				</SpeedDial>
			</FabsContainer>
		</AuthenticatedLayout>
	);
}
