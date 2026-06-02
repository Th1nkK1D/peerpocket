import { CloudUpload } from '@mui/icons-material';
import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Snackbar,
} from '@mui/material';
import { type ChangeEvent, useRef, useState } from 'react';
import {
	type ExportData,
	exportDataSchema,
	isFullExport,
	performImport,
} from '../utils/export';

interface ImportFlowProps {
	onImportSuccess: (userStoreId: string) => void;
}

export function ImportFlow({ onImportSuccess }: ImportFlowProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [importing, setImporting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pendingImport, setPendingImport] = useState<{
		data: ExportData;
		isFull: boolean;
	} | null>(null);

	function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		setImporting(true);
		setError(null);

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const json = JSON.parse(e.target?.result as string);
				const result = exportDataSchema.safeParse(json);

				if (!result.success) {
					console.error('Validation errors:', result.error);
					setError('Import failed: invalid file format');
					setImporting(false);
					return;
				}

				const isFull = isFullExport(result.data);
				setPendingImport({ data: result.data, isFull });
			} catch {
				setError('Import failed: invalid file format');
			} finally {
				setImporting(false);
			}
		};
		reader.onerror = () => {
			setError('Import failed: invalid file format');
			setImporting(false);
		};
		reader.readAsText(file);

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}

	function handleConfirmImport() {
		if (!pendingImport) return;

		try {
			const userStoreId = performImport(
				pendingImport.data,
				pendingImport.isFull,
			);
			setPendingImport(null);
			onImportSuccess(userStoreId);
		} catch {
			setError('Import failed');
			setPendingImport(null);
		}
	}

	return (
		<>
			<Button
				variant="outlined"
				startIcon={importing ? <CircularProgress size={20} /> : <CloudUpload />}
				onClick={() => fileInputRef.current?.click()}
				disabled={importing}
			>
				{importing ? 'Processing...' : 'Import from file'}
			</Button>

			<input
				ref={fileInputRef}
				type="file"
				accept=".json"
				className="hidden"
				onChange={handleFileSelect}
			/>

			<Dialog
				open={!!pendingImport}
				onClose={() => setPendingImport(null)}
				fullWidth
				maxWidth="sm"
			>
				{pendingImport && (
					<>
						<DialogTitle>Import Data</DialogTitle>
						<DialogContent>
							<DialogContentText component="div">
								<div className="flex flex-col gap-2">
									<div>
										<strong>Mode:</strong>{' '}
										{pendingImport.isFull ? 'Full Export' : 'Identity'}
									</div>
									<div>
										<strong>User Name:</strong> {pendingImport.data.user.name}
									</div>
									{pendingImport.isFull ? (
										<div>
											<strong>Groups:</strong>{' '}
											{Object.keys(pendingImport.data.groups ?? {}).length}
										</div>
									) : null}

									<div>
										<strong>Exported At:</strong>{' '}
										{new Date(pendingImport.data.exportedAt).toLocaleString()}
									</div>
									{!pendingImport.isFull && (
										<Alert severity="info" className="mt-2">
											You will need an invitation to rejoin groups and sync the
											data back from your peers.
										</Alert>
									)}
									{pendingImport.isFull && (
										<Alert severity="warning" className="mt-2">
											This will replace all existing data on this device.
										</Alert>
									)}
								</div>
							</DialogContentText>
						</DialogContent>
						<DialogActions>
							<Button color="inherit" onClick={() => setPendingImport(null)}>
								Cancel
							</Button>
							<Button onClick={handleConfirmImport} variant="contained">
								Import
							</Button>
						</DialogActions>
					</>
				)}
			</Dialog>

			<Snackbar
				open={Boolean(error)}
				autoHideDuration={4000}
				onClose={() => setError(null)}
				message={error}
			/>
		</>
	);
}
