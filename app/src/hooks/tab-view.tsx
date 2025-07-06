import { Tab as MuiTab, Tabs as MuiTabs } from '@mui/material';
import { type ComponentProps, type PropsWithChildren, useState } from 'react';

interface TabProps extends ComponentProps<typeof MuiTab> {
	index: number;
}

interface TabPanelProps {
	index: number;
	value: number;
	className?: string;
}

export function useTabView(name: string) {
	const [activeTab, setActiveTab] = useState(0);

	function Tabs({ children, ...rest }: ComponentProps<typeof MuiTabs>) {
		return (
			<MuiTabs
				value={activeTab}
				onChange={(_, value) => setActiveTab(value)}
				{...rest}
			>
				{children}
			</MuiTabs>
		);
	}

	function Tab({ index, ...rest }: TabProps) {
		return (
			<MuiTab
				id={`${name}-tab-${index}`}
				aria-controls={`${name}-tabpanel-${index}`}
				{...rest}
			/>
		);
	}

	function TabPanel({
		children,
		value,
		index,
		...other
	}: PropsWithChildren<TabPanelProps>) {
		return (
			<div
				role="tabpanel"
				hidden={value !== index}
				id={`${name}-tabpanel-${index}`}
				aria-labelledby={`${name}-tab-${index}`}
				{...other}
			>
				{value === index && children}
			</div>
		);
	}

	return {
		Tabs,
		Tab,
		TabPanel,
		activeTab,
		setActiveTab,
	};
}
