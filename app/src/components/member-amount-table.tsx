import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';
import type { ComponentProps } from 'react';
import { formatDecimal } from '../hooks/form';

interface MemberAmountTableProps {
	currency: string;
	currentUserKey?: string;
	items: {
		key: string;
		name?: string;
		amount: number;
	}[];
}

export function MemberAmountTable({
	currency,
	currentUserKey,
	items,
}: MemberAmountTableProps) {
	return (
		<Table>
			<TableHead>
				<TableRow>
					<TableCellDensed>Member</TableCellDensed>
					<TableCellDensed align="right">{currency}</TableCellDensed>
				</TableRow>
			</TableHead>
			<TableBody>
				{[...items]
					.sort((a, z) => z.amount - a.amount)
					.map((item) => {
						const isCurrentUser = currentUserKey === item.key;
						return (
							<TableRow key={item.key}>
								<TableCellDensed
									className={isCurrentUser ? 'text-secondary' : undefined}
								>
									{item.name}
								</TableCellDensed>
								<TableCellDensed
									align="right"
									className={isCurrentUser ? 'text-secondary' : undefined}
								>
									{formatDecimal(item.amount)}
								</TableCellDensed>
							</TableRow>
						);
					})}
				<TableRow className="italic [&>td]:border-0">
					<TableCellDensed>Total</TableCellDensed>
					<TableCellDensed align="right">
						{formatDecimal(items.reduce((acc, row) => acc + row.amount, 0))}
					</TableCellDensed>
				</TableRow>
			</TableBody>
		</Table>
	);
}

function TableCellDensed({
	className = '',
	...props
}: ComponentProps<typeof TableCell>) {
	return (
		<TableCell className={`px-0 py-3 text-[1rem] ${className}`} {...props} />
	);
}
