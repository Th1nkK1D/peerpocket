import { HandshakeOutlined } from '@mui/icons-material';
import { Avatar } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
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
	loader: async ({ deps, context }) => {
		const { id, name } = deps;
		const { user } = context;

		const group = await setupGroupStore(
			idHelper.createStoreId(GROUP_STORE_PREFIX, id),
		);

		const hashedId = user.getValue('hashedId') as string;
		const joinedAt = Date.now();

		if (!user.hasRow('groups', id)) {
			user.setRow('groups', id, {
				id,
				name,
				joinedAt,
			});
		}

		if (!group.hasRow('members', hashedId)) {
			group.setRow('members', hashedId, {
				hashedId,
				name: user.getValue('name'),
				joinedAt,
			});
		}

		return { ...deps, ...context };
	},
});

function RouteComponent() {
	const { id, name, user } = Route.useLoaderData();

	return (
		<AuthenticatedLayout userStore={user} className="justify-center">
			<div className="flex flex-col items-center gap-8">
				<Avatar className="size-16 bg-success">
					<HandshakeOutlined className="size-8" />
				</Avatar>
				<div className="text-center">
					<p>You have successfully joined the group</p>
					<p className="font-bold text-xl">"{name}"</p>
				</div>
				<div className="flex flex-col gap-2">
					<LinkButton
						variant="contained"
						to="/groups/$groupId"
						params={{ groupId: id }}
						replace
					>
						Go to the group
					</LinkButton>
					<LinkButton to="/groups" replace>
						Return home
					</LinkButton>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
