import { Download, InfoOutlined } from '@mui/icons-material';
import {
	Alert,
	Button,
	FormControl,
	FormControlLabel,
	Paper,
	Radio,
	RadioGroup,
	Typography,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import { AuthenticatedLayout } from '../../components/authenticated-layout';
import { GROUP_STORE_PREFIX } from '../../stores/group';
import {
	downloadJson,
	type ExportData,
	generateFilename,
} from '../../utils/export';

export const Route = createFileRoute('/groups/export')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user } = Route.useLoaderData();
	const [mode, setMode] = React.useState<'identity' | 'full' | ''>('');
	const [exporting, setExporting] = React.useState(false);

	const userValues = user.useValues();
	const groups = user.useTableRows('groups');

	function handleExport() {
		if (!mode) return;

		setExporting(true);

		try {
			let groupStoresData:
				| Record<
						string,
						{
							members: Record<string, any>;
							expenses: Record<string, any>;
							splits: Record<string, any>;
						}
				  >
				| undefined;

			if (mode === 'full') {
				groupStoresData = {};

				// Find all group store keys in localStorage
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					if (key?.startsWith(`${GROUP_STORE_PREFIX}-`)) {
						const groupId = key.replace(`${GROUP_STORE_PREFIX}-`, '');
						const raw = localStorage.getItem(key);
						if (raw) {
							// TinyBase MergeableStore uses stamp format: [[tables, hlc, hash], [values, hlc, hash]]
							// Each table is [rows, hlc, hash], each row is [cells, hlc, hash]
							const parsed = JSON.parse(raw) as any;
							const tables = Array.isArray(parsed?.[0])
								? parsed[0][0]
								: parsed[0];

							const unwrapCell = (cell: any) =>
								Array.isArray(cell) ? cell[0] : cell;

							const unwrapTable = (table: any) => {
								const rows = Array.isArray(table) ? table[0] : table;
								if (!rows || typeof rows !== 'object') return {};
								const result: Record<string, any> = {};
								for (const [rowId, row] of Object.entries(rows)) {
									const cells = Array.isArray(row) ? row[0] : row;
									if (!cells || typeof cells !== 'object') {
										result[rowId] = cells;
										continue;
									}
									const unwrappedCells: Record<string, any> = {};
									for (const [cellKey, cellValue] of Object.entries(cells)) {
										unwrappedCells[cellKey] = unwrapCell(cellValue);
									}
									result[rowId] = unwrappedCells;
								}
								return result;
							};

							groupStoresData[groupId] = {
								members: unwrapTable(tables?.members),
								expenses: unwrapTable(tables?.expenses),
								splits: unwrapTable(tables?.splits),
							};
						}
					}
				}
			}

			const groupsRecord: Record<
				string,
				{ name: string; joinedAt: number; archivedAt?: number }
			> = {};
			for (const group of groups) {
				groupsRecord[group.id] = {
					name: group.name,
					joinedAt: group.joinedAt,
					archivedAt: group.archivedAt,
				};
			}

			const data: ExportData = {
				exportedAt: new Date().toISOString(),
				user: {
					id: userValues.id ?? '',
					hashedId: userValues.hashedId ?? '',
					name: userValues.name ?? '',
				},
				...(mode === 'full' && {
					groups: groupsRecord,
					groupStores: groupStoresData,
				}),
			};

			const fileName = generateFilename(userValues.name ?? 'user', mode);
			downloadJson(data, fileName);
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			setExporting(false);
		}
	}

	return (
		<AuthenticatedLayout userStore={user} title="Export Data">
			<div className="flex flex-1 flex-col gap-4 p-4">
				<Typography variant="body1" color="textSecondary">
					Export data for account recovery, changing device, or to log-in from
					several places.
				</Typography>

				<FormControl component="fieldset">
					<RadioGroup
						value={mode}
						onChange={(e) => setMode(e.target.value as 'identity' | 'full')}
					>
						<Paper className="mb-3 p-4">
							<FormControlLabel
								value="identity"
								control={<Radio />}
								label={
									<div>
										<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
											Identity
										</Typography>
										<Typography variant="body2" color="textSecondary">
											Export only your profile name and key. You will need an
											invitation to rejoin groups and sync the data back from
											your peers.
										</Typography>
									</div>
								}
							/>
						</Paper>

						<Paper className="p-4">
							<FormControlLabel
								value="full"
								control={<Radio />}
								label={
									<div>
										<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
											Full Export
										</Typography>
										<Typography variant="body2" color="textSecondary">
											Export everything: your profile, group list, and all group
											data including members, expenses, and splits.
										</Typography>
									</div>
								}
							/>
						</Paper>
					</RadioGroup>
				</FormControl>

				<div className="flex items-start gap-2">
					<InfoOutlined className="mt-0.5" color="action" />
					<div>
						<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
							How to import
						</Typography>
						<Typography variant="body2" color="textSecondary">
							On the home page (when logged out or when using a new device),
							click "Import from file" and select your exported JSON file. The
							import will replace your current data.
						</Typography>
					</div>
				</div>

				{mode ? (
					<Alert severity="warning" className="mt-2">
						Keep this as a secret! Anyone who get this file can get all your
						PeerPocket's identity and data.
					</Alert>
				) : null}

				<Button
					variant="contained"
					startIcon={<Download />}
					onClick={handleExport}
					disabled={!mode || exporting}
					fullWidth
					size="large"
				>
					{exporting ? 'Exporting...' : 'Export'}
				</Button>
			</div>
		</AuthenticatedLayout>
	);
}
