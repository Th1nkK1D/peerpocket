import {
	DeleteOutline,
	Person,
	PersonAdd,
	SwipeLeft,
} from '@mui/icons-material';
import {
	Avatar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Fab,
	ListItem,
	ListItemAvatar,
	ListItemText,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { useState } from 'react';
import { FabsContainer } from '../components/fabs-container';
import { GroupSharing } from '../components/group-sharing';
import {
	SwipeableList,
	SwipeableListItem,
	SwipeHint,
	SwipeTrailingAction,
} from '../components/swipeable-list';

export const Route = createFileRoute('/groups/$groupId/members')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user, userGroupInfo, group } = Route.useLoaderData();
	const currentUser = user.useValues();
	const members = group.useTableRows('members', (members) =>
		members.sort((a, z) => z.joinedAt - a.joinedAt),
	);
	const expenses = group.useTableRows('expenses');
	const splits = group.useTableRows('splits');

	const [isGroupSharingOpened, setIsGroupSharingOpened] = useState(false);
	const [selectedMember, setSelectedMember] = useState<{
		id: string;
		name: string;
	} | null>(null);

	function removeMember() {
		if (!selectedMember) return;

		group.delRow('members', selectedMember.id);
		setSelectedMember(null);
	}

	function buildTrailingActions(id: string, name: string) {
		return (
			<SwipeTrailingAction
				label="Delete"
				icon={<DeleteOutline />}
				onClick={() => setSelectedMember({ id, name })}
				className="bg-error text-error-contrast"
			/>
		);
	}

	const deleteBlockedReason = selectedMember
		? selectedMember.id === currentUser.hashedId
			? 'You cannot delete yourself from the group.'
			: expenses.some(
						(expense) => expense.paidByMemberId === selectedMember.id,
					) || splits.some((split) => split.memberId === selectedMember.id)
				? 'This member cannot be deleted because they are related to an expense or split.'
				: null
		: null;

	return (
		<>
			<SwipeableList>
				{members.map((member) => (
					<SwipeableListItem
						key={member.id}
						trailingActions={buildTrailingActions(member.id, member.name)}
					>
						<ListItem>
							<ListItemAvatar>
								<Avatar>
									<Person />
								</Avatar>
							</ListItemAvatar>
							<ListItemText
								primary={member.name}
								secondary={`Joined on ${dayjs(member.joinedAt).format('DD MMMM YYYY')}`}
							/>
						</ListItem>
					</SwipeableListItem>
				))}
				<SwipeHint icon={<SwipeLeft fontSize="small" />} className="px-3 pt-2">
					Swipe left to delete a member
				</SwipeHint>
			</SwipeableList>

			<FabsContainer>
				<Fab
					color="primary"
					aria-label="Add new member"
					onClick={() => setIsGroupSharingOpened(true)}
				>
					<PersonAdd />
				</Fab>
			</FabsContainer>

			<Dialog
				open={isGroupSharingOpened}
				onClose={() => setIsGroupSharingOpened(false)}
			>
				<DialogTitle>Add new members</DialogTitle>
				<DialogContent>
					<GroupSharing
						id={userGroupInfo.id}
						name={userGroupInfo.name}
						label="Share the QR Code or the link with your friends"
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsGroupSharingOpened(false)} autoFocus>
						Done
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={!!selectedMember}
				onClose={() => setSelectedMember(null)}
				fullWidth
			>
				{selectedMember ? (
					<>
						<DialogTitle>
							{deleteBlockedReason
								? `Cannot delete ${selectedMember.name}`
								: `Delete ${selectedMember.name}?`}
						</DialogTitle>
						<DialogContent>
							<DialogContentText>
								{deleteBlockedReason ??
									'They can be added back later by sharing the group again.'}
							</DialogContentText>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setSelectedMember(null)}>
								{deleteBlockedReason ? 'Close' : 'Cancel'}
							</Button>
							{deleteBlockedReason ? null : (
								<Button color="error" onClick={removeMember}>
									Delete
								</Button>
							)}
						</DialogActions>
					</>
				) : null}
			</Dialog>
		</>
	);
}
