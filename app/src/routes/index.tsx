import { CloudUpload, Download } from '@mui/icons-material';
import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	Snackbar,
} from '@mui/material';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { type ChangeEvent, useRef, useState } from 'react';
import * as z from 'zod';
import { useMuiForm } from '../hooks/form';
import { setupUserStore, USER_STORE_PREFIX } from '../stores/user';
import { activeUserStoreId } from '../utils/active-user';
import {
	downloadJson,
	type ExportData,
	exportDataSchema,
	generateFilename,
	isFullExport,
	performImport,
} from '../utils/export';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/')({
	component: RouteComponent,
	beforeLoad() {
		if (activeUserStoreId.get()) {
			throw redirect({
				to: '/groups',
				replace: true,
			});
		}
	},
	validateSearch: zodValidator(
		z.object({
			path: z.string().optional(),
			params: z.record(z.any()).optional(),
		}),
	),
});

function RouteComponent() {
	const { path, params } = Route.useSearch();
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [importing, setImporting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pendingImport, setPendingImport] = useState<{
		data: ExportData;
		isFull: boolean;
	} | null>(null);
	const [showRecoveryModal, setShowRecoveryModal] = useState(false);
	const [newUserData, setNewUserData] = useState<{
		id: string;
		hashedId: string;
		name: string;
	} | null>(null);

	const form = useMuiForm({
		defaultValues: {
			name: '',
		},
		validators: {
			onSubmit: z.object({
				name: z.string().nonempty(),
			}),
		},
		onSubmit: async ({ value }) => {
			const id = idHelper.generate();
			const hashedId = await idHelper.hash(id);
			const userStoreId = idHelper.createStoreId(USER_STORE_PREFIX, id);

			const user = await setupUserStore(userStoreId);

			user.setValues({
				id,
				hashedId,
				name: value.name,
			});

			activeUserStoreId.set(userStoreId);

			setNewUserData({ id, hashedId, name: value.name });
			setShowRecoveryModal(true);
		},
	});

	function handleDownloadIdentity() {
		if (!newUserData) return;

		const data: ExportData = {
			exportedAt: new Date().toISOString(),
			user: newUserData,
		};

		const fileName = generateFilename(newUserData.name, 'identity');
		downloadJson(data, fileName);

		navigate({ to: path || '/groups', search: params, replace: true });
	}

	function handleSkipRecovery() {
		navigate({ to: path || '/groups', search: params, replace: true });
	}

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
			activeUserStoreId.set(userStoreId);
			navigate({ to: '/groups', replace: true });
		} catch {
			setError('Import failed');
			setPendingImport(null);
		}
	}

	return (
		<div className="flex h-full min-h-dvh flex-col items-center justify-center gap-6 p-2">
			<img src="/favicon-192x192.png" alt="" className="rounded-xl" />
			<div>
				<h3>PeerPocket</h3>
				<p>Your Peer-to-peer expense tracker</p>
			</div>
			<form
				className="flex flex-col gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<form.AppField name="name">
					{(field) => <field.TextField label="Enter your name" />}
				</form.AppField>
				<form.AppForm>
					<form.SubmitButton>Get started</form.SubmitButton>
				</form.AppForm>
			</form>

			<Divider className="w-64 text-neutral-500">or</Divider>

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
				open={showRecoveryModal}
				onClose={handleSkipRecovery}
				fullWidth
				maxWidth="sm"
			>
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
								This file contains only your identity. You will need an
								invitation to rejoin groups and sync the data back from your
								peers.
							</Alert>
						</div>
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleSkipRecovery}>Skip</Button>
					<Button
						onClick={handleDownloadIdentity}
						variant="contained"
						startIcon={<Download />}
					>
						Save Identity
					</Button>
				</DialogActions>
			</Dialog>

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
							<Button onClick={() => setPendingImport(null)}>Cancel</Button>
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
		</div>
	);
}
