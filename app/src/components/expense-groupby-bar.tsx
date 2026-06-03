import { Category, DateRange, Sort } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { ActionMenu } from './action-menu';

interface ExpenseGroupByBarProps {
	count: number;
	label: string;
	groupBy: 'category' | 'date';
	onGroupByChange: (groupBy: 'category' | 'date') => void;
	className?: string;
}

export function ExpenseGroupByBar({
	count,
	label,
	groupBy,
	onGroupByChange,
	className,
}: ExpenseGroupByBarProps) {
	return (
		<div className={`flex items-center justify-between ${className ?? ''}`}>
			<Typography variant="overline" color="textSecondary">
				{count} {label}
			</Typography>
			<ActionMenu
				items={[
					{
						label: 'By date',
						icon: <DateRange fontSize="small" />,
						selected: groupBy === 'date',
						onClick: () => onGroupByChange('date'),
					},
					{
						label: 'By category',
						icon: <Category fontSize="small" />,
						selected: groupBy === 'category',
						onClick: () => onGroupByChange('category'),
					},
				]}
				ariaLabel="Group expenses by"
				triggerIcon={<Sort fontSize="small" />}
			/>
		</div>
	);
}
