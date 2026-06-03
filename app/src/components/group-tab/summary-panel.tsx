import {
	Card,
	Chip,
	Divider,
	MenuItem,
	TextField,
	Typography,
} from '@mui/material';
import { groups } from 'd3-array';
import dayjs from 'dayjs';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { categoryNameEmojiMap } from '../../constants/expense';
import { formatDecimal } from '../../hooks/form';
import { ExpenseGroupByBar } from '../expense-groupby-bar';
import { MemberAmountTable } from '../member-amount-table';
import { StackHorizontalBarChart } from '../stack-horizontal-bar-chart';
import type { PanelProps } from './types';

export function SummaryPanel({ user, group }: PanelProps) {
	const currentUser = user.useValues();

	const expenses = group.useTableRows('expenses');
	const splits = group.useTableRows('splits');
	const members = group.useTableRows('members');
	const [selectedMemberId, setSelectedMemberId] = useState(
		currentUser.hashedId,
	);

	useEffect(() => {
		if (members.some((member) => member.id === selectedMemberId)) return;

		setSelectedMemberId(
			members.find((member) => member.id === currentUser.hashedId)?.id ??
				members[0]?.id ??
				currentUser.hashedId,
		);
	}, [currentUser.hashedId, members, selectedMemberId]);

	const selectedMember = members.find(
		(member) => member.id === selectedMemberId,
	);
	const selectedMemberName =
		selectedMemberId === currentUser.hashedId
			? 'you'
			: (selectedMember?.name ?? 'selected member');

	const [groupBy, setGroupBy] = useState<'category' | 'date'>('category');

	const splitsWithExpenseInfo = useMemo(
		() =>
			expenses.flatMap((exp) =>
				splits
					.filter((split) => split.expenseId === exp.id)
					.map((split) => ({
						category: exp.category,
						paidOn: exp.paidOn,
						paidByMemberId: exp.paidByMemberId,
						memberId: split.memberId,
						amount: split.amount,
					})),
			),
		[expenses, splits],
	);

	const chartData = useMemo<
		ComponentProps<typeof StackHorizontalBarChart>['data']
	>(
		() =>
			groups(
				splitsWithExpenseInfo,
				groupBy === 'category' ? (tx) => tx.category : (tx) => `${tx.paidOn}`,
			)
				.map(([key, txs]) => ({
					category: key,
					myTotal: txs
						.filter((tx) => tx.memberId === selectedMemberId)
						.reduce((acc, tx) => acc + tx.amount, 0),
					groupTotal: txs.reduce((acc, tx) => acc + tx.amount, 0),
				}))
				.sort((a, z) =>
					groupBy === 'category'
						? a.category.localeCompare(z.category)
						: z.category.localeCompare(a.category),
				),
		[splitsWithExpenseInfo, selectedMemberId, groupBy],
	);

	type OutstandBalance = ComponentProps<typeof MemberAmountTable>['items'];

	const outstandingBalanceWithOtherMembers = useMemo(
		() =>
			members
				.filter((member) => member.id !== selectedMemberId)
				.reduce(
					(group, { id, name }) => {
						const iPaidThem = splitsWithExpenseInfo
							.filter(
								(exp) =>
									exp.paidByMemberId === selectedMemberId &&
									exp.memberId === id,
							)
							.reduce((sum, { amount }) => sum + amount, 0);

						const theyPaidMe = splitsWithExpenseInfo
							.filter(
								(exp) =>
									exp.paidByMemberId === id &&
									exp.memberId === selectedMemberId,
							)
							.reduce((sum, { amount }) => sum + amount, 0);

						if (iPaidThem > theyPaidMe) {
							group.toPayMe.push({
								key: id,
								name,
								amount: iPaidThem - theyPaidMe,
							});
						} else if (iPaidThem < theyPaidMe) {
							group.toPayThem.push({
								key: id,
								name,
								amount: theyPaidMe - iPaidThem,
							});
						}

						return group;
					},
					{ toPayThem: [] as OutstandBalance, toPayMe: [] as OutstandBalance },
				),
		[splitsWithExpenseInfo, members, selectedMemberId],
	);

	return (
		<div className="flex flex-col gap-3 p-3">
			<TextField
				select
				label="Member"
				value={selectedMemberId}
				onChange={(event) => setSelectedMemberId(event.target.value)}
				fullWidth
				size="small"
				className="mt-1"
			>
				<MenuItem key={currentUser.hashedId} value={currentUser.hashedId}>
					{currentUser.name}
				</MenuItem>
				{members
					.filter((member) => member.id !== currentUser.hashedId)
					.map((member) => (
						<MenuItem key={member.id} value={member.id}>
							{member.name}
						</MenuItem>
					))}
			</TextField>

			<div className="flex flex-col gap-3">
				<div className="grid grid-cols-2 gap-2">
					<TotalExpenseCard
						className="text-secondary"
						label={
							selectedMemberId === currentUser.hashedId
								? 'My expense'
								: `${selectedMemberName}'s expense`
						}
						value={chartData.reduce((acc, tx) => acc + tx.myTotal, 0)}
					/>
					<TotalExpenseCard
						className="opacity-70"
						label="Group expense"
						value={chartData.reduce((acc, tx) => acc + tx.groupTotal, 0)}
					/>
				</div>
				<div className="flex flex-col">
					<ExpenseGroupByBar
						count={chartData.length}
						label={groupBy === 'category' ? 'categories' : 'dates'}
						groupBy={groupBy}
						onGroupByChange={setGroupBy}
					/>
					<StackHorizontalBarChart
						data={chartData}
						formatLabel={
							groupBy === 'date'
								? (date) => dayjs(+date).format('ddd, D MMM YY')
								: (category) =>
										`${categoryNameEmojiMap.get(category)} ${category}`
						}
					/>
				</div>
			</div>

			<Divider>
				<Chip
					label={
						selectedMemberId === currentUser.hashedId
							? 'Who I need to pay to'
							: `Who ${selectedMemberName} needs to pay to`
					}
				></Chip>
			</Divider>

			{outstandingBalanceWithOtherMembers.toPayThem.length ? (
				<MemberAmountTable
					currency="Amount"
					items={outstandingBalanceWithOtherMembers.toPayThem}
				/>
			) : (
				<Typography
					variant="body2"
					color="textSecondary"
					className="text-center italic"
				>
					No one
				</Typography>
			)}

			<Divider>
				<Chip
					label={
						selectedMemberId === currentUser.hashedId
							? 'Who needs to pay me'
							: `Who needs to pay ${selectedMemberName}`
					}
				></Chip>
			</Divider>

			{outstandingBalanceWithOtherMembers.toPayMe.length ? (
				<MemberAmountTable
					currency="Amount"
					items={outstandingBalanceWithOtherMembers.toPayMe}
				/>
			) : (
				<Typography
					variant="body2"
					color="textSecondary"
					className="text-center italic"
				>
					No one
				</Typography>
			)}
		</div>
	);
}

function TotalExpenseCard({
	label,
	value,
	className = '',
}: {
	label: string;
	value: number;
	className?: string;
}) {
	return (
		<Card className="p-2" variant="outlined">
			<Typography variant="body2" className={className}>
				{label}
			</Typography>
			<Typography className={`text-2xl ${className}`}>
				{formatDecimal(value)}
			</Typography>
		</Card>
	);
}
