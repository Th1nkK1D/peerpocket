import { ContentCopyOutlined } from '@mui/icons-material';
import {
	Button,
	IconButton,
	InputAdornment,
	Snackbar,
	Step,
	StepLabel,
	Stepper,
	TextField,
} from '@mui/material';
import { useStore } from '@tanstack/react-form';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { z } from 'zod/v4';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { useMuiForm } from '../hooks/form';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../stores/group';
import { idHelper } from '../utils/id';

const steps = ['Create', 'Share'];

export const Route = createFileRoute('/groups/create')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user } = Route.useLoaderData();
	const userStore = user.useStore();

	const [activeStep, setActiveStep] = useState(0);
	const [isCopied, setIsCopied] = useState(false);

	const id = useMemo(idHelper.generate, []);

	const formSchema = z.object({
		name: z.string().nonempty(),
	});

	const form = useMuiForm({
		defaultValues: {
			name: '',
		},
		validators: {
			onChange: formSchema,
			onSubmit: formSchema,
		},
		async onSubmit({ value: { name } }) {
			if (activeStep !== 0) return;

			const groupStore = (
				await setupGroupStore(idHelper.createStoreId(GROUP_STORE_PREFIX, id))
			).getStore();

			const hashedId = userStore.store.getValue('hashedId');
			const joinedAt = Date.now();

			userStore.store.setRow('groups', id, {
				id,
				name,
				joinedAt,
			});

			groupStore.store.setValues({ id, name });
			groupStore.store.setRow('members', hashedId, {
				hashedId,
				name: userStore.store.getValue('name'),
				joinedAt,
			});

			setActiveStep(activeStep + 1);
		},
	});

	const sharedLink = useStore(
		form.store,
		(state) =>
			`${window.location.origin}/groups/join?${new URLSearchParams({
				id,
				name: state.values.name,
			}).toString()}`,
	);

	function copyLinkToClipboard() {
		navigator.clipboard.writeText(sharedLink);
		setIsCopied(true);
	}

	return (
		<AuthenticatedLayout title="New Group" userStore={userStore}>
			<div className="flex flex-col gap-4">
				<Stepper activeStep={activeStep}>
					{steps.map((label) => {
						const stepProps: { completed?: boolean } = {};
						const labelProps: {
							optional?: React.ReactNode;
						} = {};
						return (
							<Step key={label} {...stepProps}>
								<StepLabel {...labelProps}>{label}</StepLabel>
							</Step>
						);
					})}
				</Stepper>
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
						<form.AppForm>
							<form.SubmitButton>Create Group</form.SubmitButton>
						</form.AppForm>
					</form>
				) : (
					<>
						<p>
							<strong>Your group has been created!</strong> Share this link with
							your friend to start tracking expenses together.
						</p>
						<TextField
							value={sharedLink}
							multiline
							aria-readonly
							slotProps={{
								input: {
									endAdornment: (
										<InputAdornment position="end">
											<IconButton
												aria-label="Copy link"
												onClick={copyLinkToClipboard}
												edge="end"
											>
												<ContentCopyOutlined />
											</IconButton>
										</InputAdornment>
									),
								},
							}}
						/>
						<Snackbar
							open={isCopied}
							autoHideDuration={4000}
							onClose={() => setIsCopied(false)}
							message="Link copied"
						/>
						<div className="flex flex-row justify-between">
							<Link to="/groups" replace>
								<Button>Return home</Button>
							</Link>
							<Link to="/groups/$groupId" params={{ groupId: id }} replace>
								<Button variant="contained">Go to the group</Button>
							</Link>
						</div>
					</>
				)}
			</div>
		</AuthenticatedLayout>
	);
}
