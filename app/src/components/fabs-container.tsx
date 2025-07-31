import type { PropsWithChildren } from 'react';

export function FabsContainer({ children }: PropsWithChildren) {
	return (
		<div className="fixed inset-x-4 bottom-6 flex flex-row justify-center gap-2 z-10">
			{children}
		</div>
	);
}
