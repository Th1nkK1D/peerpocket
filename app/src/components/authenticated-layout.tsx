import {
	ChevronLeft,
	DarkMode,
	Download,
	LightMode,
	Logout,
	ManageAccounts,
} from '@mui/icons-material';
import {
	AppBar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Link,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Toolbar,
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { useNavigate } from '@tanstack/react-router';
import { type PropsWithChildren, useId, useState } from 'react';
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
	const { mode, setMode } = useColorScheme();

	const navigate = useNavigate();
	const dialogTitleId = useId();

	function closeMenu() {
		setAnchorEl(null);
	}

	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

	function openLogoutDialog() {
		closeMenu();
		setLogoutDialogOpen(true);
	}

	function confirmLogout() {
		setLogoutDialogOpen(false);
		localStorage.clear();
		navigate({ to: '/', replace: true });
	}

	return (
		<div className="flex h-dvh flex-col">
			<AppBar position="static" className="z-20">
				<Toolbar className="flex items-center justify-between">
					{title ? (
						<>
							<IconButton
								className="-ml-3 text-white"
								onClick={() => navigate({ to: '..' })}
							>
								<ChevronLeft />
							</IconButton>
							<h1 className="font-bold text-xl">{title}</h1>
						</>
					) : (
						<div className="flex flex-row items-center gap-3">
							<img src="/favicon-72x72.png" alt="" className="size-6 rounded" />
							<h1 className="font-bold text-xl">PeerPocket</h1>
						</div>
					)}

					<IconButton
						size="large"
						aria-label="Menu"
						aria-controls="menu-appbar"
						aria-haspopup="true"
						onClick={(e) => setAnchorEl(e.currentTarget)}
						color="inherit"
						className="-mx-3"
					>
						<ManageAccounts />
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
						<MenuItem
							onClick={() => {
								setMode(mode === 'light' ? 'dark' : 'light');
								closeMenu();
							}}
						>
							<ListItemIcon>
								{mode === 'light' ? (
									<DarkMode fontSize="small" />
								) : (
									<LightMode fontSize="small" />
								)}
							</ListItemIcon>
							<ListItemText>
								{mode === 'light' ? 'Dark mode' : 'Light mode'}
							</ListItemText>
						</MenuItem>
						<MenuItem
							onClick={() => {
								closeMenu();
								navigate({ to: '/groups/export' });
							}}
						>
							<ListItemIcon>
								<Download fontSize="small" />
							</ListItemIcon>
							<ListItemText>Export data</ListItemText>
						</MenuItem>
						<MenuItem onClick={openLogoutDialog}>
							<ListItemIcon>
								<Logout fontSize="small" />
							</ListItemIcon>
							<ListItemText>Log out</ListItemText>
						</MenuItem>
					</Menu>
				</Toolbar>
			</AppBar>

			<div className={`flex flex-1 flex-col overflow-y-scroll ${className}`}>
				{children}
			</div>

			<Dialog
				open={logoutDialogOpen}
				onClose={() => setLogoutDialogOpen(false)}
				aria-labelledby={dialogTitleId}
			>
				<DialogTitle id={dialogTitleId}>Log out?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Logging out will destroy all data stored in this device. If you will
						recover your data later, consider{' '}
						<Link
							href="/groups/export"
							onClick={() => setLogoutDialogOpen(false)}
						>
							exporting your data
						</Link>{' '}
						first.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
					<Button onClick={confirmLogout} color="error">
						Log out
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
