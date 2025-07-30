import { Add } from '@mui/icons-material';
import {
	Avatar,
	List,
	ListItem,
	ListItemAvatar,
	ListSubheader,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { groups } from 'd3-array';
import dayjs from 'dayjs';
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
	const members = group.useTableRows('members');

	return (
		<div className="flex flex-1 flex-col">
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
								<ListItem key={expense.id}>
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
											<span>THB {formatDecimal(yourSplit?.amount ?? 0)}</span>
										</div>
										<div className="flex flex-row">
											<p className="flex-1 text-xs text-gray-500">
												{expense.paidByUserHashedId === currentUser.hashedId
													? `${otherSplits.length} people owe you`
													: yourSplit
														? `You owe ${members.find((member) => member.hashedId === expense.paidByUserHashedId)?.name}`
														: ''}
											</p>
											<p className="text-xs text-gray-500">
												Total {formatDecimal(expense.amount)}
											</p>
										</div>
									</div>
								</ListItem>
							);
						})}
					</List>
				))
			)}
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
		</div>
	);
}
