import { Add } from '@mui/icons-material';
import { Fab } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { FabsContainer } from '../components/fabs-container';

export const Route = createFileRoute('/groups/$groupId/transactions')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex-1 flex flex-col">
			<p className="text-center m-auto p-3">
				Look like no one has taking a note just yet.
			</p>
			<FabsContainer>
				<Fab color="primary" aria-label="Add new transactions">
					<Add />
				</Fab>
			</FabsContainer>
		</div>
	);
}
