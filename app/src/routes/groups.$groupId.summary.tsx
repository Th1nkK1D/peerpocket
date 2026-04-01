import { Card, Chip, Divider, MenuItem, TextField } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { groups } from 'd3-array';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { MemberAmountTable } from '../components/member-amount-table';
import { StackHorizontalBarChart } from '../components/stack-horizontal-bar-chart';
import { formatDecimal } from '../hooks/form';

export const Route = createFileRoute('/groups/$groupId/summary')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user, group } = Route.useLoaderData();
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

	const splitsWithExpenseInfo = useMemo(
		() =>
			expenses.flatMap((exp) =>
				splits
					.filter((split) => split.expenseId === exp.id)
					.map((split) => ({
						category: exp.category,
						paidByMemberId: exp.paidByMemberId,
						memberId: split.memberId,
						amount: split.amount,
					})),
			),
		[expenses, splits],
	);

	const expenseByCategories = useMemo<
		ComponentProps<typeof StackHorizontalBarChart>['data']
	>(
		() =>
			groups(splitsWithExpenseInfo, (tx) => tx.category)
				.map(([category, txs]) => ({
					category,
					myTotal: txs
						.filter((tx) => tx.memberId === selectedMemberId)
						.reduce((acc, tx) => acc + tx.amount, 0),
					groupTotal: txs.reduce((acc, tx) => acc + tx.amount, 0),
				}))
				.sort((a, z) => z.myTotal - a.myTotal),
		[splitsWithExpenseInfo, selectedMemberId],
	);

	type OutstandBalance = ComponentProps<typeof MemberAmountTable>['items'];

	// biome-ignore lint/correctness/useExhaustiveDependencies: false positive
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
						value={expenseByCategories.reduce((acc, tx) => acc + tx.myTotal, 0)}
					/>
					<TotalExpenseCard
						className="opacity-70"
						label="Group expense"
						value={expenseByCategories.reduce(
							(acc, tx) => acc + tx.groupTotal,
							0,
						)}
					/>
				</div>
				<StackHorizontalBarChart data={expenseByCategories} />
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
				<p className="text-center text-gray-500 text-sm italic">No one</p>
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
				<p className="text-center text-gray-500 text-sm italic">No one</p>
			)}
		</div>
	);
}

function TotalExpenseCard(props: {
	label: string;
	value: number;
	className?: string;
}) {
	return (
		<Card className={`p-2 ${props.className ?? ''}`}>
			<span className="text-sm">{props.label}</span>
			<p className="text-2xl">{formatDecimal(props.value)}</p>
		</Card>
	);
}
