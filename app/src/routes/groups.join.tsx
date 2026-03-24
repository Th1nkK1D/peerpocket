import { HandshakeOutlined } from '@mui/icons-material';
import { Avatar, Button, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { useState } from 'react';
import { z } from 'zod/v4';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { LinkButton } from '../components/links';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../stores/group';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/groups/join')({
	component: RouteComponent,
	validateSearch: zodValidator(
		z.object({
			id: z.string().nonempty(),
			name: z.string().nonempty(),
		}),
	),
	loaderDeps: ({ search: { id, name } }) => ({ id, name }),
	loader: async ({ deps, context }) => ({
		...deps,
		...context,
		group: await setupGroupStore(
			idHelper.createStoreId(GROUP_STORE_PREFIX, deps.id),
		),
	}),
});

function RouteComponent() {
	const { id, name, user, group } = Route.useLoaderData();
	const hashedId = user.getValue('hashedId') as string;
	const [hasJoined, setHasJoined] = useState(
		() => user.hasRow('groups', id) && group.hasRow('members', hashedId),
	);

	function joinGroup() {
		const memberName = user.getValue('name') as string;
		const joinedAt = Date.now();

		if (!user.hasRow('groups', id)) {
			user.setRow('groups', id, {
				name,
				joinedAt,
			});
		}

		if (!group.hasRow('members', hashedId)) {
			group.setRow('members', hashedId, {
				name: memberName,
				joinedAt,
			});
		}

		setHasJoined(true);
	}

	return (
		<AuthenticatedLayout userStore={user} className="justify-center">
			<div className="flex flex-col items-center gap-8 px-4">
				<Avatar
					className={`size-16 ${hasJoined ? 'bg-success' : 'bg-secondary'}`}
				>
					<HandshakeOutlined className="size-8" />
				</Avatar>
				<div className="text-center">
					<Typography variant="subtitle1" className="text-gray-200">
						{hasJoined ? `You've joined` : `You've been invited to`}
					</Typography>
					<Typography variant="h6" component="h1">
						{name}
					</Typography>
				</div>
				<div className="flex w-full flex-col gap-2">
					{hasJoined ? (
						<LinkButton
							variant="contained"
							to="/groups/$groupId"
							params={{ groupId: id }}
							replace
						>
							Go to the group
						</LinkButton>
					) : (
						<Button variant="contained" onClick={joinGroup}>
							Join the group
						</Button>
					)}
					<LinkButton to="/groups" replace>
						{hasJoined ? 'Return home' : 'Cancel'}
					</LinkButton>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
