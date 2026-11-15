import { formatDecimal, NUMBER_LOCALE } from './format';

const LS_LAST_CURRENCY_KEY = 'LAST_CURRENCY';
const DEFAULT_CURRENCY = 'THB';
const RATES_SOURCE_URL =
	'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';

export const currencyCodes = Intl.supportedValuesOf('currency');

const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
const formatters = new Map<string, Intl.NumberFormat | null>();

function currencyFormatter(code: string) {
	if (!formatters.has(code)) {
		try {
			formatters.set(
				code,
				new Intl.NumberFormat(NUMBER_LOCALE, {
					style: 'currency',
					currency: code,
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				}),
			);
		} catch {
			formatters.set(code, null);
		}
	}
	return formatters.get(code);
}

export function currencyName(code: string) {
	if (!code) return 'No currency';
	try {
		return displayNames.of(code) ?? code;
	} catch {
		return code;
	}
}

export function currencySymbol(code: string) {
	if (!code) return '';
	return (
		currencyFormatter(code)
			?.formatToParts(0)
			.find((part) => part.type === 'currency')?.value ?? code
	);
}

export function formatAmount(value: number, code: string) {
	if (!code) return formatDecimal(value);
	return (
		currencyFormatter(code)?.format(value) ?? `${code} ${formatDecimal(value)}`
	);
}

/** Orders currency codes alphabetically, with no-currency last. */
export function compareCurrency(a: string, z: string) {
	return !a ? 1 : !z ? -1 : a.localeCompare(z);
}

export const lastCurrency = {
	get() {
		return localStorage.getItem(LS_LAST_CURRENCY_KEY) ?? DEFAULT_CURRENCY;
	},
	set(code: string) {
		localStorage.setItem(LS_LAST_CURRENCY_KEY, code);
	},
};

/**
 * Fetches today's rates into `target`.
 * @returns Rates keyed by source currency code, as `1 source = rate target`
 */
export async function fetchRatesTo(target: string) {
	const base = target.toLowerCase();
	const response = await fetch(`${RATES_SOURCE_URL}/${base}.json`);
	if (!response.ok) throw new Error(`Rates request failed: ${response.status}`);

	const json = (await response.json()) as {
		date: string;
		[base: string]: string | Record<string, number>;
	};
	const rates: Record<string, number> = {};
	for (const [code, perTarget] of Object.entries(
		json[base] as Record<string, number>,
	)) {
		if (perTarget > 0) {
			rates[code.toUpperCase()] = 1 / perTarget;
		}
	}
	return { date: json.date, rates };
}
