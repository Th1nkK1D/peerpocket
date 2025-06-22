import Button from '@mui/material/Button';
import { createFileRoute } from '@tanstack/react-router';
import { useUserStore } from '../stores/user';

export const Route = createFileRoute('/')({
	component: HomeComponent,
});

function HomeComponent() {
	const user = useUserStore();
	const table = user.useTable('groups');

	return (
		<div className="p-2">
			<h3 className="typography-h3">Welcome Home!</h3>

			<ol>
				{Object.entries(table).map(([key, { name }]) => (
					<li key={key}>{name}</li>
				))}
			</ol>

			<Button
				type="submit"
				variant="contained"
				onClick={() =>
					user.store.setRow('groups', crypto.randomUUID(), {
						name: Math.random().toString(36).substring(2, 10),
					})
				}
			>
				Add New Group
			</Button>
		</div>
	);
}
