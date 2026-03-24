import { Button } from '@mui/material';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import dayjs, { type Dayjs } from 'dayjs';
import { z } from 'zod/v4';
import { AuthenticatedLayout } from '../components/authenticated-layout';
import { LinkButton } from '../components/links';
import { categories } from '../constants/expense';
import {
	BaseCurrencyField,
	formatDecimal,
	roundToTwoDecimal,
	useMuiForm,
} from '../hooks/form';
import { useStepper } from '../hooks/stepper';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../stores/group';
import { idHelper } from '../utils/id';

const SMALLEST_FRACTION = 0.01;

export const Route = createFileRoute('/groups/expense')({
	component: RouteComponent,
	validateSearch: zodValidator(
		z.object({
			groupId: z.string().nonempty(),
			expenseId: z.string().nonempty().optional(),
		}),
	),
	loaderDeps: ({ search: { groupId, expenseId } }) => ({ groupId, expenseId }),
	async loader({ deps, context }) {
		const { groupId, expenseId } = deps;

		if (!context.user.hasRow('groups', groupId)) {
			throw redirect({
				to: '/groups',
				replace: true,
			});
		}

		const group = await setupGroupStore(
			idHelper.createStoreId(GROUP_STORE_PREFIX, groupId),
		);
		const expense = expenseId ? group.getRow('expenses', expenseId) : null;

		if (expenseId && !expense) {
			throw redirect({
				to: '/groups/$groupId/expenses',
				params: { groupId },
				replace: true,
			});
		}

		return {
			...context,
			groupId,
			expenseId,
			expense,
			group,
		};
	},
});

function RouteComponent() {
	const { user, group, groupId, expenseId, expense } = Route.useLoaderData();
	const currentUser = user.useValues();
	const members = group.useTableRows('members');
	const splits = group.useTableRows('splits');
	const groupName = user.getRow('groups', groupId)?.name ?? 'Add Expense';
	const existingSplits = expenseId
		? splits.filter((split) => split.expenseId === expenseId)
		: [];
	const splitAmountByMemberId = new Map(
		existingSplits.map((split) => [split.memberId, split.amount]),
	);

	const navigate = useNavigate();

	const { activeStep, setActiveStep, StepperView, StepNavigations } =
		useStepper(['Expense details', 'Splits']);

	const detailsForm = useMuiForm({
		validators: {
			onSubmit: z.object({
				amount: z.number(),
				category: z.string().nonempty(),
				notes: z.string(),
				paidByMemberId: z.string(),
				paidOn: z.instanceof(dayjs as unknown as typeof Dayjs, {
					error: 'Invalid date',
				}),
			}),
		},
		defaultValues: {
			notes: expense?.notes ?? '',
			amount: expense?.amount ?? 0,
			category: expense?.category ?? 'Other',
			paidByMemberId: expense?.paidByMemberId ?? currentUser.hashedId,
			paidOn: expense ? dayjs(expense.paidOn) : dayjs(),
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
						memberId: z.string(),
						amount: z.number(),
						isSelected: z.boolean(),
					}),
				),
			}),
		},
		defaultValues: {
			splits: members.map(({ id, name }) => ({
				name,
				memberId: id,
				amount: splitAmountByMemberId.get(id) ?? 0,
				isSelected: expenseId ? splitAmountByMemberId.has(id) : true,
			})),
		},
		async onSubmit({ value }) {
			const nextExpenseId = expenseId || group.addRow('expenses', {});

			if (!nextExpenseId) return;

			group.setRow('expenses', nextExpenseId, {
				...detailsForm.state.values,
				paidOn: detailsForm.state.values.paidOn.unix() * 1000,
				createdAt: expense?.createdAt ?? Date.now(),
				updatedAt: expenseId ? Date.now() : undefined,
			});

			if (expenseId) {
				existingSplits.forEach((split) => {
					group.delRow('splits', split.id);
				});
			}

			value.splits
				.filter((s) => s.amount > 0)
				.forEach(({ memberId, amount }) => {
					group.addRow('splits', {
						expenseId: nextExpenseId,
						memberId,
						amount,
					});
				});

			navigate({
				to: '/groups/$groupId/expenses',
				params: { groupId },
				replace: true,
			});
		},
	});

	function sumSplitsAmount(splits: { amount: number }[]) {
		return roundToTwoDecimal(splits.reduce((sum, s) => sum + s.amount, 0));
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

		const amount = roundToTwoDecimal(leftover / selectedFields);
		const unequalFractionShares = Math.round(
			(leftover - amount * selectedFields) / SMALLEST_FRACTION,
		);
		const unequalPeople = Math.abs(unequalFractionShares);
		const unequalSharePerPerson = roundToTwoDecimal(
			amount + (unequalFractionShares / unequalPeople) * SMALLEST_FRACTION,
		);

		splitsForm.state.values.splits.forEach((s, i) => {
			if (s.isSelected) {
				splitsForm.replaceFieldValue('splits', i, {
					...s,
					amount: i < unequalPeople ? unequalSharePerPerson : amount,
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
		<AuthenticatedLayout title={groupName} userStore={user}>
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
							{(field) => <field.CurrencyField label="Total" />}
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
						<detailsForm.AppField name="paidByMemberId">
							{(field) => (
								<field.SelectField
									options={members.map(({ name, id }) => ({
										label: name,
										value: id,
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
							<LinkButton to="/groups/$groupId/expenses" params={{ groupId }}>
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
											{field.state.value.map(({ memberId, name }, i) => {
												return (
													<tr key={memberId}>
														<td>
															<splitsForm.AppField
																name={`splits[${i}].isSelected`}
															>
																{(subField) => (
																	<subField.Checkbox label={name} />
																)}
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
													{expenseId ? 'Update' : 'Add'}
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
		</AuthenticatedLayout>
	);
}
