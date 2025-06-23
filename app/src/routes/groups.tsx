import { AccountCircle, Logout } from '@mui/icons-material';
import {
	AppBar,
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Toolbar,
} from '@mui/material';
import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from '@tanstack/react-router';
import { useState } from 'react';
import { setupUserStore } from '../stores/user';
import { activeUserStoreId } from '../utils/active-user';

export const Route = createFileRoute('/groups')({
	component: RouteComponent,
	beforeLoad() {
		const userStoreId = activeUserStoreId.get();

		if (!userStoreId) {
			throw redirect({
				to: '/',
				replace: true,
			});
		}

		return { userStore: setupUserStore(userStoreId) };
	},
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { userStore } = Route.useLoaderData();
	const navigate = useNavigate();

	const user = userStore.useStore().useValues();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	function closeMenu() {
		setAnchorEl(null);
	}

	function logout() {
		closeMenu();
		localStorage.clear();
		navigate({ to: '/', replace: true });
	}

	return (
		<div className="flex flex-col min-h-dvh">
			<AppBar position="static">
				<Toolbar className="flex justify-between items-center">
					<h6>🐶 PeerPocket</h6>
					<IconButton
						size="large"
						aria-label="Menu"
						aria-controls="menu-appbar"
						aria-haspopup="true"
						onClick={(e) => setAnchorEl(e.currentTarget)}
						color="inherit"
						className="-mr-2"
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

			<div className="flex flex-col flex-1 p-4">
				<Outlet />
			</div>
		</div>
	);
}
