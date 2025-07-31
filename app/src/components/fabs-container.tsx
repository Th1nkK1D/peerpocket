import type { PropsWithChildren } from 'react';

interface FabsContainerProps {
	className?: string;
}

export function FabsContainer({
	children,
	className = '',
}: PropsWithChildren<FabsContainerProps>) {
	return (
		<div
			className={`sticky bottom-0 z-10 flex flex-row justify-center gap-2 pt-4 pb-6 ${className}`}
		>
			{children}
		</div>
	);
}
