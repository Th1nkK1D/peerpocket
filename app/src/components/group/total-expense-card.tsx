import { Card, Typography } from '@mui/material';

import { formatAmount } from '../../utils/currency';

interface TotalExpenseCardProps {
	label: string;
	totals: { currency: string; amount: number }[];
	className?: string;
}

export function TotalExpenseCard({
	label,
	totals,
	className = '',
}: TotalExpenseCardProps) {
	const lines = totals.filter(({ amount }) => amount);

	return (
		<Card className="p-2" variant="outlined">
			<Typography variant="body2" className={`font-grandstander ${className}`}>
				{label}
			</Typography>
			{(lines.length ? lines : [{ currency: '', amount: 0 }]).map(
				({ currency, amount }) => (
					<Typography
						key={currency}
						className={`text-right ${lines.length > 1 ? 'text-lg' : 'text-2xl'} ${className}`}
					>
						{formatAmount(amount, currency)}
					</Typography>
				),
			)}
		</Card>
	);
}
