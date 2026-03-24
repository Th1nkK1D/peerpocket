import { Close, Create, DeleteOutline, Edit, Swipe } from '@mui/icons-material';
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
import {
	LeadingActions,
	SwipeAction,
	SwipeableList,
	SwipeableListItem,
	TrailingActions,
	Type,
} from 'react-swipeable-list';
import { FabsContainer } from '../components/fabs-container';
import { LinkButton, LinkFab } from '../components/links';
import { MemberAmountTable } from '../components/member-amount-table';
import { categoryNameEmojiMap } from '../constants/expense';
import { formatDecimal } from '../hooks/form';

export const Route = createFileRoute('/groups/$groupId/expenses/')({
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

	function buildTrailingActions(
		expense: ExpenseSelection['expense'],
		relatedSplits: ExpenseSelection['relatedSplits'],
	) {
		return (
			<TrailingActions>
				<SwipeAction
					onClick={() => {
						setExpensePendingDelete({ expense, relatedSplits });
					}}
				>
					<div className="flex h-full min-w-24 items-center justify-center gap-2 bg-error px-4 font-medium text-error-contrast text-sm">
						<span className="text-sm">Delete</span>
						<DeleteOutline />
					</div>
				</SwipeAction>
			</TrailingActions>
		);
	}

	function buildLeadingActions(expenseId: ExpenseSelection['expense']['id']) {
		return (
			<LeadingActions>
				<SwipeAction
					onClick={() =>
						navigate({
							to: '/groups/expense',
							search: { groupId, expenseId },
						})
					}
				>
					<div className="flex h-full min-w-24 items-center justify-center gap-2 bg-warning px-4 font-medium text-sm text-warning-contrast">
						<Edit />
						<span className="text-sm">Edit</span>
					</div>
				</SwipeAction>
			</LeadingActions>
		);
	}

	return (
		<>
			{expenseByDays.length === 0 ? (
				<p className="m-auto p-3 text-center">
					Look like no one has taking a note just yet.
				</p>
			) : (
				<div className="flex-1">
					{expenseByDays.map(([day, expenses]) => (
						<List key={day} subheader={<ListSubheader>{day}</ListSubheader>}>
							<SwipeableList type={Type.ANDROID}>
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
											leadingActions={buildLeadingActions(expense.id)}
											trailingActions={buildTrailingActions(
												expense,
												relatedSplits,
											)}
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
																{expense.paidByMemberId === currentUser.hashedId
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
					<p className="flex flex-row items-center justify-center gap-2 px-3 pt-2 text-gray-500 text-xs italic">
						<Swipe fontSize="small" />
						Swipe right to edit, left to delete the expense
					</p>
				</div>
			)}

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
						This expense will be deleted for everyone in the group. Are you
						sure?
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
