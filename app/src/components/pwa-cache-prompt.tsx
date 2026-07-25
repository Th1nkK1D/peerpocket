import { useRegisterSW } from 'virtual:pwa-register/react';
import { Close } from '@mui/icons-material';
import { Button, IconButton, Snackbar } from '@mui/material';

export default function ReloadPrompt() {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(_swUrl, registration) {
			if (registration) {
				setInterval(
					() => {
						registration.update();
					},
					60 * 60 * 1000,
				);
			}
		},
	});

	return (
		<>
			<Snackbar
				open={offlineReady}
				message="App is ready to work offline"
				autoHideDuration={2500}
				onClose={() => setOfflineReady(false)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				action={
					<IconButton
						aria-label="Close"
						size="small"
						color="inherit"
						onClick={() => setOfflineReady(false)}
					>
						<Close />
					</IconButton>
				}
			/>
			<Snackbar
				open={needRefresh}
				message="New app version is available, reload to update."
				onClose={() => setNeedRefresh(false)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				action={
					<>
						<Button
							color="inherit"
							size="small"
							onClick={() => setNeedRefresh(false)}
						>
							Later
						</Button>
						<Button
							color="primary"
							size="small"
							onClick={() => updateServiceWorker(true)}
						>
							Reload
						</Button>
					</>
				}
			/>
		</>
	);
}
