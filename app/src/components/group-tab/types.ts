import type { setupGroupStore } from '../../stores/group';
import type { UserStore } from '../../stores/user';

export type GroupStore = Awaited<ReturnType<typeof setupGroupStore>>;

export interface PanelProps {
	user: UserStore;
	group: GroupStore;
	groupId: string;
	userGroupInfo: {
		id: string;
		name: string;
		[key: string]: unknown;
	};
}
