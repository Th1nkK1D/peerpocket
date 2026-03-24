import type { PropsWithChildren, ReactNode } from 'react';
import {
	SwipeableList as BaseSwipeableList,
	LeadingActions,
	SwipeAction,
	TrailingActions,
	Type,
} from 'react-swipeable-list';

export { SwipeableListItem } from 'react-swipeable-list';

interface SwipeListProps extends PropsWithChildren {
	className?: string;
}

interface SwipeActionButtonProps {
	label: string;
	icon: ReactNode;
	onClick: () => void;
	className: string;
}

interface SwipeHintProps {
	icon: ReactNode;
	children: ReactNode;
	className?: string;
}

function SwipeActionButton({
	label,
	icon,
	onClick,
	className,
}: SwipeActionButtonProps) {
	return (
		<SwipeAction onClick={onClick}>
			<div
				className={`flex h-full min-w-24 items-center justify-center gap-2 px-4 font-medium text-sm ${className}`}
			>
				<span className="text-sm">{label}</span>
				{icon}
			</div>
		</SwipeAction>
	);
}

export function SwipeableList({ children, className }: SwipeListProps) {
	return (
		<BaseSwipeableList type={Type.ANDROID} className={className}>
			{children}
		</BaseSwipeableList>
	);
}

export function SwipeLeadingAction(props: SwipeActionButtonProps) {
	return (
		<LeadingActions>
			<SwipeActionButton {...props} />
		</LeadingActions>
	);
}

export function SwipeTrailingAction(props: SwipeActionButtonProps) {
	return (
		<TrailingActions>
			<SwipeActionButton {...props} />
		</TrailingActions>
	);
}

export function SwipeHint({ icon, children, className = '' }: SwipeHintProps) {
	return (
		<p
			className={`flex flex-row items-center justify-center gap-2 text-gray-600 text-xs italic ${className}`}
		>
			{icon}
			{children}
		</p>
	);
}
