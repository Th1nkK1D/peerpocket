import {
	AddBoxOutlined,
	ContentCopyOutlined,
	InstallMobileOutlined,
	IosShare,
} from '@mui/icons-material';
import { Alert, AlertTitle, Button, Snackbar, TextField } from '@mui/material';
import { useState } from 'react';

import {
	isInAppBrowser,
	isIos,
	isStandalone,
	useInstallPrompt,
} from '../hooks/install-prompt';

interface InstallNudgeProps {
	hasInvite: boolean;
}

export function InstallNudge({ hasInvite }: InstallNudgeProps) {
	const { canPrompt, isInstalled, install } = useInstallPrompt();

	if (isStandalone()) return null;

	const ios = isIos();

	return (
		<Alert
			data-testid="install-nudge"
			severity={isInstalled ? 'success' : 'warning'}
			className="w-full max-w-sm [&_p]:typography-body2"
		>
			{isInstalled ? (
				<>
					<AlertTitle>PeerPocket is installed</AlertTitle>
					<div className="flex flex-col gap-2">
						<p>
							Please use the PeerPocket app from your home screen. The browser
							won't clear your data there on its own.
						</p>
						<p>
							It still lives only on this device, so keep a backup with Export
							data once you're set up.
						</p>
					</div>
				</>
			) : (
				<>
					<AlertTitle>Install PeerPocket before you start</AlertTitle>
					<div className="flex flex-col gap-2">
						<p>
							Your data lives only on this device and can be wiped by your
							browser without notice.
						</p>
						{ios && (
							<p>
								The home screen app can't see data created in the browser, so
								set up inside the app.
							</p>
						)}
						<InstallAction
							ios={ios}
							canPrompt={canPrompt}
							onInstall={install}
						/>
						{!canPrompt && (
							<p>
								Already installed? Open PeerPocket from your home screen
								instead.
							</p>
						)}
					</div>
				</>
			)}
			{hasInvite && (
				<p className="mt-2">
					Your invitation won't carry over. Once you're set up in the app, tap
					Join, then scan the group QR code or paste the invite link.
				</p>
			)}
		</Alert>
	);
}

interface OpenInBrowserActionProps {
	ios: boolean;
}

function OpenInBrowserAction({ ios }: OpenInBrowserActionProps) {
	const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
		'idle',
	);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopyStatus('copied');
		} catch {
			setCopyStatus('failed');
		}
	}

	return (
		<>
			<p>
				This in-app browser can't install apps. Use its menu to open this page
				in {ios ? 'Safari' : 'Chrome'}, or copy the link and paste it there.
			</p>
			{copyStatus === 'failed' ? (
				<TextField
					label="Copy this link"
					value={window.location.href}
					size="small"
					fullWidth
					slotProps={{ htmlInput: { readOnly: true } }}
					onFocus={(e) => e.target.select()}
				/>
			) : (
				<Button
					variant="outlined"
					color="inherit"
					startIcon={<ContentCopyOutlined />}
					onClick={copyLink}
				>
					Copy link
				</Button>
			)}
			<Snackbar
				open={copyStatus === 'copied'}
				autoHideDuration={4000}
				onClose={() => setCopyStatus('idle')}
				message="Link copied"
			/>
		</>
	);
}

interface InstallActionProps {
	ios: boolean;
	canPrompt: boolean;
	onInstall: () => void;
}

function InstallAction({ ios, canPrompt, onInstall }: InstallActionProps) {
	if (isInAppBrowser()) {
		return <OpenInBrowserAction ios={ios} />;
	}

	if (canPrompt) {
		return (
			<Button
				variant="contained"
				startIcon={<InstallMobileOutlined />}
				onClick={onInstall}
			>
				Install app
			</Button>
		);
	}

	if (ios) {
		return (
			<ol className="list-decimal pl-5">
				<li>
					Tap Share <IosShare fontSize="inherit" />
				</li>
				<li>
					Choose Add to Home Screen <AddBoxOutlined fontSize="inherit" />
				</li>
				<li>Open PeerPocket from your home screen</li>
			</ol>
		);
	}

	return (
		<p>
			Look in your browser menu for "Install app", "Add to Home screen" or "Add
			to Dock", then open PeerPocket from there.
		</p>
	);
}
