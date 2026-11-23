import { Chip, Divider, MenuItem, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { categoryNameEmojiMap } from '../../../constants/expense';
import { useCurrencyConversion } from '../../../hooks/currency-conversion';
import {
	currencyName,
	currencySymbol,
	formatAmount,
} from '../../../utils/currency';
import { formatRelativeDay } from '../../../utils/format';
import {
	type CurrencySummary,
	type GroupBy,
	groupKeys,
	mergeMemberBalances,
	summarizeByCurrency,
	type Transaction,
} from '../../../utils/summary';
import { CurrencySelect } from '../currency-select';
import { ExpenseGroupByBar } from '../expense-groupby-bar';
import { MemberAmountTable } from '../member-amount-table';
import { StackHorizontalBarChart } from '../stack-horizontal-bar-chart';
import { TotalExpenseCard } from '../total-expense-card';
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
	const isCurrentUser = selectedMemberId === currentUser.hashedId;
	const selectedMemberName = isCurrentUser
		? 'you'
		: (selectedMember?.name ?? 'selected member');

	const [groupBy, setGroupBy] = useState<GroupBy>('category');
	const conversion = useCurrencyConversion(expenses);
	const { convert, target } = conversion;

	const transactions = useMemo<Transaction[]>(
		() =>
			expenses.flatMap((expense) =>
				splits
					.filter((split) => split.expenseId === expense.id)
					.map((split) => ({
						...convert(expense.currency, split.amount),
						category: expense.category,
						paidOn: expense.paidOn,
						paidByMemberId: expense.paidByMemberId,
						memberId: split.memberId,
					})),
			),
		[expenses, splits, convert],
	);

	const summaries = useMemo(
		() =>
			summarizeByCurrency(transactions, {
				firstCurrency: target,
				groupBy,
				memberId: selectedMemberId,
				members,
			}),
		[transactions, target, groupBy, selectedMemberId, members],
	);

	function totals(field: 'myTotal' | 'groupTotal') {
		return summaries.map(({ currency, chartData }) => ({
			currency,
			amount: chartData.reduce((sum, row) => sum + row[field], 0),
		}));
	}

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

			<CurrencySelect conversion={conversion} />

			<div className="flex flex-col gap-3">
				<div className="grid grid-cols-2 gap-2">
					<TotalExpenseCard
						className="text-secondary"
						label={
							isCurrentUser ? 'My expense' : `${selectedMemberName}'s expense`
						}
						totals={totals('myTotal')}
					/>
					<TotalExpenseCard
						className="opacity-70"
						label="Group expense"
						totals={totals('groupTotal')}
					/>
				</div>
				<div className="flex flex-col">
					<ExpenseGroupByBar
						count={new Set(transactions.map(groupKeys[groupBy])).size}
						label={
							groupBy === 'category'
								? ['category', 'categories']
								: ['date', 'dates']
						}
						groupBy={groupBy}
						onGroupByChange={setGroupBy}
					/>
					<div className="flex flex-col gap-3">
						{summaries.map((summary) => (
							<CurrencyChart
								key={summary.currency}
								summary={summary}
								groupBy={groupBy}
								label={
									summaries.length > 1
										? currencyLabel(summary.currency, target)
										: null
								}
							/>
						))}
					</div>
				</div>
			</div>

			<SectionDivider
				label={
					isCurrentUser
						? 'Who I need to pay'
						: `Who ${selectedMemberName} needs to pay`
				}
			/>
			<BalanceTable items={mergeMemberBalances(summaries, 'toPayThem')} />

			<SectionDivider
				label={
					isCurrentUser
						? 'Who needs to pay me'
						: `Who needs to pay ${selectedMemberName}`
				}
			/>
			<BalanceTable items={mergeMemberBalances(summaries, 'toPayMe')} />
		</div>
	);
}

function currencyLabel(currency: string, target: string | null) {
	const symbol = currencySymbol(currency);
	return `${symbol && symbol !== currency ? `${symbol} ` : ''}${currencyName(currency)}${
		target && currency !== target ? ' · not converted' : ''
	}`;
}

function CurrencyChart({
	summary,
	groupBy,
	label,
}: {
	summary: CurrencySummary;
	groupBy: GroupBy;
	label: string | null;
}) {
	return (
		<div className="flex flex-col">
			{label ? (
				<Typography variant="overline" color="textSecondary">
					{label}
				</Typography>
			) : null}
			<StackHorizontalBarChart
				data={summary.chartData}
				formatValue={(value) => formatAmount(value, summary.currency)}
				formatLabel={
					groupBy === 'date'
						? (date) => formatRelativeDay(date, { weekday: true })
						: (category) => `${categoryNameEmojiMap.get(category)} ${category}`
				}
			/>
		</div>
	);
}

function BalanceTable({
	items,
}: {
	items: ReturnType<typeof mergeMemberBalances>;
}) {
	if (!items.length) {
		return (
			<Typography
				variant="body2"
				color="textSecondary"
				className="text-center italic"
			>
				No one
			</Typography>
		);
	}

	return <MemberAmountTable items={items} />;
}

function SectionDivider({ label }: { label: string }) {
	return (
		<Divider>
			<Chip
				label={<span className="font-grandstander font-light">{label}</span>}
			/>
		</Divider>
	);
}
