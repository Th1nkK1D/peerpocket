import {
	DeleteOutlined,
	Person,
	PersonAdd,
	PersonAddAltOutlined,
	PersonOutlineOutlined,
} from '@mui/icons-material';
import {
	Avatar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	ListItem,
	ListItemAvatar,
	ListItemText,
	SpeedDial,
	SpeedDialAction,
	SpeedDialIcon,
	TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';
import { claimPlaceholder, createPlaceholder } from '../../utils/placeholder';
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
	const [isAddPlaceholderOpened, setIsAddPlaceholderOpened] = useState(false);
	const [placeholderName, setPlaceholderName] = useState('');
	const [selectedMember, setSelectedMember] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [claimTarget, setClaimTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);

	function removeMember() {
		if (!selectedMember) return;

		group.delRow('members', selectedMember.id);
		setSelectedMember(null);
	}

	function handleAddPlaceholder() {
		const trimmed = placeholderName.trim();
		if (!trimmed) return;
		createPlaceholder(group, trimmed);
		setPlaceholderName('');
		setIsAddPlaceholderOpened(false);
	}

	function handleClaim() {
		if (!claimTarget || !currentUser.hashedId) return;
		claimPlaceholder(group, claimTarget.id, currentUser.hashedId);
		setClaimTarget(null);
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
				{members.map((member) => {
					const isPlaceholder = member.isPlaceholder === true;
					return (
						<ListItem
							key={member.id}
							secondaryAction={
								<ActionMenu
									ariaLabel="Member actions"
									items={[
										...(isPlaceholder
											? [
													{
														label: 'Claim as me',
														icon: <PersonAddAltOutlined fontSize="small" />,
														onClick: () =>
															setClaimTarget({
																id: member.id,
																name: member.name,
															}),
													},
												]
											: []),
										{
											label: 'Remove',
											icon: (
												<DeleteOutlined
													fontSize="small"
													className="text-error"
												/>
											),
											onClick: () =>
												setSelectedMember({
													id: member.id,
													name: member.name,
												}),
										},
									]}
								/>
							}
						>
							<ListItemAvatar>
								<Avatar>
									{isPlaceholder ? <PersonOutlineOutlined /> : <Person />}
								</Avatar>
							</ListItemAvatar>
							<ListItemText
								primary={member.name}
								secondary={
									isPlaceholder
										? 'Not joined yet'
										: `Joined on ${dayjs(member.joinedAt).format('DD MMMM YYYY')}`
								}
							/>
						</ListItem>
					);
				})}
			</div>

			<FabsContainer>
				<SpeedDial
					ariaLabel="Add member"
					icon={<SpeedDialIcon />}
					direction="up"
				>
					<SpeedDialAction
						icon={<PersonAdd />}
						onClick={() => setIsGroupSharingOpened(true)}
						slotProps={{
							tooltip: { title: 'Invite', open: true },
							fab: { color: 'primary' },
						}}
					/>
					<SpeedDialAction
						icon={<PersonOutlineOutlined />}
						onClick={() => setIsAddPlaceholderOpened(true)}
						slotProps={{
							tooltip: { title: 'Placeholder', open: true },
							fab: { color: 'secondary' },
						}}
					/>
				</SpeedDial>
			</FabsContainer>

			<Dialog
				open={isGroupSharingOpened}
				onClose={() => setIsGroupSharingOpened(false)}
			>
				<DialogTitle>Invite new members</DialogTitle>
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
				open={isAddPlaceholderOpened}
				onClose={() => setIsAddPlaceholderOpened(false)}
				fullWidth
			>
				<DialogTitle>Add placeholder member</DialogTitle>
				<DialogContent>
					<DialogContentText typography="caption">
						Stands in for someone who hasn't joined the group yet. They can be
						added to expenses and splits right away, and later claim their place
						once they join.
					</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						label="Name"
						fullWidth
						value={placeholderName}
						onChange={(e) => setPlaceholderName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleAddPlaceholder();
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsAddPlaceholderOpened(false)}>
						Cancel
					</Button>
					<Button
						disabled={!placeholderName.trim()}
						onClick={handleAddPlaceholder}
					>
						Add
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

			<Dialog
				open={!!claimTarget}
				onClose={() => setClaimTarget(null)}
				fullWidth
			>
				{claimTarget ? (
					<>
						<DialogTitle>Claim as me?</DialogTitle>
						<DialogContent>
							<DialogContentText>
								Are you {claimTarget.name}? This placeholder will be merged into
								your account, and their share of expenses will be attributed to
								you. This action can't be undone.
							</DialogContentText>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setClaimTarget(null)} color="inherit">
								Cancel
							</Button>
							<Button onClick={handleClaim}>Claim</Button>
						</DialogActions>
					</>
				) : null}
			</Dialog>
		</>
	);
}
