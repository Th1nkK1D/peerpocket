import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { z } from 'zod/v4';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { GroupSharing } from '../components/group-sharing';
import { LinkButton } from '../components/links';
import { useMuiForm } from '../hooks/form';
import { useStepper } from '../hooks/stepper';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../stores/group';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/groups/create')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user } = Route.useLoaderData();

	const { activeStep, setActiveStep, StepperView, StepNavigations } =
		useStepper(['Create', 'Share']);

	const id = useMemo(idHelper.generate, []);

	const form = useMuiForm({
		defaultValues: {
			name: '',
		},
		validators: {
			onSubmit: z.object({
				name: z.string().nonempty(),
			}),
		},
		async onSubmit({ value: { name } }) {
			if (activeStep !== 0) return;

			const group = await setupGroupStore(
				idHelper.createStoreId(GROUP_STORE_PREFIX, id),
			);

			const hashedId = user.getValue('hashedId') as string;
			const joinedAt = Date.now();

			user.setRow('groups', id, {
				name,
				joinedAt,
			});

			group.setRow('members', hashedId, {
				name: user.getValue('name'),
				joinedAt,
			});

			setActiveStep(activeStep + 1);
		},
	});

	return (
		<AuthenticatedLayout title="New Group" userStore={user}>
			<StepperView>
				{activeStep === 0 ? (
					<form
						className="flex flex-col gap-4"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.AppField name="name">
							{(field) => <field.TextField label="Group name" />}
						</form.AppField>
						<StepNavigations>
							<form.AppForm>
								<form.SubmitButton className="flex-1">
									Create Group
								</form.SubmitButton>
							</form.AppForm>
						</StepNavigations>
					</form>
				) : (
					<>
						<p>
							<strong>Your group has been created!</strong> Share this link with
							your friend to start tracking expenses together (You can also add
							them later!)
						</p>
						<GroupSharing id={id} name={form.state.values.name} />
						<StepNavigations>
							<LinkButton to="/groups" replace>
								Return home
							</LinkButton>
							<LinkButton
								variant="contained"
								to="/groups/$groupId"
								params={{ groupId: id }}
								replace
							>
								Go to the group
							</LinkButton>
						</StepNavigations>
					</>
				)}
			</StepperView>
		</AuthenticatedLayout>
	);
}
