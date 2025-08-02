import { scaleLinear } from 'd3-scale';
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
	const x = scaleLinear([0, max], [0, 100]);

	return (
		<div className="flex flex-1 flex-col gap-2">
			{data.map(({ category, myTotal, groupTotal }) => (
				<div className="flex flex-col gap-1" key={category}>
					<div className="flex flex-row">
						<p className="flex-1">
							{categoryNameEmojiMap.get(category)} {category}
						</p>
						<p>
							<span className="text-secondary">{formatDecimal(myTotal)}</span>{' '}
							<span className="text-gray-500">
								/ {formatDecimal(groupTotal)}
							</span>
						</p>
					</div>
					<div className="flex h-3 flex-row gap-[1px]">
						<div
							className="rounded-sm bg-secondary"
							style={{ width: `${x(myTotal)}%` }}
						></div>
						<div
							className="rounded-sm bg-gray-500"
							style={{ width: `${x(groupTotal - myTotal)}%` }}
						></div>
					</div>
				</div>
			))}
		</div>
	);
}
