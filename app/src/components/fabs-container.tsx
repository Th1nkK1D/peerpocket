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
			className={`z-10 flex flex-row ${position === 'sticky' ? 'sticky bottom-0 justify-end p-6 pt-0' : 'fixed right-6 bottom-6'} ${className}`}
		>
			{children}
		</div>
	);
}
