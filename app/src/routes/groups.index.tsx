import { AddCircleOutline } from '@mui/icons-material';
import { Fab } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/groups/')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="relative flex-1 flex flex-col items-center justify-center">
			<p className="text-center">
				You have no groups yet. <br /> Add one or join one!
			</p>

			<div className="fixed bottom-6 inset-x-4 flex flex-row gap-2 justify-center">
				<Fab variant="extended" color="primary">
					<AddCircleOutline className="mr-2" /> Create
				</Fab>
			</div>
		</div>
	);
}
