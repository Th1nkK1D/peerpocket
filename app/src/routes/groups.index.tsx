import { ArrowForward, GroupAdd } from '@mui/icons-material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { createFileRoute, Link } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { FabsContainer } from '../components/fabs-container';
import { LinkFab } from '../components/links';

export const Route = createFileRoute('/groups/')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user } = Route.useLoaderData();

	const groups = user.useTableRows('groups', (groups) =>
		groups.sort((a, z) => z.joinedAt - a.joinedAt),
	);

	return (
		<AuthenticatedLayout userStore={user} className="p-3 pb-0">
			<div className="flex flex-1 flex-col gap-3">
				{groups.length ? (
					groups.map(({ id, name, joinedAt }) => (
						<Link key={id} to="/groups/$groupId" params={{ groupId: id }}>
							<Card>
								<CardContent className="flex flex-row">
									<div className="flex-1">
										<h2 className="font-bold text-xl">{name}</h2>
										<p className="text-gray-500 text-sm">
											Joined on {dayjs(joinedAt).format('DD MMMM YYYY')}
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
			</div>
			<FabsContainer>
				<LinkFab color="primary" to="/groups/create">
					<GroupAdd />
				</LinkFab>
			</FabsContainer>
		</AuthenticatedLayout>
	);
}
