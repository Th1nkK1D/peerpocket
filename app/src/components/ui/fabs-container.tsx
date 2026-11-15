import type { PropsWithChildren } from 'react';

interface FabsContainerProps {
	position?: 'sticky' | 'fixed';
	className?: string;
}

export function FabsContainer({
	children,
	position = 'sticky',
	className = '',
}: PropsWithChildren<FabsContainerProps>) {
	return (
		<div
			className={`pointer-events-none z-10 flex flex-row [&>:not(.MuiSpeedDial-root)]:pointer-events-auto ${position === 'sticky' ? 'sticky bottom-0 h-20 items-end justify-end p-6 pt-0' : 'fixed right-6 bottom-6'} ${className}`}
		>
			{children}
		</div>
	);
}
