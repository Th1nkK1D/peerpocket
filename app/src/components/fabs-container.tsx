import type { PropsWithChildren } from 'react';

export function FabsContainer({ children }: PropsWithChildren) {
	return (
		<div className="fixed inset-x-4 bottom-6 z-10 flex flex-row justify-center gap-2">
			{children}
		</div>
	);
}
