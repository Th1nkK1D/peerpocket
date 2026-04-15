import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/groups/$groupId/')({
	beforeLoad({ params }) {
		return redirect({
			to: '/groups/$groupId/expenses',
			params,
			replace: true,
		});
	},
});
