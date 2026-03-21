import { ContentCopyOutlined } from '@mui/icons-material';
import {
	Box,
	IconButton,
	InputAdornment,
	Snackbar,
	TextField,
	Typography,
} from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import { useMemo, useState } from 'react';

interface GroupSharingProps {
	id: string;
	name: string;
	label: string;
}

export function GroupSharing({ id, name, label }: GroupSharingProps) {
	const [isCopied, setIsCopied] = useState(false);

	const sharedLink = useMemo(
		() =>
			`${window.location.origin}/groups/join?${new URLSearchParams({
				id,
				name,
			}).toString()}`,
		[id, name],
	);

	function copyLinkToClipboard() {
		navigator.clipboard.writeText(sharedLink);
		setIsCopied(true);
	}

	return (
		<div className="flex flex-col gap-3">
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			<Box className="flex flex-col items-center gap-3">
				<QRCodeCanvas
					value={sharedLink}
					size={180}
					includeMargin
					className="rounded-xl bg-white"
				/>
			</Box>
			<TextField
				fullWidth
				value={sharedLink}
				aria-readonly
				slotProps={{
					input: {
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									aria-label="Copy link"
									onClick={copyLinkToClipboard}
									edge="end"
								>
									<ContentCopyOutlined />
								</IconButton>
							</InputAdornment>
						),
					},
				}}
			/>
			<Snackbar
				open={isCopied}
				autoHideDuration={4000}
				onClose={() => setIsCopied(false)}
				message="Link copied"
			/>
		</div>
	);
}
