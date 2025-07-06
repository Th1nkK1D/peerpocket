import { createFileRoute, redirect } from '@tanstack/react-router';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../stores/group';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/groups/$groupId')({
	component: RouteComponent,
	beforeLoad: ({ params, context }) => {
		const groupStoreId = idHelper.createStoreId(
			GROUP_STORE_PREFIX,
			params.groupId,
		);

		if (!localStorage.getItem(groupStoreId)) {
			throw redirect({
				to: '/groups',
				replace: true,
			});
		}

		return {
			...context,
			groupStore: setupGroupStore(groupStoreId),
		};
	},
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { groupStore } = Route.useLoaderData();

	const group = groupStore.useStore();
	const groupValues = group.useValues();

	return (
		<div>
			<h1 className="text-3xl font-bold">{groupValues.name}</h1>
		</div>
	);
}
