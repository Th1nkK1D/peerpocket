import {
	ArrowForward,
	GroupAdd,
	QrCodeScannerOutlined,
} from '@mui/icons-material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { FabsContainer } from '../components/fabs-container';

export const Route = createFileRoute('/groups/')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user } = Route.useLoaderData();
	const navigate = useNavigate();

	const groups = user.useTableRows('groups', (groups) =>
		groups.sort((a, z) => z.joinedAt - a.joinedAt),
	);

	return (
		<AuthenticatedLayout userStore={user}>
			<div className="m-3 mb-0 flex flex-1 flex-col gap-3">
				{groups.length ? (
					groups.map(({ id, name, joinedAt }) => (
						<Link key={id} to="/groups/$groupId" params={{ groupId: id }}>
							<Card>
								<CardContent className="flex flex-row">
									<div className="flex-1">
										<h2 className="font-bold text-xl">{name}</h2>
										<p className="text-gray-500 text-sm">
											Joined {dayjs(joinedAt).format('DD MMM YY')}
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
				<SpeedDial
					ariaLabel="Group actions"
					icon={<SpeedDialIcon />}
					direction="up"
				>
					<SpeedDialAction
						icon={<GroupAdd />}
						tooltipTitle="Create"
						tooltipOpen
						onClick={() => navigate({ to: '/groups/create' })}
						slotProps={{ fab: { color: 'primary' } }}
					/>
					<SpeedDialAction
						icon={<QrCodeScannerOutlined />}
						tooltipTitle="Join"
						tooltipOpen
						onClick={() => navigate({ to: '/groups/scan' })}
						slotProps={{ fab: { color: 'secondary' } }}
					/>
				</SpeedDial>
			</FabsContainer>
		</AuthenticatedLayout>
	);
}
