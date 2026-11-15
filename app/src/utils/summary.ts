import { groups } from 'd3-array';
import dayjs from 'dayjs';

import { compareCurrency } from './currency';

export type GroupBy = 'category' | 'date';

export type Transaction = {
	currency: string;
	category: string;
	paidOn: number;
	paidByMemberId: string;
	memberId: string;
	amount: number;
};

type Balance = { key: string; name: string; amount: number };

export type MemberBalance = {
	key: string;
	name: string;
	amounts: { currency: string; amount: number }[];
};

export const groupKeys: Record<GroupBy, (transaction: Transaction) => string> =
	{
		category: (transaction) => transaction.category,
		date: (transaction) => dayjs(transaction.paidOn).format('YYYY-MM-DD'),
	};

/** Splits transactions per currency, with `firstCurrency` leading and no-currency last. */
export function summarizeByCurrency(
	transactions: Transaction[],
	{
		firstCurrency,
		groupBy,
		memberId,
		members,
	}: {
		firstCurrency: string | null;
		groupBy: GroupBy;
		memberId: string | undefined;
		members: { id: string; name: string }[];
	},
) {
	return groups(transactions, (transaction) => transaction.currency)
		.sort(([a], [z]) =>
			a === firstCurrency
				? -1
				: z === firstCurrency
					? 1
					: compareCurrency(a, z),
		)
		.map(([currency, currencyTransactions]) => ({
			currency,
			chartData: buildChartData(currencyTransactions, groupBy, memberId),
			balances: buildBalances(currencyTransactions, members, memberId),
		}));
}

export type CurrencySummary = ReturnType<typeof summarizeByCurrency>[number];

export function mergeMemberBalances(
	summaries: CurrencySummary[],
	direction: 'toPayThem' | 'toPayMe',
) {
	const rows = new Map<string, MemberBalance>();
	for (const { currency, balances } of summaries) {
		for (const { key, name, amount } of balances[direction]) {
			const row = rows.get(key) ?? { key, name, amounts: [] };
			row.amounts.push({ currency, amount });
			rows.set(key, row);
		}
	}
	return [...rows.values()];
}

function sumAmounts(transactions: Transaction[]) {
	return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
}

function buildChartData(
	transactions: Transaction[],
	groupBy: GroupBy,
	memberId: string | undefined,
) {
	return groups(transactions, groupKeys[groupBy])
		.map(([key, keyTransactions]) => ({
			category: key,
			myTotal: sumAmounts(
				keyTransactions.filter(
					(transaction) => transaction.memberId === memberId,
				),
			),
			groupTotal: sumAmounts(keyTransactions),
		}))
		.sort((a, z) =>
			groupBy === 'category'
				? z.myTotal - a.myTotal
				: z.category.localeCompare(a.category),
		);
}

function buildBalances(
	transactions: Transaction[],
	members: { id: string; name: string }[],
	memberId: string | undefined,
) {
	const balances = { toPayThem: [] as Balance[], toPayMe: [] as Balance[] };

	for (const { id, name } of members) {
		if (id === memberId) continue;

		const iPaidThem = sumAmounts(
			transactions.filter(
				(transaction) =>
					transaction.paidByMemberId === memberId &&
					transaction.memberId === id,
			),
		);
		const theyPaidMe = sumAmounts(
			transactions.filter(
				(transaction) =>
					transaction.paidByMemberId === id &&
					transaction.memberId === memberId,
			),
		);

		if (iPaidThem > theyPaidMe) {
			balances.toPayMe.push({ key: id, name, amount: iPaidThem - theyPaidMe });
		} else if (iPaidThem < theyPaidMe) {
			balances.toPayThem.push({
				key: id,
				name,
				amount: theyPaidMe - iPaidThem,
			});
		}
	}

	return balances;
}
