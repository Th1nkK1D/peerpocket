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

		console.log(id, name);

		const userStore = context.user.getStore();
		const groupStore = (
			await setupGroupStore(idHelper.createStoreId(GROUP_STORE_PREFIX, id))
		).getStore();

		const hashedId = userStore.getValue('hashedId');
		const joinedAt = Date.now();

		if (!userStore.hasRow('groups', id)) {
			userStore.setRow('groups', id, {
				id,
				name,
				joinedAt,
			});
		}

		if (!groupStore.hasRow('members', hashedId)) {
			groupStore.setRow('members', hashedId, {
				hashedId,
				name: userStore.getValue('name'),
				joinedAt,
			});
		}

		return { ...deps, ...context };
	},
});

function RouteComponent() {
	const { id, name, user } = Route.useLoaderData();

	return (
		<AuthenticatedLayout userStore={user.useStore()} className="justify-center">
			<div className="flex flex-col items-center gap-8">
				<Avatar className="size-16 bg-success">
					<HandshakeOutlined className="size-8" />
				</Avatar>
				<div className="text-center">
					<p>You have successfully joined the group</p>
					<p className="text-xl font-bold">"{name}"</p>
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
