import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import * as z from 'zod';
import { useMuiForm } from '../hooks/form';
import { setupUserStore } from '../stores/user';
import { activeUserStoreId } from '../utils/active-user';

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
});

function RouteComponent() {
	const formSchema = z.object({
		name: z.string().nonempty(),
	});

	const navigate = useNavigate();

	const form = useMuiForm({
		defaultValues: {
			name: '',
		},
		validators: {
			onChange: formSchema,
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			const userStoreId = activeUserStoreId.assign();

			const { store, persistence } = setupUserStore(userStoreId).getStore();

			store.setValue('name', value.name);
			await persistence.save();

			navigate({ to: '/groups', replace: true });
		},
	});

	return (
		<div className="flex flex-col p-2 gap-4 justify-center items-center min-h-dvh h-full">
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
