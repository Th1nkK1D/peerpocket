import { Button } from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import dayjs, { type Dayjs } from 'dayjs';
import { z } from 'zod/v4';
import { LinkButton } from '../components/links';
import { categories } from '../constants/expense';
import { BaseCurrencyField, formatDecimal, useMuiForm } from '../hooks/form';
import { useStepper } from '../hooks/stepper';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/groups/$groupId/expenses/add')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user, group } = Route.useLoaderData();
	const currentUser = user.useValues();
	const members = group.useTableRows('members');

	const navigate = useNavigate();

	const { activeStep, setActiveStep, StepperView, StepNavigations } =
		useStepper(['Expense details', 'Splits']);

	const detailsForm = useMuiForm({
		validators: {
			onSubmit: z.object({
				id: z.string(),
				amount: z.number(),
				category: z.string().nonempty(),
				notes: z.string(),
				paidByUserHashedId: z.string(),
				paidOn: z.instanceof(dayjs as unknown as typeof Dayjs, {
					error: 'Invalid date',
				}),
			}),
		},
		defaultValues: {
			id: idHelper.generate(),
			notes: '',
			amount: 0,
			category: 'Other',
			paidByUserHashedId: currentUser.hashedId,
			paidOn: dayjs(),
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
						userHashedId: z.string(),
						amount: z.number(),
						isSelected: z.boolean(),
					}),
				),
			}),
		},
		defaultValues: {
			splits: members.map(({ name, hashedId }) => ({
				name,
				userHashedId: hashedId,
				amount: 0,
				isSelected: true,
			})),
		},
		async onSubmit({ value }) {
			group.addRow('expenses', {
				...detailsForm.state.values,
				paidOn: detailsForm.state.values.paidOn.unix() * 1000,
				createdAt: Date.now(),
			});

			value.splits
				.filter((s) => s.amount > 0)
				.forEach(({ userHashedId, amount }) => {
					group.addRow('splits', {
						expenseId: detailsForm.state.values.id,
						userHashedId,
						amount,
					});
				});

			navigate({ from: Route.fullPath, to: '..', replace: true });
		},
	});

	function sumSplitsAmount(splits: { amount: number }[]) {
		return splits.reduce((sum, s) => sum + s.amount, 0);
	}

	function splitSelectionsEqually() {
		const selectedFields = splitsForm.state.values.splits.filter(
			(s) => s.isSelected,
		).length;

		const leftover =
			detailsForm.store.state.values.amount -
			sumSplitsAmount(
				splitsForm.state.values.splits.filter((s) => !s.isSelected),
			);

		const amount = Math.round((leftover / selectedFields) * 100) / 100;

		splitsForm.state.values.splits.forEach((s, i) => {
			if (s.isSelected) {
				splitsForm.replaceFieldValue('splits', i, {
					...s,
					amount:
						i < selectedFields - 1
							? amount
							: leftover - amount * (selectedFields - 1),
				});
			}
		});
	}

	function setAllSplitSelection(isSelected: boolean) {
		splitsForm.state.values.splits.forEach((s, i) => {
			splitsForm.replaceFieldValue('splits', i, {
				...s,
				isSelected,
			});
		});
	}

	function resetSplit() {
		splitsForm.state.values.splits.forEach((s, i) => {
			splitsForm.replaceFieldValue('splits', i, {
				...s,
				amount: 0,
				isSelected: true,
			});
		});
	}

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
					<detailsForm.AppField name="paidByUserHashedId">
						{(field) => (
							<field.SelectField
								options={members.map(({ name, hashedId }) => ({
									label: name,
									value: hashedId,
								}))}
								label="Paid by"
							/>
						)}
					</detailsForm.AppField>
					<detailsForm.AppField name="paidOn">
						{(field) => (
							<field.DateField
								label="Paid on"
								format="ddd, D MMM YY"
								disableFuture
							/>
						)}
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
						splitsForm.handleSubmit();
					}}
				>
					<splitsForm.AppField name="splits" mode="array">
						{(field) => {
							return (
								<table>
									<tbody>
										<tr className="opacity-60">
											<td>Total</td>
											<td className="pl-4">
												<BaseCurrencyField
													fullWidth
													disabled
													variant="standard"
													value={formatDecimal(
														detailsForm.store.state.values.amount,
													)}
												/>
											</td>
										</tr>
										{field.state.value.map(({ userHashedId, name }, i) => {
											return (
												<tr key={userHashedId}>
													<td>
														<splitsForm.AppField
															name={`splits[${i}].isSelected`}
														>
															{(subField) => <subField.Checkbox label={name} />}
														</splitsForm.AppField>
													</td>
													<td className="pl-4">
														<splitsForm.AppField name={`splits[${i}].amount`}>
															{(subField) => (
																<subField.CurrencyField
																	fullWidth
																	variant="standard"
																	margin="dense"
																/>
															)}
														</splitsForm.AppField>
													</td>
												</tr>
											);
										})}
										<splitsForm.Subscribe
											selector={(state) => state.values.splits}
										>
											{(splits) => {
												const splitSum = sumSplitsAmount(splits);
												const isError =
													splitSum !== detailsForm.store.state.values.amount;

												return (
													<tr className="opacity-60">
														<td
															className={
																isError ? 'text-error' : 'text-success'
															}
														>
															Leftover
														</td>
														<td className="pl-4">
															<BaseCurrencyField
																fullWidth
																disabled
																variant="standard"
																margin="dense"
																value={formatDecimal(
																	detailsForm.store.state.values.amount -
																		splitSum,
																)}
																error={isError}
															/>
														</td>
													</tr>
												);
											}}
										</splitsForm.Subscribe>
									</tbody>
								</table>
							);
						}}
					</splitsForm.AppField>
					<splitsForm.Subscribe selector={(state) => state.values.splits}>
						{(splits) => {
							const sumSplit = sumSplitsAmount(splits);
							const willSelectAll =
								splits.filter((s) => s.isSelected).length / splits.length <=
								0.5;

							return (
								<>
									<Button
										variant="outlined"
										disabled={!splits.some((s) => s.isSelected)}
										onClick={splitSelectionsEqually}
									>
										Split selections equally
									</Button>
									<Button onClick={() => setAllSplitSelection(willSelectAll)}>
										Select {willSelectAll ? 'all' : 'none'}
									</Button>
									<Button disabled={!sumSplit} onClick={resetSplit}>
										Reset
									</Button>
									<StepNavigations>
										<Button onClick={() => setActiveStep(activeStep - 1)}>
											Back
										</Button>
										<splitsForm.AppForm>
											<splitsForm.SubmitButton
												disabled={
													sumSplit !== detailsForm.store.state.values.amount
												}
											>
												Add
											</splitsForm.SubmitButton>
										</splitsForm.AppForm>
									</StepNavigations>
								</>
							);
						}}
					</splitsForm.Subscribe>
				</form>
			)}
		</StepperView>
	);
}
