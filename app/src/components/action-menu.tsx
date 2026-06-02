import { MoreVert } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { type ReactNode, useCallback, useState } from 'react';

export interface ActionMenuItem {
	label: string;
	icon?: ReactNode;
	onClick: () => void;
	className?: string;
}

interface ActionMenuProps {
	items: ActionMenuItem[];
	ariaLabel?: string;
}

export function ActionMenu({ items, ariaLabel = 'Actions' }: ActionMenuProps) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	}, []);

	const handleClose = useCallback(() => {
		setAnchorEl(null);
	}, []);

	return (
		<>
			<IconButton aria-label={ariaLabel} size="small" onClick={handleOpen}>
				<MoreVert fontSize="small" />
			</IconButton>
			<Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
				{items.map((item) => (
					<MenuItem
						key={item.label}
						className={item.className}
						onClick={() => {
							item.onClick();
							handleClose();
						}}
					>
						{item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}
						{item.label}
					</MenuItem>
				))}
			</Menu>
		</>
	);
}
