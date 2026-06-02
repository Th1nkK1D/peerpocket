import Typography from '@mui/material/Typography';
import { categoryNameEmojiMap } from '../constants/expense';
import { formatDecimal } from '../hooks/form';

interface StackHorizontalBarChartProps {
	data: {
		category: string;
		myTotal: number;
		groupTotal: number;
	}[];
}

export function StackHorizontalBarChart({
	data,
}: StackHorizontalBarChartProps) {
	const max = Math.max(...data.map((item) => item.groupTotal));

	return (
		<div className="flex flex-1 flex-col gap-3">
			{data.map(({ category, myTotal, groupTotal }) => (
				<div className="flex flex-col gap-1" key={category}>
					<div className="flex flex-row">
						<Typography className="flex-1">
							{categoryNameEmojiMap.get(category)} {category}
						</Typography>
						<Typography>
							<span className="text-secondary">{formatDecimal(myTotal)}</span>{' '}
							<Typography component="span" color="textSecondary">
								/ {formatDecimal(groupTotal)}
							</Typography>
						</Typography>
					</div>
					<div
						className="flex h-3 flex-row gap-[1px] rounded-sm bg-[var(--mui-palette-divider)]"
						style={{ width: `${(groupTotal * 100) / max}%` }}
					>
						<div
							className="rounded-sm bg-secondary"
							style={{ width: `${(myTotal * 100) / groupTotal}%` }}
						></div>
					</div>
				</div>
			))}
		</div>
	);
}
