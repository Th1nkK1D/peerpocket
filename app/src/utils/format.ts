import dayjs from 'dayjs';

/** Number locale for every amount shown or typed; amount inputs parse its `,` grouping. */
export const NUMBER_LOCALE = 'th-TH';

export function formatDecimal(value: number, minimumFractionDigits = 2) {
	return value.toLocaleString(NUMBER_LOCALE, {
		minimumFractionDigits,
		maximumFractionDigits: 2,
	});
}

export function roundToTwoDecimal(value: number): number {
	return Math.round(value * 100) / 100;
}

export function formatRelativeDay(date?: string | number) {
	const day = dayjs(date);
	const daysAgo = dayjs().startOf('day').diff(day.startOf('day'), 'day');
	if (daysAgo === 0) return 'today';
	if (daysAgo === 1) return 'yesterday';
	return day.format(day.year() === dayjs().year() ? 'D MMM' : 'D MMM YYYY');
}
