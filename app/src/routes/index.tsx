import { createFileRoute } from '@tanstack/react-router';
import { userStore, userUiReact } from '../stores/user';

export const Route = createFileRoute('/')({
	component: HomeComponent,
});

function HomeComponent() {
	// @ts-expect-error
	const table = userUiReact.useTable('groups', userStore);

	return (
		<div className="p-2">
			<h3>Welcome Home!</h3>

			<ol>
				{Object.entries(table).map(([key, { name }]) => (
					<li key={key}>{name}</li>
				))}
			</ol>

			<button
				type="submit"
				onClick={() =>
					userStore.setRow('groups', crypto.randomUUID(), {
						name: Math.random().toString(36).substring(2, 10),
					})
				}
			>
				Add New Group
			</button>
		</div>
	);
}
