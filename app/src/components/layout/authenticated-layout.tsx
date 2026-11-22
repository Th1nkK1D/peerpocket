import { ChevronLeft } from '@mui/icons-material';
import { AppBar, IconButton, Toolbar } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import type { PropsWithChildren, ReactNode } from 'react';

interface Props {
	title: string;
	hideBackButton?: boolean;
	actions?: ReactNode;
	className?: string;
}

export function AuthenticatedLayout({
	title,
	children,
	hideBackButton = false,
	actions,
	className = '',
}: PropsWithChildren<Props>) {
	const navigate = useNavigate();

	return (
		<div className="flex h-dvh flex-col">
			<AppBar position="static" className="z-20">
				<Toolbar
					disableGutters
					className={`grid items-center ${hideBackButton ? 'grid-cols-[1fr_auto] pr-1 pl-4' : 'grid-cols-[1fr_auto_1fr] px-1'}`}
				>
					{!hideBackButton && (
						<IconButton
							color="inherit"
							className="justify-self-start"
							onClick={() => navigate({ to: '..' })}
						>
							<ChevronLeft />
						</IconButton>
					)}

					<div className="flex min-w-0 items-center gap-2">
						{hideBackButton && (
							<img src="/favicon.svg" alt="" className="size-8" />
						)}
						<h1
							className={`-mb-1 truncate font-grandstander font-medium ${hideBackButton ? 'text-2xl' : 'text-xl'}`}
						>
							{title}
						</h1>
					</div>

					<div className="flex justify-end">{actions}</div>
				</Toolbar>
			</AppBar>

			<div className={`flex flex-1 flex-col overflow-y-scroll ${className}`}>
				{children}
			</div>
		</div>
	);
}
