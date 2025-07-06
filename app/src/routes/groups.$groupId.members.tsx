import { Person } from '@mui/icons-material';
import {
	Avatar,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/groups/$groupId/members')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { group } = Route.useLoaderData();

	const members = group.useStore().useTableRows('members');

	return (
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
	);
}
