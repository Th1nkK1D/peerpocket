import { CircularProgress, Paper, Tab, Tabs, Typography } from '@mui/material';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { useCallback, useEffect, useRef } from 'react';
import { z } from 'zod/v4';
import { AuthenticatedLayout } from '../../../components/authenticated-layout';
import { ExpensesPanel } from '../../../components/group-tab/expenses-panel';
import { MembersPanel } from '../../../components/group-tab/members-panel';
import { SummaryPanel } from '../../../components/group-tab/summary-panel';
import { GROUP_STORE_PREFIX, setupGroupStore } from '../../../stores/group';
import { idHelper } from '../../../utils/id';

const tabs = [
	{ key: 'summary', label: 'Summary', Panel: SummaryPanel },
	{ key: 'expenses', label: 'Expenses', Panel: ExpensesPanel },
	{ key: 'members', label: 'Members', Panel: MembersPanel },
] as const;

const searchSchema = z.object({
	tab: z.enum(tabs.map((t) => t.key)).default('expenses'),
});

export const Route = createFileRoute('/groups/$groupId')({
	component: RouteComponent,
	validateSearch: zodValidator(searchSchema),
	async beforeLoad({ params, context }) {
		const { user } = context;

		if (!user.hasRow('groups', params.groupId)) {
			throw redirect({
				to: '/groups',
				replace: true,
			});
		}

		const groupStoreId = idHelper.createStoreId(
			GROUP_STORE_PREFIX,
			params.groupId,
		);

		const group = await setupGroupStore(groupStoreId);
		const hashedId = user.getValue('hashedId') as string;

		if (!group.hasRow('members', hashedId)) {
			group.setRow('members', hashedId, {
				name: user.getValue('name') as string,
				joinedAt: user.getCell('groups', params.groupId, 'joinedAt'),
			});
		}

		return {
			...context,
			userGroupInfo: {
				id: params.groupId,
				...context.user.getRow('groups', params.groupId),
			},
			group,
		};
	},
	loader: ({ context }) => context,
});

function RouteComponent() {
	const { user, group, userGroupInfo } = Route.useLoaderData();
	const { peerCount, isSyncing } = group.usePeerSync();
	const { groupId } = Route.useParams();
	const { tab } = Route.useSearch();
	const navigate = Route.useNavigate();

	const activeTab = tabs.findIndex((t) => t.key === tab);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
	const isScrollingRef = useRef(false);
	const isFirstRenderRef = useRef(true);

	useEffect(() => {
		const container = scrollContainerRef.current;
		const panel = panelRefs.current[activeTab];
		if (container && panel) {
			isScrollingRef.current = true;
			container.scrollTo({
				left: panel.offsetLeft,
				behavior: isFirstRenderRef.current ? 'instant' : 'smooth',
			});
			isFirstRenderRef.current = false;
			setTimeout(() => {
				isScrollingRef.current = false;
			}, 500);
		}
	}, [activeTab]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (isScrollingRef.current) return;

				for (const entry of entries) {
					if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
						const index = panelRefs.current.indexOf(
							entry.target as HTMLDivElement,
						);
						if (index !== -1 && index !== activeTab) {
							navigate({
								search: { tab: tabs[index].key },
								replace: true,
							});
						}
					}
				}
			},
			{
				root: container,
				threshold: 0.5,
			},
		);

		for (const panel of panelRefs.current) {
			if (panel) observer.observe(panel);
		}

		return () => observer.disconnect();
	}, [activeTab, navigate]);

	const handleTabChange = useCallback(
		(_: React.SyntheticEvent, newValue: number) => {
			navigate({
				search: { tab: tabs[newValue].key },
				replace: true,
			});
		},
		[navigate],
	);

	const setPanelRef = useCallback(
		(index: number) => (el: HTMLDivElement | null) => {
			panelRefs.current[index] = el;
		},
		[],
	);

	return (
		<AuthenticatedLayout
			title={userGroupInfo.name}
			userStore={user}
			className="!p-0"
		>
			<Paper elevation={1} className="rounded-none">
				<div className="flex flex-row items-center justify-center gap-2 px-3 pt-2 pb-1">
					{isSyncing && peerCount > 1 ? (
						<CircularProgress size={8} className="text-success" />
					) : (
						<div
							className={`size-2 rounded-full ${
								peerCount === 0
									? 'bg-error'
									: peerCount === 1
										? 'bg-warning'
										: 'bg-success'
							}`}
						>
							<div className="size-2 animate-ping rounded-full bg-inherit"></div>
						</div>
					)}
					<Typography variant="caption" color="textSecondary">
						{isSyncing && peerCount > 1
							? `Syncing with ${peerCount - 1} peer`
							: peerCount === 0
								? 'No connection to the relay server'
								: peerCount === 1
									? 'Only you are online'
									: `Online with ${peerCount - 1} peer`}
					</Typography>
				</div>
				<Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
					{tabs.map(({ key, label }) => (
						<Tab key={key} label={label} />
					))}
				</Tabs>
			</Paper>

			<div
				ref={scrollContainerRef}
				className="flex flex-1 snap-x snap-mandatory overflow-x-auto"
				style={{ scrollSnapType: 'x mandatory' }}
			>
				{tabs.map(({ key, Panel }, i) => (
					<div
						key={key}
						ref={setPanelRef(i)}
						className="flex h-full min-w-full shrink-0 snap-start flex-col overflow-y-auto"
					>
						<Panel
							user={user}
							group={group}
							groupId={groupId}
							userGroupInfo={userGroupInfo}
						/>
					</div>
				))}
			</div>
		</AuthenticatedLayout>
	);
}
