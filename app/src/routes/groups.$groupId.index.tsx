import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/groups/$groupId/')({
	beforeLoad({ params }) {
		return redirect({
			to: '/groups/$groupId/transactions',
			params,
			replace: true,
		});
	},
});
