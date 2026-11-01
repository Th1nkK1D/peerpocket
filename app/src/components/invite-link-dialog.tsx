import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from '@mui/material';
import * as z from 'zod';
import { useMuiForm } from '../hooks/form';
import { type GroupInvite, parseGroupJoinUrl } from '../utils/group-link';

interface Props {
	open: boolean;
	onClose: () => void;
	onJoin: (invite: GroupInvite) => void;
}

export function InviteLinkDialog({ open, onClose, onJoin }: Props) {
	const form = useMuiForm({
		defaultValues: {
			link: '',
		},
		validators: {
			onSubmit: z.object({
				link: z
					.string()
					.refine((link) => parseGroupJoinUrl(link), 'Not a group invite link'),
			}),
		},
		onSubmit: ({ value }) => {
			const invite = parseGroupJoinUrl(value.link);
			if (invite) onJoin(invite);
		},
	});

	return (
		<Dialog open={open} onClose={onClose} fullWidth>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<DialogTitle>Paste invite link</DialogTitle>
				<DialogContent className="flex flex-col gap-3">
					<DialogContentText>
						We couldn't read an invite from your clipboard. Paste the group
						invite link here instead.
					</DialogContentText>
					<form.AppField name="link">
						{(field) => <field.TextField label="Invite link" fullWidth />}
					</form.AppField>
				</DialogContent>
				<DialogActions>
					<Button color="inherit" onClick={onClose}>
						Cancel
					</Button>
					<form.AppForm>
						<form.SubmitButton>Join</form.SubmitButton>
					</form.AppForm>
				</DialogActions>
			</form>
		</Dialog>
	);
}
