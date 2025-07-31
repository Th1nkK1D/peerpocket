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
	const membersHashedIdNameMap = group.useTableRows(
		'members',
		(members) => new Map(members.map((m) => [m.hashedId, m.name])),
	);

	const [openedDialog, setOpenedDialog] = useState<{
		expense: (typeof expenseByDays)[number][1][number];
		yourSplit?: (typeof splits)[number];
		otherSplits: typeof splits;
	} | null>(null);

	return (
		<>
			{expenseByDays.length === 0 ? (
				<p className="m-auto p-3 text-center">
					Look like no one has taking a note just yet.
				</p>
			) : (
				expenseByDays.map(([day, expenses]) => (
					<List key={day} subheader={<ListSubheader>{day}</ListSubheader>}>
						{expenses.map((expense) => {
							const relatedSplits = splits.filter(
								(split) => split.expenseId === expense.id,
							);
							const yourSplit = relatedSplits.find(
								(split) => split.userHashedId === currentUser.hashedId,
							);
							const otherSplits = relatedSplits.filter(
								(split) => split.userHashedId !== currentUser.hashedId,
							);

							return (
								<ListItem key={expense.id} disablePadding>
									<ListItemButton
										onClick={() =>
											setOpenedDialog({ expense, yourSplit, otherSplits })
										}
									>
										<ListItemAvatar>
											<Avatar>
												{categoryNameEmojiMap.get(expense.category)}
											</Avatar>
										</ListItemAvatar>
										<div className="flex-1 flex flex-col">
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
												<p className="flex-1 text-sm text-gray-500">
													{expense.paidByUserHashedId === currentUser.hashedId
														? `${otherSplits.length} people owe you`
														: yourSplit
															? `You owe ${membersHashedIdNameMap.get(expense.paidByUserHashedId)}`
															: ''}
												</p>
												<p className="text-sm text-gray-500">
													Total {formatDecimal(expense.amount)}
												</p>
											</div>
										</div>
									</ListItemButton>
								</ListItem>
							);
						})}
					</List>
				))
			)}
			<Dialog
				open={openedDialog !== null}
				onClose={() => setOpenedDialog(null)}
				scroll="paper"
				fullWidth
			>
				{openedDialog ? (
					<>
						<DialogTitle>
							{categoryNameEmojiMap.get(openedDialog.expense.category)}{' '}
							{openedDialog.expense.notes || openedDialog.expense.category}
						</DialogTitle>
						<DialogContent dividers>
							<DialogContentText className="text-sm mb-1">
								Paid by{' '}
								{membersHashedIdNameMap.get(
									openedDialog.expense.paidByUserHashedId,
								)}{' '}
								on {dayjs(openedDialog.expense.paidOn).format('ddd, D MMM YY')}
							</DialogContentText>
							<Table aria-label="splits">
								<TableHead>
									<TableRow>
										<TableCell>Splits</TableCell>
										<TableCell align="right">
											{openedDialog.expense.currency}
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{openedDialog.yourSplit ? (
										<TableRow>
											<TableCell className="text-primary">
												{currentUser.name} (You)
											</TableCell>
											<TableCell align="right" className="text-primary">
												{formatDecimal(openedDialog.yourSplit.amount)}
											</TableCell>
										</TableRow>
									) : null}
									{openedDialog.otherSplits.map((split) => (
										<TableRow key={split.userHashedId}>
											<TableCell>
												{membersHashedIdNameMap.get(split.userHashedId)}
											</TableCell>
											<TableCell align="right">
												{formatDecimal(split.amount)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
								<TableRow className="italic [&>td]:border-0">
									<TableCell>Total</TableCell>
									<TableCell align="right">
										{formatDecimal(openedDialog.expense.amount)}
									</TableCell>
								</TableRow>
							</Table>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setOpenedDialog(null)}>Close</Button>
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
