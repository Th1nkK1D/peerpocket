import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';
import type { ComponentProps } from 'react';

import { formatAmount } from '../../utils/currency';

type Amount = { currency: string; amount: number };

interface MemberAmountTableProps {
	currentUserKey?: string;
	items: {
		key: string;
		name?: string;
		amounts: Amount[];
	}[];
}

export function MemberAmountTable({
	currentUserKey,
	items,
}: MemberAmountTableProps) {
	const sortedItems = [...items].sort(
		(a, z) => (z.amounts[0]?.amount ?? 0) - (a.amounts[0]?.amount ?? 0),
	);
	const totals = new Map<string, number>();
	for (const { amounts } of sortedItems) {
		for (const { currency, amount } of amounts) {
			totals.set(currency, (totals.get(currency) ?? 0) + amount);
		}
	}

	return (
		<Table>
			<TableHead>
				<TableRow>
					<TableCellDensed>Member</TableCellDensed>
					<TableCellDensed align="right">Amount</TableCellDensed>
				</TableRow>
			</TableHead>
			<TableBody>
				{sortedItems.map((item) => {
					const className =
						currentUserKey === item.key ? 'text-secondary' : undefined;
					return (
						<TableRow key={item.key}>
							<TableCellDensed className={className}>
								{item.name}
							</TableCellDensed>
							<TableCellDensed align="right" className={className}>
								<AmountLines amounts={item.amounts} />
							</TableCellDensed>
						</TableRow>
					);
				})}
				<TableRow className="italic [&>td]:border-0">
					<TableCellDensed className="text-secondary">Total</TableCellDensed>
					<TableCellDensed align="right" className="text-secondary">
						<AmountLines
							amounts={[...totals].map(([currency, amount]) => ({
								currency,
								amount,
							}))}
						/>
					</TableCellDensed>
				</TableRow>
			</TableBody>
		</Table>
	);
}

function AmountLines({ amounts }: { amounts: Amount[] }) {
	return amounts.map(({ currency, amount }) => (
		<div key={currency}>{formatAmount(amount, currency)}</div>
	));
}

function TableCellDensed({
	className = '',
	...props
}: ComponentProps<typeof TableCell>) {
	return (
		<TableCell
			className={`px-0 py-3 align-top text-[1rem] ${className}`}
			{...props}
		/>
	);
}
