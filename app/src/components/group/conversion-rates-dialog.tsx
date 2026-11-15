import { Replay } from '@mui/icons-material';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	InputAdornment,
	Link,
	TextField,
} from '@mui/material';

import type { ConversionRates } from '../../hooks/currency-conversion';
import { currencyName } from '../../utils/currency';
import { formatRelativeDay } from '../../utils/format';

interface ConversionRatesDialogProps {
	open: boolean;
	onClose: () => void;
	rates: ConversionRates;
	hasUnknownCurrency: boolean;
}

export function ConversionRatesDialog({
	open,
	onClose,
	rates,
	hasUnknownCurrency,
}: ConversionRatesDialogProps) {
	const { target, sources, edits, fetched, status, date } = rates;

	return (
		<Dialog open={open} onClose={onClose} fullWidth>
			<DialogTitle>Conversion rates</DialogTitle>
			<DialogContent className="flex flex-col gap-3">
				{sources.map((code) => (
					<div key={code} className="flex items-center gap-1">
						<TextField
							type="number"
							size="small"
							margin="dense"
							fullWidth
							label={currencyName(code)}
							value={
								edits[code] ??
								(fetched[code] ? Number(fetched[code].toPrecision(4)) : '')
							}
							onChange={(event) => rates.setEdit(code, event.target.value)}
							slotProps={{
								htmlInput: { min: 0, step: 'any' },
								input: {
									startAdornment: (
										<InputAdornment position="start">1 {code} =</InputAdornment>
									),
									endAdornment: (
										<InputAdornment position="end">{target}</InputAdornment>
									),
								},
							}}
						/>
						<IconButton
							aria-label={`Reset ${code} rate`}
							className={code in edits ? '' : 'invisible'}
							onClick={() => rates.setEdit(code, null)}
						>
							<Replay fontSize="small" />
						</IconButton>
					</div>
				))}
				<DialogContentText className="text-sm">
					{status === 'failed' ? (
						'Rates unavailable — enter them manually.'
					) : (
						<>
							Today's rates from{' '}
							<Link
								href="https://github.com/fawazahmed0/exchange-api"
								target="_blank"
								rel="noreferrer"
							>
								fawazahmed0/exchange-api
							</Link>
							{date ? `, updated ${formatRelativeDay(date)}` : ''}.
						</>
					)}{' '}
					Edits apply until you leave this page.
					{hasUnknownCurrency
						? " Expenses without a currency aren't converted."
						: ''}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button
					color="inherit"
					disabled={!rates.hasEdits}
					onClick={rates.resetEdits}
				>
					Reset all
				</Button>
				<Button variant="contained" onClick={onClose}>
					Done
				</Button>
			</DialogActions>
		</Dialog>
	);
}
