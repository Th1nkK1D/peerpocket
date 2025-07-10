import { Button } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import dayjs, { type Dayjs } from 'dayjs';
import { z } from 'zod/v4';
import { LinkButton } from '../components/links';
import { categories } from '../constants/expense';
import { useMuiForm } from '../hooks/form';
import { useStepper } from '../hooks/stepper';

export const Route = createFileRoute('/groups/$groupId/expenses/add')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { group } = Route.useLoaderData();
	const members = group.useStore().useTableRows('members');

	const { activeStep, setActiveStep, StepperView, StepNavigations } =
		useStepper(['Expense details', 'Splits']);

	const detailsForm = useMuiForm({
		validators: {
			onSubmit: z.object({
				amount: z.string().nonempty(),
				category: z.string().nonempty(),
				notes: z.string(),
				paidOn: z.instanceof(dayjs as unknown as typeof Dayjs, {
					error: 'Invalid date',
				}),
				splits: z.array(
					z.object({
						name: z.string(),
						hashedId: z.string(),
						amount: z.number(),
					}),
				),
			}),
		},
		defaultValues: {
			notes: '',
			amount: '0',
			category: 'Other',
			paidOn: dayjs(),
			splits: members.map(({ name, hashedId }) => ({
				name,
				hashedId,
				amount: 0,
			})),
		},
		onSubmit() {
			setActiveStep(activeStep + 1);
		},
	});

	const splitsForm = useMuiForm({
		validators: {
			onSubmit: z.object({
				splits: z.array(
					z.object({
						name: z.string(),
						hashedId: z.string(),
						amount: z.number(),
					}),
				),
			}),
		},
		defaultValues: {
			splits: members.map(({ name, hashedId }) => ({
				name,
				hashedId,
				amount: 0,
			})),
		},
		async onSubmit() {},
	});

	return (
		<StepperView className="p-3">
			{activeStep === 0 ? (
				<form
					className="flex flex-1 flex-col gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						detailsForm.handleSubmit();
					}}
				>
					<detailsForm.AppField name="amount">
						{(field) => <field.CurrencyField label="Amount" />}
					</detailsForm.AppField>
					<detailsForm.AppField name="category">
						{(field) => (
							<field.SelectField
								options={categories.map(({ name, emoji }) => ({
									label: `${emoji} ${name}`,
									value: name,
								}))}
								label="Category"
							/>
						)}
					</detailsForm.AppField>
					<detailsForm.AppField name="notes">
						{(field) => <field.TextField label="Notes" />}
					</detailsForm.AppField>
					<detailsForm.AppField name="paidOn">
						{(field) => <field.DateField label="Paid on" />}
					</detailsForm.AppField>
					<StepNavigations>
						<LinkButton from={Route.fullPath} to="..">
							Cancel
						</LinkButton>
						<detailsForm.AppForm>
							<detailsForm.SubmitButton>Next</detailsForm.SubmitButton>
						</detailsForm.AppForm>
					</StepNavigations>
				</form>
			) : (
				<form
					className="flex flex-1 flex-col gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						detailsForm.handleSubmit();
					}}
				>
					<splitsForm.AppField name="splits" mode="array">
						{(field) => {
							return (
								<table>
									<thead>
										<tr className="text-left">
											<th>Name</th>
											<th className="pl-4">Amount</th>
										</tr>
									</thead>
									<tbody>
										{field.state.value.map(({ hashedId, name }, i) => {
											return (
												<tr key={hashedId}>
													<td>{name}</td>
													<td className="pl-4">
														<splitsForm.AppField name={`splits[${i}].amount`}>
															{(subField) => <subField.CurrencyField />}
														</splitsForm.AppField>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							);
						}}
					</splitsForm.AppField>
					<StepNavigations>
						<Button onClick={() => setActiveStep(activeStep - 1)}>Back</Button>
						<splitsForm.AppForm>
							<splitsForm.SubmitButton>Add</splitsForm.SubmitButton>
						</splitsForm.AppForm>
					</StepNavigations>
				</form>
			)}
		</StepperView>
	);
}
