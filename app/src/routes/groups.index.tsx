import { AddCircleOutline, ArrowForward } from '@mui/icons-material';
import { Fab } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { AuthenticatedLayout } from '../components/authenticated-layout';

export const Route = createFileRoute('/groups/')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user } = Route.useLoaderData();
	const userStore = user.useStore();
	const groupTable = userStore.useTable('groups');
	const groups = useMemo(
		() => Object.values(groupTable).sort((a, z) => z.joinedAt - a.joinedAt),
		[groupTable],
	);

	const navigate = useNavigate();

	return (
		<AuthenticatedLayout userStore={userStore}>
			<div className="relative flex-1 flex flex-col gap-3">
				{groups.length ? (
					groups.map(({ id, name, joinedAt }) => (
						<Link key={id} to="/groups/$groupId" params={{ groupId: id }}>
							<Card>
								<CardContent className="flex flex-row">
									<div className="flex-1">
										<h2 className="text-xl font-bold">{name}</h2>
										<p className="text-xs text-gray-500">
											Joined on{' '}
											{new Date(joinedAt).toLocaleDateString(undefined, {
												dateStyle: 'medium',
											})}
										</p>
									</div>
									<div>
										<ArrowForward />
									</div>
								</CardContent>
							</Card>
						</Link>
					))
				) : (
					<p className="text-center m-auto">
						You have no groups yet. <br /> Add one or join one!
					</p>
				)}

				<div className="fixed bottom-6 inset-x-4 flex flex-row gap-2 justify-center">
					<Fab
						variant="extended"
						color="primary"
						onClick={() => navigate({ to: '/groups/create' })}
					>
						<AddCircleOutline className="mr-2" /> Create
					</Fab>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
