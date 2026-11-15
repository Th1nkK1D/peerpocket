import { ArchiveOutlined, UnarchiveOutlined } from '@mui/icons-material';

import type { UserStore } from '../../stores/user';
import type { ActionMenuItem } from '../ui/action-menu';

export function archiveMenuItem(
	user: UserStore,
	groupId: string,
	archivedAt: number | undefined,
): ActionMenuItem {
	return archivedAt
		? {
				label: 'Unarchive',
				icon: <UnarchiveOutlined fontSize="small" className="text-warning" />,
				onClick: () => user.delCell('groups', groupId, 'archivedAt'),
			}
		: {
				label: 'Archive',
				icon: <ArchiveOutlined fontSize="small" className="text-warning" />,
				onClick: () =>
					user.setCell('groups', groupId, 'archivedAt', Date.now()),
			};
}
