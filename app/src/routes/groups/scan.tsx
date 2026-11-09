import 'barcode-detector/polyfill';
import { ContentPasteOutlined } from '@mui/icons-material';
import { Alert, Fab, Snackbar } from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { useEffect, useRef, useState } from 'react';

import { getE2EConfig } from '../../../../tests/mocks/playwright';
import { AuthenticatedLayout } from '../../components/authenticated-layout';
import { FabsContainer } from '../../components/fabs-container';
import { InviteLinkDialog } from '../../components/invite-link-dialog';
import { type GroupInvite, parseGroupJoinUrl } from '../../utils/group-link';

export const Route = createFileRoute('/groups/scan')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user } = Route.useLoaderData();
	const navigate = useNavigate();
	const hasMatchedScan = useRef(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [scanError, setScanError] = useState<string | null>(null);
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const e2eScan = getE2EConfig()?.scan;

	function joinInvite(invite: GroupInvite) {
		hasMatchedScan.current = true;
		setScanError(null);

		navigate({
			to: '/groups/join',
			search: invite,
			replace: true,
		});
	}

	async function pasteInviteLink() {
		try {
			const invite = parseGroupJoinUrl(await navigator.clipboard.readText());

			if (invite) {
				joinInvite(invite);
				return;
			}
		} catch {
			// Denied or unsupported, fall through to manual entry
		}

		setInviteDialogOpen(true);
	}

	function handleScan(detectedCodes: IDetectedBarcode[]) {
		if (hasMatchedScan.current) {
			return;
		}

		const match = detectedCodes
			.map(({ rawValue }) => parseGroupJoinUrl(rawValue))
			.find((value): value is GroupInvite => value !== null);

		if (!match) {
			setScanError('Could not read a valid group link from that QR code.');
			return;
		}

		joinInvite(match);
	}

	function handleError(error: unknown) {
		if (hasMatchedScan.current) {
			return;
		}

		setCameraError(
			error instanceof Error
				? error.message
				: 'Unable to access the camera on this device.',
		);
	}

	useEffect(() => {
		if (!e2eScan) {
			return;
		}

		if (e2eScan.error) {
			handleError(new Error(e2eScan.error));
			return;
		}

		if (e2eScan.detectedCodes?.length) {
			handleScan(
				e2eScan.detectedCodes.map(
					(rawValue) => ({ rawValue }) as IDetectedBarcode,
				),
			);
		}
		// oxlint-disable-next-line react-hooks/exhaustive-deps -- just for e2e test
	}, [e2eScan]);

	return (
		<AuthenticatedLayout title="Scan Group QR" userStore={user} className="p-3">
			{e2eScan ? (
				<div data-testid="scanner-mock">Scanner mocked for e2e</div>
			) : (
				<Scanner
					onScan={handleScan}
					onError={handleError}
					formats={['qr_code']}
					sound={false}
					styles={{
						container: {
							width: '100%',
							height: '100%',
						},
						video: {
							width: '100%',
							height: '100%',
							objectFit: 'cover',
						},
					}}
				/>
			)}
			{cameraError ? <Alert severity="error">{cameraError}</Alert> : null}
			<FabsContainer position="fixed" className="left-6 justify-center">
				<Fab
					variant="extended"
					color="secondary"
					className="gap-2 opacity-80"
					onClick={pasteInviteLink}
				>
					<ContentPasteOutlined />
					Paste invite link
				</Fab>
			</FabsContainer>
			<InviteLinkDialog
				open={inviteDialogOpen}
				onClose={() => setInviteDialogOpen(false)}
				onJoin={joinInvite}
			/>
			<Snackbar
				open={Boolean(scanError)}
				autoHideDuration={4000}
				onClose={() => setScanError(null)}
				message={scanError}
			/>
		</AuthenticatedLayout>
	);
}
