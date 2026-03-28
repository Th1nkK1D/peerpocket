import type { PropsWithChildren, ReactNode } from 'react';
import {
	SwipeableList as BaseSwipeableList,
	SwipeAction,
	Type,
} from 'react-swipeable-list';

export { SwipeableListItem, TrailingActions } from 'react-swipeable-list';

interface SwipeListProps extends PropsWithChildren {
	className?: string;
}

export interface SwipeActionButtonProps {
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

export function SwipeActionButton({
	label,
	icon,
	onClick,
	className,
}: SwipeActionButtonProps) {
	return (
		<SwipeAction onClick={onClick}>
			<div
				className={`flex h-full min-w-20 flex-col items-center justify-center gap-1 px-4 text-sm ${className}`}
			>
				{icon}
				<span className="text-xs">{label}</span>
			</div>
		</SwipeAction>
	);
}

export function SwipeableList({ children, className }: SwipeListProps) {
	return (
		<BaseSwipeableList type={Type.IOS} className={className}>
			{children}
		</BaseSwipeableList>
	);
}

export function SwipeHint({ icon, children, className = '' }: SwipeHintProps) {
	return (
		<p
			className={`flex flex-col items-center justify-center gap-2 text-gray-600 text-xs italic ${className}`}
		>
			{icon}
			{children}
		</p>
	);
}
