import { DeleteOutlined, Person, PersonAdd } from '@mui/icons-material';
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
import dayjs from 'dayjs';
import { useState } from 'react';
import { ActionMenu } from '../action-menu';
import { FabsContainer } from '../fabs-container';
import { GroupSharing } from '../group-sharing';
import type { PanelProps } from './types';

export function MembersPanel({ user, userGroupInfo, group }: PanelProps) {
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

	const removeBlockedReason = selectedMember
		? selectedMember.id === currentUser.hashedId
			? 'You cannot remove yourself from the group.'
			: expenses.some(
						(expense) => expense.paidByMemberId === selectedMember.id,
					) || splits.some((split) => split.memberId === selectedMember.id)
				? 'This member cannot be removed because they are related to an expense or split.'
				: null
		: null;

	return (
		<>
			<div className="flex flex-1 flex-col">
				{members.map((member) => (
					<ListItem
						key={member.id}
						secondaryAction={
							<ActionMenu
								ariaLabel="Member actions"
								items={[
									{
										label: 'Remove',
										icon: (
											<DeleteOutlined fontSize="small" className="text-error" />
										),
										onClick: () =>
											setSelectedMember({ id: member.id, name: member.name }),
									},
								]}
							/>
						}
					>
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
				))}
			</div>

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
							{removeBlockedReason
								? `Cannot remove ${selectedMember.name}`
								: `Remove ${selectedMember.name}?`}
						</DialogTitle>
						<DialogContent>
							<DialogContentText>
								{removeBlockedReason ??
									'They can be added back later by sharing the group again.'}
							</DialogContentText>
						</DialogContent>
						<DialogActions>
							<Button color="inherit" onClick={() => setSelectedMember(null)}>
								{removeBlockedReason ? 'Close' : 'Cancel'}
							</Button>
							{removeBlockedReason ? null : (
								<Button color="error" onClick={removeMember}>
									Remove
								</Button>
							)}
						</DialogActions>
					</>
				) : null}
			</Dialog>
		</>
	);
}
