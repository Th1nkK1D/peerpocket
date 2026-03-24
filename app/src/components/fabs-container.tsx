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
			className={`sticky bottom-0 z-10 flex h-fit flex-row justify-end p-6 pt-0 ${className}`}
		>
			{children}
		</div>
	);
}
