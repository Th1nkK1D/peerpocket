import { Download } from '@mui/icons-material';
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from '@mui/material';
import {
	downloadJson,
	type ExportData,
	generateFilename,
} from '../utils/export';

interface SaveIdentityDialogProps {
	open: boolean;
	userData: { id: string; hashedId: string; name: string } | null;
	onSave: () => void;
	onSkip: () => void;
}

export function SaveIdentityDialog({
	open,
	userData,
	onSave,
	onSkip,
}: SaveIdentityDialogProps) {
	function handleDownload() {
		if (!userData) return;

		const data: ExportData = {
			exportedAt: new Date().toISOString(),
			user: userData,
		};

		const fileName = generateFilename(userData.name, 'identity');
		downloadJson(data, fileName);
		onSave();
	}

	return (
		<Dialog open={open} onClose={onSkip} fullWidth maxWidth="sm">
			<DialogTitle>Save Your Identity</DialogTitle>
			<DialogContent>
				<DialogContentText component="div">
					<div className="flex flex-col gap-4">
						<div>
							We recommend saving your identity data for account recovery. If
							you lose access to this device, you can use this file to restore
							your identity and rejoin your groups.
						</div>
						<Alert severity="info">
							This file contains only your identity. You will need an invitation
							to rejoin groups and sync the data back from your peers.
						</Alert>
					</div>
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={onSkip}>Skip</Button>
				<Button
					onClick={handleDownload}
					variant="contained"
					startIcon={<Download />}
				>
					Save Identity
				</Button>
			</DialogActions>
		</Dialog>
	);
}
