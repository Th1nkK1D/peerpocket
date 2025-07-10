import { Tab as MuiTab, Tabs as MuiTabs } from '@mui/material';
import { createLink, useRouterState } from '@tanstack/react-router';
import { type ComponentProps, useMemo } from 'react';

interface Props extends ComponentProps<typeof MuiTabs> {
	tabs: ComponentProps<typeof LinkTab>[];
}

const LinkTab = createLink(MuiTab);

export function NavigationTabs({ tabs, ...rest }: Props) {
	const { location } = useRouterState();

	const activeTab = useMemo(
		() => tabs.findIndex((tab) => tab.to && location.pathname.endsWith(tab.to)),
		[tabs, location.pathname],
	);

	if (activeTab < 0) {
		return null;
	}

	return (
		<MuiTabs
			// biome-ignore lint/a11y/useSemanticElements: use MUI tab
			role="navigation"
			value={activeTab}
			{...rest}
		>
			{tabs.map((tabProps) => (
				<LinkTab key={tabProps.to} {...tabProps} />
			))}
		</MuiTabs>
	);
}
