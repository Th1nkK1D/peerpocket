import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button, Snackbar } from '@mui/material';

export default function ReloadPrompt() {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW();

	return (
		<>
			<Snackbar
				open={offlineReady}
				message="App ready to work offline"
				autoHideDuration={2500}
				onClose={() => setOfflineReady(false)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			/>
			<Snackbar
				open={needRefresh}
				message="New app version available"
				onClose={() => setNeedRefresh(false)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				action={
					<>
						<Button
							color="secondary"
							size="small"
							onClick={() => updateServiceWorker(true)}
						>
							Update
						</Button>
						<Button
							color="inherit"
							size="small"
							onClick={() => setNeedRefresh(false)}
						>
							Ignore
						</Button>
					</>
				}
			/>
		</>
	);
}
