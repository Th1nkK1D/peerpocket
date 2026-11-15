export type Operator = '+' | '-' | '×' | '÷';

export const OPERATORS = new Set<string>(['+', '-', '×', '÷']);

export interface DisplayCharacter {
	char: string;
	/** Index in the raw expression this character belongs to. */
	source: number;
	/** True for grouping separators, which have no raw expression counterpart. */
	isSeparator: boolean;
}

export function displayCharKey(char: DisplayCharacter): string {
	return `${char.source}-${char.isSeparator ? 'separator' : 'char'}`;
}

export function buildDisplayChars(expression: string): DisplayCharacter[] {
	const chars: DisplayCharacter[] = [];
	let buffer = '';
	let bufferStart = 0;

	function flushBuffer() {
		if (!buffer) return;
		let offset = 0;
		for (const char of formatNumberBuffer(buffer)) {
			const isSeparator = char !== buffer[offset];
			// Separators belong to the digit before them, so a caret placed after
			// that digit renders after the separator instead of splitting the group.
			chars.push({
				char,
				source: bufferStart + (isSeparator ? offset - 1 : offset),
				isSeparator,
			});
			if (!isSeparator) offset++;
		}
		buffer = '';
	}

	for (let index = 0; index < expression.length; index++) {
		const char = expression[index];
		if (OPERATORS.has(char)) {
			flushBuffer();
			chars.push({ char, source: index, isSeparator: false });
		} else {
			if (!buffer) bufferStart = index;
			buffer += char;
		}
	}
	flushBuffer();

	return chars;
}

export function operandBounds(
	expression: string,
	cursor: number,
): [number, number] {
	let start = cursor;
	while (start > 0 && !OPERATORS.has(expression[start - 1])) start--;

	let end = cursor;
	while (end < expression.length && !OPERATORS.has(expression[end])) end++;

	return [start, end];
}

export function replaceRange(
	expression: string,
	start: number,
	end: number,
	inserted: string,
): string {
	return expression.slice(0, start) + inserted + expression.slice(end);
}

/** Renders a stored amount as an editable expression, or `0` when unusable. */
export function formatInput(value: number): string {
	if (!Number.isFinite(value)) return '0';

	const rounded = roundToCents(value);
	if (!rounded || !Number.isSafeInteger(Math.trunc(rounded))) return '0';

	return rounded.toString();
}

export function formatExpression(expression: string): string {
	return buildDisplayChars(expression)
		.map(({ char }) => char)
		.join('');
}

function formatNumberBuffer(buf: string): string {
	const [intPart, decPart] = buf.split('.');
	const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return decPart !== undefined ? `${groupedInt}.${decPart}` : groupedInt;
}

function roundToCents(value: number): number {
	return Math.round(value * 100) / 100;
}

/** Evaluates an expression, returning null when it is incomplete or invalid. */
export function evaluateExpression(expr: string): number | null {
	const tokens: (number | Operator)[] = [];
	let num = '';

	for (const char of expr) {
		if (!OPERATORS.has(char)) {
			num += char;
			continue;
		}

		// A leading + or - signs the first operand instead of starting an operation.
		if (!num && tokens.length === 0 && (char === '+' || char === '-')) {
			num = char === '-' ? '-' : '';
			continue;
		}

		if (num) {
			const parsed = Number.parseFloat(num);
			if (!Number.isFinite(parsed)) return null;
			tokens.push(parsed);
			num = '';
		}
		tokens.push(char as Operator);
	}

	if (num) {
		const parsed = Number.parseFloat(num);
		if (!Number.isFinite(parsed)) return null;
		tokens.push(parsed);
	}

	if (tokens.length === 0) return null;

	// Process × and ÷ first (higher precedence)
	const reduced: (number | Operator)[] = [];
	let i = 0;

	while (i < tokens.length) {
		const token = tokens[i];

		if (typeof token !== 'number') {
			reduced.push(token);
			i++;
			continue;
		}

		let result = token;
		while (
			i + 2 < tokens.length &&
			(tokens[i + 1] === '×' || tokens[i + 1] === '÷')
		) {
			const operator = tokens[i + 1];
			const right = tokens[i + 2];
			if (typeof right !== 'number') return null;
			if (operator === '÷' && right === 0) return null;
			result = operator === '×' ? result * right : result / right;
			i += 2;
		}
		reduced.push(result);
		i++;
	}

	// Process + and -
	const first = reduced[0];
	if (typeof first !== 'number') return null;

	let result = first;
	for (let j = 1; j < reduced.length; j += 2) {
		const operator = reduced[j];
		const right = reduced[j + 1];
		if ((operator !== '+' && operator !== '-') || typeof right !== 'number') {
			return null;
		}
		result = operator === '+' ? result + right : result - right;
	}

	const rounded = roundToCents(result);
	return Number.isFinite(rounded) ? rounded : null;
}
