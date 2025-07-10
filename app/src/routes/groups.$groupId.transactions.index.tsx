import { Add } from '@mui/icons-material';
import { createFileRoute } from '@tanstack/react-router';
import { FabsContainer } from '../components/fabs-container';
import { LinkFab } from '../components/links';

export const Route = createFileRoute('/groups/$groupId/transactions/')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-1 flex-col">
			<p className="m-auto p-3 text-center">
				Look like no one has taking a note just yet.
			</p>
			<FabsContainer>
				<LinkFab
					color="primary"
					aria-label="Add new transactions"
					from={Route.fullPath}
					to="add"
				>
					<Add />
				</LinkFab>
			</FabsContainer>
		</div>
	);
}
