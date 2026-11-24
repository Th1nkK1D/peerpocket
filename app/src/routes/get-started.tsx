import { ChevronLeft, DarkMode, LightMode } from '@mui/icons-material';
import { Divider, IconButton } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import * as z from 'zod';

import { ImportFlow } from '../components/landing/import-flow';
import { InstallNudge } from '../components/landing/install-nudge';
import { SaveIdentityDialog } from '../components/landing/save-identity-dialog';
import { useMuiForm } from '../form/fields';
import { setupUserStore, USER_STORE_PREFIX } from '../stores/user';
import { activeUserStoreId } from '../utils/active-user';
import { idHelper } from '../utils/id';

export const Route = createFileRoute('/get-started')({
	component: RouteComponent,
	beforeLoad({ search }) {
		if (activeUserStoreId.get()) {
			throw redirect({
				to: search.path?.startsWith('/groups/') ? search.path : '/groups',
				search: search.params,
				replace: true,
			});
		}
	},
	validateSearch: z.object({
		path: z.string().optional(),
		params: z.record(z.string(), z.any()).optional(),
	}),
});

function RouteComponent() {
	const { path, params } = Route.useSearch();
	const navigate = useNavigate();
	const { colorScheme, setMode } = useColorScheme();
	const isDark = colorScheme === 'dark';

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

	function goToGroups() {
		navigate({ to: path || '/groups', search: params, replace: true });
	}

	return (
		<div className="flex h-full min-h-dvh flex-col">
			<div className="flex justify-between p-1.5 text-gray-500 dark:text-gray-600">
				<IconButton aria-label="Home" href="/" color="inherit">
					<ChevronLeft />
				</IconButton>
				<IconButton
					aria-label={isDark ? 'Light mode' : 'Dark mode'}
					onClick={() => setMode(isDark ? 'light' : 'dark')}
					color="inherit"
				>
					{isDark ? <LightMode /> : <DarkMode />}
				</IconButton>
			</div>
			<div className="flex flex-1 flex-col items-center justify-center gap-6 px-3 pb-8">
				<img
					src="/favicon-192x192-20261110.png"
					alt=""
					className="size-40 rounded-2xl shadow-lg"
				/>
				<div className="flex flex-col items-center gap-2">
					<h3 className="font-grandstander">PeerPocket</h3>
					<InstallNudge hasInvite={path === '/groups/join'} />
				</div>
				<form
					className="flex w-full max-w-64 flex-col gap-3"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<form.AppField name="name">
						{(field) => <field.TextField label="What's your name?" />}
					</form.AppField>
					<form.AppForm>
						<form.SubmitButton>Get started</form.SubmitButton>
					</form.AppForm>
				</form>

				<Divider className="w-64">or</Divider>

				<ImportFlow
					onImportSuccess={(userStoreId) => {
						activeUserStoreId.set(userStoreId);
						navigate({ to: '/groups', replace: true });
					}}
				/>

				<SaveIdentityDialog
					open={showRecoveryModal}
					userData={newUserData}
					onSave={goToGroups}
					onSkip={goToGroups}
				/>
			</div>
		</div>
	);
}
