import { CurrencyExchange } from '@mui/icons-material';
import { IconButton, ListSubheader, MenuItem, TextField } from '@mui/material';
import { useState } from 'react';

import {
	AS_SPENT,
	type ConversionRates,
	type CurrencyConversion,
} from '../../hooks/currency-conversion';
import { currencyName, currencySymbol } from '../../utils/currency';
import { formatRelativeDay } from '../../utils/format';
import { ConversionRatesDialog } from './conversion-rates-dialog';

export function CurrencySelect({
	conversion,
}: {
	conversion: CurrencyConversion;
}) {
	const [ratesOpen, setRatesOpen] = useState(false);
	const { currencies, rates } = conversion;

	if (currencies.length < 2) return null;

	return (
		<div className="flex items-start gap-1">
			<TextField
				select
				label="Currency"
				value={conversion.selection}
				onChange={(event) => conversion.select(event.target.value)}
				fullWidth
				size="small"
				helperText={rates.target ? ratesHelperText(rates) : undefined}
			>
				<MenuItem value={AS_SPENT}>As spent</MenuItem>
				<ListSubheader>Convert to</ListSubheader>
				{currencies.filter(Boolean).map((code) => (
					<MenuItem key={code} value={code}>
						{currencySymbol(code)} {code} · {currencyName(code)}
					</MenuItem>
				))}
			</TextField>
			{rates.target ? (
				<IconButton
					aria-label="Conversion rates"
					onClick={() => setRatesOpen(true)}
				>
					<CurrencyExchange />
				</IconButton>
			) : null}
			<ConversionRatesDialog
				open={ratesOpen && !!rates.target}
				onClose={() => setRatesOpen(false)}
				rates={rates}
				hasUnknownCurrency={currencies.includes('')}
			/>
		</div>
	);
}

function ratesHelperText(rates: ConversionRates) {
	if (rates.hasEdits) return 'Converted at custom rates';
	if (rates.status === 'loading') return 'Loading rates…';
	if (rates.status === 'failed') return 'Rates unavailable — enter manually';
	return `Converted at rates from ${formatRelativeDay(rates.date)}`;
}
