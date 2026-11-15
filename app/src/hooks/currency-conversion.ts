import { useCallback, useEffect, useMemo, useState } from 'react';

import { compareCurrency, fetchRatesTo } from '../utils/currency';

export const AS_SPENT = 'as-spent';

type FetchedRates = {
	target: string;
	date?: string;
	rates: Record<string, number>;
	failed?: boolean;
};

const NO_EDITS: Record<string, string> = {};

export function useCurrencyConversion(items: { currency: string }[]) {
	const currencies = useMemo(
		() =>
			[...new Set(items.map((item) => item.currency))].sort(compareCurrency),
		[items],
	);
	const [selection, setSelection] = useState(AS_SPENT);
	const target =
		currencies.length > 1 && currencies.includes(selection) ? selection : null;
	const sources = currencies.filter((code) => code && code !== target);
	const rateTarget = sources.length ? target : null;

	const [fetched, setFetched] = useState<FetchedRates | null>(null);
	const [edits, setEdits] = useState<{
		target: string | null;
		values: Record<string, string>;
	}>({ target: rateTarget, values: {} });

	useEffect(() => {
		if (!rateTarget) return;
		let cancelled = false;
		fetchRatesTo(rateTarget).then(
			({ date, rates }) =>
				!cancelled && setFetched({ target: rateTarget, date, rates }),
			() =>
				!cancelled &&
				setFetched({ target: rateTarget, rates: {}, failed: true }),
		);
		return () => {
			cancelled = true;
		};
	}, [rateTarget]);

	const current = fetched?.target === rateTarget ? fetched : null;
	const editValues = edits.target === rateTarget ? edits.values : NO_EDITS;

	const convert = useCallback(
		(currency: string, amount: number) => {
			if (!rateTarget || !currency || currency === rateTarget) {
				return { currency, amount };
			}
			const rate =
				currency in editValues
					? Number(editValues[currency])
					: current?.rates[currency];
			return rate && Number.isFinite(rate) && rate > 0
				? { currency: rateTarget, amount: amount * rate }
				: { currency, amount };
		},
		[rateTarget, current, editValues],
	);

	function setEdit(code: string, value: string | null) {
		const { [code]: _, ...rest } = editValues;
		setEdits({
			target: rateTarget,
			values: value === null ? rest : { ...rest, [code]: value },
		});
	}

	return {
		currencies,
		selection: target ?? AS_SPENT,
		select: setSelection,
		target,
		convert,
		rates: {
			target: rateTarget,
			sources,
			status: !current ? 'loading' : current.failed ? 'failed' : 'ready',
			date: current?.date,
			fetched: current?.rates ?? {},
			edits: editValues,
			hasEdits: Object.keys(editValues).length > 0,
			setEdit,
			resetEdits: () => setEdits({ target: rateTarget, values: {} }),
		},
	} as const;
}

export type CurrencyConversion = ReturnType<typeof useCurrencyConversion>;
export type ConversionRates = CurrencyConversion['rates'];
