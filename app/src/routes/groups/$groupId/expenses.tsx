import {
	Close,
	Create,
	DeleteOutline,
	Edit,
	SwipeLeft,
} from '@mui/icons-material';
import {
	Avatar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	List,
	ListItem,
	ListItemAvatar,
	ListItemButton,
	ListSubheader,
} from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { groups } from 'd3-array';
import dayjs from 'dayjs';
import { useState } from 'react';
import { FabsContainer } from '../../../components/fabs-container';
import { LinkButton, LinkFab } from '../../../components/links';
import { MemberAmountTable } from '../../../components/member-amount-table';
import {
	SwipeActionButton,
	SwipeableList,
	SwipeableListItem,
	SwipeHint,
	TrailingActions,
} from '../../../components/swipeable-list';
import { categoryNameEmojiMap } from '../../../constants/expense';
import { formatDecimal } from '../../../hooks/form';

export const Route = createFileRoute('/groups/$groupId/expenses')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user, group } = Route.useLoaderData();
	const { groupId } = Route.useParams();
	const navigate = useNavigate();
	const currentUser = user.useValues();

	const expenseByDays = group.useTableRows('expenses', (expenses) =>
		groups(
			expenses.sort((a, z) => z.paidOn - a.paidOn),
			(expense) => dayjs(expense.paidOn).format('ddd, D MMM YY'),
		),
	);
	const splits = group.useTableRows('splits');
	const memberIdNameMap = group.useTableRows(
		'members',
		(members) => new Map(members.map((m) => [m.id, m.name])),
	);

	type ExpenseSelection = {
		expense: (typeof expenseByDays)[number][1][number];
		relatedSplits: typeof splits;
	};

	const [openedExpense, setOpenedExpense] = useState<ExpenseSelection | null>(
		null,
	);
	const [expensePendingDelete, setExpensePendingDelete] =
		useState<ExpenseSelection | null>(null);

	function deleteExpense() {
		if (!expensePendingDelete) return;

		group.delRow('expenses', expensePendingDelete.expense.id);

		expensePendingDelete.relatedSplits.forEach((split) => {
			group.delRow('splits', split.id);
		});

		setExpensePendingDelete(null);
		setOpenedExpense(null);
	}

	return (
		<>
			<div className="flex flex-1 flex-col">
				{expenseByDays.length === 0 ? (
					<p className="m-auto p-3 text-center">
						Look like no one has taking a note just yet.
					</p>
				) : (
					<>
						{expenseByDays.map(([day, expenses]) => (
							<List key={day} subheader={<ListSubheader>{day}</ListSubheader>}>
								<SwipeableList>
									{expenses.map((expense) => {
										const relatedSplits = splits.filter(
											(split) => split.expenseId === expense.id,
										);
										const yourSplit = relatedSplits.find(
											(split) => split.memberId === currentUser.hashedId,
										);
										const otherSplits = relatedSplits.filter(
											(split) => split.memberId !== currentUser.hashedId,
										);

										return (
											<SwipeableListItem
												key={expense.id}
												trailingActions={
													<TrailingActions>
														<SwipeActionButton
															label="Edit"
															icon={<Edit />}
															onClick={() =>
																navigate({
																	to: '/groups/expense',
																	search: { groupId, expenseId: expense.id },
																})
															}
															className="bg-warning text-warning-contrast"
														/>
														<SwipeActionButton
															label="Delete"
															icon={<DeleteOutline />}
															onClick={() =>
																setExpensePendingDelete({
																	expense,
																	relatedSplits,
																})
															}
															className="bg-error text-error-contrast"
														/>
													</TrailingActions>
												}
											>
												<ListItem disablePadding>
													<ListItemButton
														onClick={() => {
															setOpenedExpense({ expense, relatedSplits });
														}}
													>
														<ListItemAvatar>
															<Avatar>
																{categoryNameEmojiMap.get(expense.category)}
															</Avatar>
														</ListItemAvatar>
														<div className="flex flex-1 flex-col">
															<div className="flex flex-row">
																<p className="flex-1">
																	{expense.notes || expense.category}
																</p>
																<span className="text-secondary">
																	{expense.currency}{' '}
																	{formatDecimal(yourSplit?.amount ?? 0)}
																</span>
															</div>
															<div className="flex flex-row">
																<p className="flex-1 text-gray-500 text-sm">
																	{expense.paidByMemberId ===
																	currentUser.hashedId
																		? `${otherSplits.length} people owe you`
																		: yourSplit
																			? `You owe ${memberIdNameMap.get(expense.paidByMemberId)}`
																			: ''}
																</p>
																<p className="text-gray-500 text-sm">
																	Total {formatDecimal(expense.amount)}
																</p>
															</div>
														</div>
													</ListItemButton>
												</ListItem>
											</SwipeableListItem>
										);
									})}
								</SwipeableList>
							</List>
						))}
						<SwipeHint
							icon={<SwipeLeft fontSize="small" />}
							className="px-3 pt-2"
						>
							Swipe left to edit or delete the expense
						</SwipeHint>
					</>
				)}
			</div>

			<Dialog
				open={!!openedExpense}
				onClose={() => setOpenedExpense(null)}
				scroll="paper"
				fullWidth
			>
				{openedExpense ? (
					<>
						<DialogTitle>
							{categoryNameEmojiMap.get(openedExpense.expense.category)}{' '}
							{openedExpense.expense.notes || openedExpense.expense.category}
							<IconButton
								aria-label="Close"
								className="!absolute top-3 right-2"
								onClick={() => setOpenedExpense(null)}
							>
								<Close />
							</IconButton>
						</DialogTitle>
						<DialogContent dividers>
							<DialogContentText className="mb-1 text-sm">
								Paid by{' '}
								{memberIdNameMap.get(openedExpense.expense.paidByMemberId)} on{' '}
								{dayjs(openedExpense.expense.paidOn).format('ddd, D MMM YY')}
							</DialogContentText>
							<MemberAmountTable
								currency={openedExpense.expense.currency}
								currentUserKey={currentUser.hashedId}
								items={openedExpense.relatedSplits.map((exp) => ({
									key: exp.memberId,
									name: memberIdNameMap.get(exp.memberId),
									amount: exp.amount,
								}))}
							/>
						</DialogContent>
						<DialogActions>
							<Button
								color="error"
								onClick={() => setExpensePendingDelete(openedExpense)}
							>
								Delete
							</Button>
							<LinkButton
								variant="outlined"
								to="/groups/expense"
								search={{
									groupId,
									expenseId: openedExpense.expense.id,
								}}
							>
								Edit
							</LinkButton>
						</DialogActions>
					</>
				) : null}
			</Dialog>

			<Dialog
				open={!!expensePendingDelete}
				onClose={() => setExpensePendingDelete(null)}
			>
				<DialogTitle>Deleting expense</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{expensePendingDelete ? (
							<>
								You are about to delete{' '}
								<strong>
									{expensePendingDelete.expense.notes ||
										expensePendingDelete.expense.category}
								</strong>{' '}
								for{' '}
								<strong>
									{formatDecimal(expensePendingDelete.expense.amount)}
								</strong>
								. This expense will be deleted for everyone in the group. Are
								you sure?
							</>
						) : null}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setExpensePendingDelete(null)}>Cancel</Button>
					<Button color="error" onClick={deleteExpense}>
						Yes, delete it
					</Button>
				</DialogActions>
			</Dialog>

			<FabsContainer>
				<LinkFab
					color="primary"
					aria-label="Add new expense"
					to="/groups/expense"
					search={{ groupId }}
				>
					<Create />
				</LinkFab>
			</FabsContainer>
		</>
	);
}
