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
			className={`sticky bottom-0 z-10 flex flex-row justify-end gap-2 p-4 ${className}`}
		>
			{children}
		</div>
	);
}
