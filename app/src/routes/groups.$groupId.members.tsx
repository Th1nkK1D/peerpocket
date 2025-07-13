import { Person, PersonAdd } from '@mui/icons-material';
import {
	Avatar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Fab,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { FabsContainer } from '../components/fabs-container';
import { GroupSharing } from '../components/group-sharing';

export const Route = createFileRoute('/groups/$groupId/members')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { userGroupInfo, group } = Route.useLoaderData();
	const members = group.useStore().useTableRows('members');

	const [isGroupSharingOpened, setIsGroupSharingOpened] = useState(false);

	return (
		<>
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
					<DialogContentText>
						Please send them the following invitation link:
					</DialogContentText>
					<GroupSharing id={userGroupInfo.id} name={userGroupInfo.name} />
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsGroupSharingOpened(false)} autoFocus>
						Done
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
