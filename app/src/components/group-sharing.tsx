import { ContentCopyOutlined } from '@mui/icons-material';
import { IconButton, InputAdornment, Snackbar, TextField } from '@mui/material';
import { useMemo, useState } from 'react';

interface GroupSharingProps {
	id: string;
	name: string;
}

export function GroupSharing({ id, name }: GroupSharingProps) {
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
		<>
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
		</>
	);
}
