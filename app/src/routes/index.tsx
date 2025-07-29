import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import * as z from 'zod';
import { useMuiForm } from '../hooks/form';
import { setupUserStore, USER_STORE_PREFIX } from '../stores/user';
import { activeUserStoreId } from '../utils/active-user';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/')({
	component: RouteComponent,
	beforeLoad() {
		if (activeUserStoreId.get()) {
			throw redirect({
				to: '/groups',
				replace: true,
			});
		}
	},
	validateSearch: zodValidator(
		z.object({
			path: z.string().optional(),
			params: z.record(z.any()).optional(),
		}),
	),
});

function RouteComponent() {
	const { path, params } = Route.useSearch();
	const navigate = useNavigate();

	const form = useMuiForm({
		defaultValues: {
			name: '',
		},
		validators: {
			onSubmit: z.object({
				name: z.string().nonempty(),
			}),
		},
		onSubmit: async ({ value }) => {
			const id = idHelper.generate();
			const userStoreId = idHelper.createStoreId(USER_STORE_PREFIX, id);

			const user = await setupUserStore(userStoreId);

			user.setValues({
				id,
				hashedId: await idHelper.hash(id),
				name: value.name,
			});

			activeUserStoreId.set(userStoreId);

			navigate({ to: path || '/groups', search: params, replace: true });
		},
	});

	return (
		<div className="flex h-full min-h-dvh flex-col items-center justify-center gap-4 p-2">
			<h3>PeerPocket</h3>
			<p>Your Peer-to-peer expense tracker</p>
			<form
				className="flex flex-col gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<form.AppField name="name">
					{(field) => <field.TextField label="Enter your name" />}
				</form.AppField>
				<form.AppForm>
					<form.SubmitButton>Get started</form.SubmitButton>
				</form.AppForm>
			</form>
		</div>
	);
}
