export function formatDecimal(value: number, minimumFractionDigits = 2) {
	return value.toLocaleString('th-TH', {
		minimumFractionDigits,
		maximumFractionDigits: 2,
	});
}

export function roundToTwoDecimal(value: number): number {
	return Math.round(value * 100) / 100;
}
