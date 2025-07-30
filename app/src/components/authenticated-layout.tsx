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
import { useNavigate } from '@tanstack/react-router';
import { type PropsWithChildren, useState } from 'react';
import type { UserStore } from '../stores/user';

interface Props {
	userStore: UserStore;
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

	const navigate = useNavigate();

	function closeMenu() {
		setAnchorEl(null);
	}

	function logout() {
		closeMenu();
		localStorage.clear();
		navigate({ to: '/', replace: true });
	}

	return (
		<div className="flex min-h-dvh flex-col">
			<AppBar position="static">
				<Toolbar className="flex items-center justify-between">
					{title ? (
						<IconButton
							className="-ml-3"
							onClick={() => navigate({ to: '..' })}
						>
							<ChevronLeft />
						</IconButton>
					) : null}

					<h1 className="font-bold text-xl">{title ?? '🐶 PeerPocket'}</h1>

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

			<div className={`flex flex-1 flex-col p-4 ${className}`}>{children}</div>
		</div>
	);
}
