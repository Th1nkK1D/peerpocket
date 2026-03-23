import { Alert, Snackbar } from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { useRef, useState } from 'react';
import { AuthenticatedLayout } from '../components/authenticated-layout';

interface JoinSearch {
	id: string;
	name: string;
}

export const Route = createFileRoute('/groups/scan')({
	component: RouteComponent,
	loader: ({ context }) => context,
});

function parseGroupJoinUrl(rawValue: string): JoinSearch | null {
	try {
		const url = new URL(rawValue, window.location.origin);

		if (url.pathname !== '/groups/join') {
			return null;
		}

		const id = url.searchParams.get('id')?.trim();
		const name = url.searchParams.get('name')?.trim();

		if (!id || !name) {
			return null;
		}

		return { id, name };
	} catch {
		return null;
	}
}

function RouteComponent() {
	const { user } = Route.useLoaderData();
	const navigate = useNavigate();
	const hasMatchedScan = useRef(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [scanError, setScanError] = useState<string | null>(null);

	function handleScan(detectedCodes: IDetectedBarcode[]) {
		if (hasMatchedScan.current) {
			return;
		}

		const match = detectedCodes
			.map(({ rawValue }) => parseGroupJoinUrl(rawValue))
			.find((value): value is JoinSearch => value !== null);

		if (!match) {
			setScanError('Could not read a valid group link from that QR code.');
			return;
		}

		hasMatchedScan.current = true;
		setScanError(null);

		navigate({
			to: '/groups/join',
			search: match,
			replace: true,
		});
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

	return (
		<AuthenticatedLayout title="Scan Group QR" userStore={user} className="p-3">
			<Scanner
				onScan={handleScan}
				onError={handleError}
				formats={['qr_code']}
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
			{cameraError ? <Alert severity="error">{cameraError}</Alert> : null}
			<Snackbar
				open={Boolean(scanError)}
				autoHideDuration={4000}
				onClose={() => setScanError(null)}
				message={scanError}
			/>
		</AuthenticatedLayout>
	);
}
