import { ArrowForward, GroupAdd } from '@mui/icons-material';
import { Fab } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { FabsContainer } from '../components/fabs-container';

export const Route = createFileRoute('/groups/')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user } = Route.useLoaderData();
	const userStore = user.useStore();
	const groups = userStore.useTableRows('groups', (groups) =>
		groups.sort((a, z) => z.joinedAt - a.joinedAt),
	);

	const navigate = useNavigate();

	return (
		<AuthenticatedLayout userStore={userStore}>
			<div className="relative flex flex-1 flex-col gap-3">
				{groups.length ? (
					groups.map(({ id, name, joinedAt }) => (
						<Link key={id} to="/groups/$groupId" params={{ groupId: id }}>
							<Card>
								<CardContent className="flex flex-row">
									<div className="flex-1">
										<h2 className="font-bold text-xl">{name}</h2>
										<p className="text-gray-500 text-sm">
											Joined on {new Date(joinedAt).toLocaleDateString()}
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
					<p className="m-auto text-center">
						You have no groups yet. <br /> Add one or join one!
					</p>
				)}

				<FabsContainer>
					<Fab
						color="primary"
						onClick={() => navigate({ to: '/groups/create' })}
					>
						<GroupAdd />
					</Fab>
				</FabsContainer>
			</div>
		</AuthenticatedLayout>
	);
}
