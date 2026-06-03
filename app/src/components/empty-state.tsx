import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type EmptyStateProps = {
	children: ReactNode;
	icon?: ReactNode;
};

export function EmptyState({ children, icon }: EmptyStateProps) {
	return (
		<div className="m-auto flex max-w-56 flex-col items-center gap-3 text-center opacity-80">
			{icon}
			<Typography variant="body2">{children}</Typography>
		</div>
	);
}
