import type { PropsWithChildren } from 'react';

export function FabsContainer({ children }: PropsWithChildren) {
	return (
		<div className="fixed bottom-6 inset-x-4 flex flex-row gap-2 justify-center">
			{children}
		</div>
	);
}
