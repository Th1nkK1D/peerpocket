import {
	AccountBoxOutlined,
	DarkMode,
	Download,
	InstallMobileOutlined,
	LightMode,
	Logout,
	ManageAccounts,
} from '@mui/icons-material';
import {
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
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { useNavigate } from '@tanstack/react-router';
import { useId, useState } from 'react';

import { useInstallPrompt } from '../../hooks/install-prompt';
import type { UserStore } from '../../stores/user';

interface Props {
	userStore: UserStore;
}

export function AccountMenu({ userStore }: Props) {
	const user = userStore.useValues();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const { mode, setMode } = useColorScheme();
	const { canPrompt, install } = useInstallPrompt();

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
		<>
			<IconButton
				aria-label="Menu"
				aria-controls="menu-appbar"
				aria-haspopup="true"
				onClick={(e) => setAnchorEl(e.currentTarget)}
				color="inherit"
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
				<MenuItem disabled>
					<ListItemIcon>
						<AccountBoxOutlined fontSize="small" />
					</ListItemIcon>
					<ListItemText>{user.name}</ListItemText>
				</MenuItem>
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
				{canPrompt && (
					<MenuItem
						onClick={() => {
							closeMenu();
							install();
						}}
					>
						<ListItemIcon>
							<InstallMobileOutlined fontSize="small" />
						</ListItemIcon>
						<ListItemText>Install app</ListItemText>
					</MenuItem>
				)}
				<MenuItem onClick={openLogoutDialog}>
					<ListItemIcon>
						<Logout fontSize="small" />
					</ListItemIcon>
					<ListItemText>Log out</ListItemText>
				</MenuItem>
			</Menu>

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
					<Button onClick={() => setLogoutDialogOpen(false)} color="inherit">
						Cancel
					</Button>
					<Button onClick={confirmLogout} color="error">
						Log out
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
