import { AccountCircle, ChevronLeft, Logout } from '@mui/icons-material';
import {
	AppBar,
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Toolbar,
} from '@mui/material';
import { useRouter } from '@tanstack/react-router';
import { type PropsWithChildren, useState } from 'react';
import type { UserStore } from '../stores/user';

interface Props {
	userStore: ReturnType<UserStore['useStore']>;
	title?: string;
	className?: string;
}

export function AuthenticatedLayout({
	title,
	userStore,
	children,
	className = '',
}: PropsWithChildren<Props>) {
	const user = userStore.useValues();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const router = useRouter();

	function closeMenu() {
		setAnchorEl(null);
	}

	function logout() {
		closeMenu();
		localStorage.clear();
		router.navigate({ to: '/', replace: true });
	}

	return (
		<div className="flex flex-col min-h-dvh">
			<AppBar position="static">
				<Toolbar className="flex justify-between items-center">
					{title ? (
						<IconButton
							className="-ml-3"
							onClick={() =>
								router.history.canGoBack()
									? router.history.back()
									: router.navigate({ to: '/groups' })
							}
						>
							<ChevronLeft />
						</IconButton>
					) : null}

					<h1 className="text-xl font-bold">{title ?? '🐶 PeerPocket'}</h1>

					<IconButton
						size="large"
						aria-label="Menu"
						aria-controls="menu-appbar"
						aria-haspopup="true"
						onClick={(e) => setAnchorEl(e.currentTarget)}
						color="inherit"
						className="-mr-3"
					>
						<AccountCircle />
					</IconButton>

					<Menu
						anchorEl={anchorEl}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'right',
						}}
						keepMounted
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						open={!!anchorEl}
						onClose={closeMenu}
					>
						<MenuItem disabled>Hi, {user.name}</MenuItem>
						<MenuItem onClick={logout}>
							<ListItemIcon>
								<Logout fontSize="small" />
							</ListItemIcon>
							<ListItemText>Destroy data</ListItemText>
						</MenuItem>
					</Menu>
				</Toolbar>
			</AppBar>

			<div className={`flex flex-col flex-1 p-4 ${className}`}>{children}</div>
		</div>
	);
}
