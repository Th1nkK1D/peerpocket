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
import dayjs from 'dayjs';
import { useState } from 'react';
import { FabsContainer } from '../components/fabs-container';
import { GroupSharing } from '../components/group-sharing';

export const Route = createFileRoute('/groups/$groupId/members')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { userGroupInfo, group } = Route.useLoaderData();
	const members = group.useTableRows('members', (members) =>
		members.sort((a, z) => z.joinedAt - a.joinedAt),
	);

	const [isGroupSharingOpened, setIsGroupSharingOpened] = useState(false);

	return (
		<>
			<List className="flex-1">
				{members.map((member) => (
					<ListItem key={member.id}>
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
