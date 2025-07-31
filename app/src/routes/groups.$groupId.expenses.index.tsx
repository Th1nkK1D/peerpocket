import { Add } from '@mui/icons-material';
import {
	Avatar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	List,
	ListItem,
	ListItemAvatar,
	ListItemButton,
	ListSubheader,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { groups } from 'd3-array';
import dayjs from 'dayjs';
import { useState } from 'react';
import { FabsContainer } from '../components/fabs-container';
import { LinkFab } from '../components/links';
import { categoryNameEmojiMap } from '../constants/expense';
import { formatDecimal } from '../hooks/form';

export const Route = createFileRoute('/groups/$groupId/expenses/')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user, group } = Route.useLoaderData();
	const currentUser = user.useValues();

	const expenseByDays = group.useTableRows('expenses', (expenses) =>
		groups(
			expenses.sort((a, z) => z.createdAt - a.createdAt),
			(expense) => dayjs(expense.paidOn).format('ddd, D MMM YY'),
		),
	);
	const splits = group.useTableRows('splits');
	const memberIdNameMap = group.useTableRows(
		'members',
		(members) => new Map(members.map((m) => [m.id, m.name])),
	);

	const [selectedExpense, setSelectedExpense] = useState<{
		expense: (typeof expenseByDays)[number][1][number];
		yourSplit?: (typeof splits)[number];
		otherSplits: typeof splits;
	} | null>(null);

	const [isDeleting, setIsDeleting] = useState(false);

	function deleteExpense() {
		if (!selectedExpense) return;

		group.delRow('expenses', selectedExpense.expense.id);

		if (selectedExpense.yourSplit) {
			group.delRow('splits', selectedExpense.yourSplit.id);
		}

		selectedExpense.otherSplits.forEach((split) => {
			group.delRow('splits', split.id);
		});

		setSelectedExpense(null);
		setIsDeleting(false);
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
									<ListItem key={expense.id} disablePadding>
										<ListItemButton
											onClick={() =>
												setSelectedExpense({ expense, yourSplit, otherSplits })
											}
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
													<span>
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
								);
							})}
						</List>
					))}
				</div>
			)}

			<Dialog
				open={!!selectedExpense && !isDeleting}
				onClose={() => setSelectedExpense(null)}
				scroll="paper"
				fullWidth
			>
				{selectedExpense ? (
					<>
						<DialogTitle>
							{categoryNameEmojiMap.get(selectedExpense.expense.category)}{' '}
							{selectedExpense.expense.notes ||
								selectedExpense.expense.category}
						</DialogTitle>
						<DialogContent dividers>
							<DialogContentText className="mb-1 text-sm">
								Paid by{' '}
								{memberIdNameMap.get(selectedExpense.expense.paidByMemberId)} on{' '}
								{dayjs(selectedExpense.expense.paidOn).format('ddd, D MMM YY')}
							</DialogContentText>
							<Table aria-label="splits">
								<TableHead>
									<TableRow>
										<TableCell>Splits</TableCell>
										<TableCell align="right">
											{selectedExpense.expense.currency}
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{selectedExpense.yourSplit ? (
										<TableRow>
											<TableCell className="text-primary">
												{currentUser.name} (You)
											</TableCell>
											<TableCell align="right" className="text-primary">
												{formatDecimal(selectedExpense.yourSplit.amount)}
											</TableCell>
										</TableRow>
									) : null}
									{selectedExpense.otherSplits.map((split) => (
										<TableRow key={split.memberId}>
											<TableCell>
												{memberIdNameMap.get(split.memberId)}
											</TableCell>
											<TableCell align="right">
												{formatDecimal(split.amount)}
											</TableCell>
										</TableRow>
									))}
									<TableRow className="italic [&>td]:border-0">
										<TableCell>Total</TableCell>
										<TableCell align="right">
											{formatDecimal(selectedExpense.expense.amount)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</DialogContent>
						<DialogActions>
							<Button color="error" onClick={() => setIsDeleting(true)}>
								Delete
							</Button>
							<Button
								variant="outlined"
								onClick={() => setSelectedExpense(null)}
							>
								Close
							</Button>
						</DialogActions>
					</>
				) : null}
			</Dialog>

			<Dialog open={isDeleting} onClose={() => setIsDeleting(false)}>
				{selectedExpense ? (
					<>
						<DialogTitle>Deleting expense</DialogTitle>
						<DialogContent>
							<DialogContentText>
								This expense will be removed for everyone in the group. Are you
								sure?
							</DialogContentText>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setIsDeleting(false)}>Cancel</Button>
							<Button color="error" onClick={deleteExpense}>
								Yes, delete it
							</Button>
						</DialogActions>
					</>
				) : null}
			</Dialog>

			<FabsContainer>
				<LinkFab
					color="primary"
					aria-label="Add new expense"
					from={Route.fullPath}
					to="add"
				>
					<Add />
				</LinkFab>
			</FabsContainer>
		</>
	);
}
