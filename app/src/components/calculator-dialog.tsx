import { BackspaceOutlined, Check, Close } from '@mui/icons-material';
import {
	AppBar,
	Box,
	Button,
	Dialog,
	IconButton,
	Slide,
	Toolbar,
	Typography,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import {
	forwardRef,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

const Transition = forwardRef(function Transition(
	props: TransitionProps & {
		children: React.ReactElement<unknown>;
	},
	ref: React.Ref<unknown>,
) {
	return <Slide direction="up" ref={ref} {...props} />;
});

interface CalculatorDialogProps {
	open: boolean;
	value: number;
	onConfirm: (value: number) => void;
	onClose: () => void;
}

type Operator = '+' | '-' | '×' | '÷';

/** Gap kept between the caret and the edges of the scrolling display. */
const CARET_MARGIN = 12;
const EDGE_SCROLL_ZONE = 32;
const EDGE_SCROLL_STEP = 16;

/** Horizontal scroller without a visible scrollbar. */
const SCROLLER_CLASS =
	'overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function CalculatorDialog({
	open,
	value,
	onConfirm,
	onClose,
}: CalculatorDialogProps) {
	const [expression, setExpression] = useState(() => formatInput(value));
	const [cursor, setCursor] = useState(() => formatInput(value).length);
	const [secondaryDisplay, setSecondaryDisplay] = useState('');
	const [isResult, setIsResult] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	const displayRef = useRef<HTMLDivElement>(null);
	const caretRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (open) {
			const initial = formatInput(value);
			setExpression(initial);
			setCursor(initial.length);
			setSecondaryDisplay('');
			setIsResult(false);
		}
	}, [open, value]);

	const displayChars = useMemo(
		() => buildDisplayChars(expression),
		[expression],
	);
	const caretIndex = useMemo(() => {
		const index = displayChars.findIndex((char) => char.source >= cursor);
		return index === -1 ? displayChars.length : index;
	}, [displayChars, cursor]);

	useLayoutEffect(() => {
		const container = displayRef.current;
		const caret = caretRef.current;
		if (!container || !caret) return;

		// Typing pushes the expression to overflow on the left, newest digits stay visible.
		if (caretIndex === displayChars.length) {
			container.scrollLeft = container.scrollWidth;
			return;
		}

		const containerRect = container.getBoundingClientRect();
		const caretRect = caret.getBoundingClientRect();
		const overflowRight = caretRect.right + CARET_MARGIN - containerRect.right;
		const overflowLeft = containerRect.left + CARET_MARGIN - caretRect.left;

		if (overflowRight > 0) {
			container.scrollLeft += overflowRight;
		} else if (overflowLeft > 0) {
			container.scrollLeft -= overflowLeft;
		}
	}, [displayChars, caretIndex]);

	const reset = useCallback(() => {
		setExpression('0');
		setCursor(1);
		setSecondaryDisplay('');
		setIsResult(false);
	}, []);

	const handleDigit = useCallback(
		(digit: string) => {
			if (isResult) {
				setExpression(digit);
				setCursor(1);
				setSecondaryDisplay('');
				setIsResult(false);
				return;
			}

			const [start, end] = operandBounds(expression, cursor);
			if (expression.slice(start, end) === '0') {
				setExpression(replaceRange(expression, start, end, digit));
				setCursor(start + 1);
				return;
			}

			setExpression(replaceRange(expression, cursor, cursor, digit));
			setCursor(cursor + 1);
		},
		[cursor, expression, isResult],
	);

	const handleDecimal = useCallback(() => {
		if (isResult) {
			setExpression('0.');
			setCursor(2);
			setSecondaryDisplay('');
			setIsResult(false);
			return;
		}

		const [start, end] = operandBounds(expression, cursor);
		const operand = expression.slice(start, end);
		if (operand.includes('.')) return;

		const inserted = operand ? '.' : '0.';
		setExpression(replaceRange(expression, cursor, cursor, inserted));
		setCursor(cursor + inserted.length);
	}, [cursor, expression, isResult]);

	const handleBackspace = useCallback(() => {
		if (isResult) {
			reset();
			return;
		}
		if (cursor === 0) return;

		const next = replaceRange(expression, cursor - 1, cursor, '');
		setExpression(next || '0');
		setCursor(next ? cursor - 1 : 1);
	}, [cursor, expression, isResult, reset]);

	const handleOperator = useCallback(
		(operator: Operator) => {
			if (isResult) {
				setExpression(expression + operator);
				setCursor(expression.length + 1);
				setSecondaryDisplay('');
				setIsResult(false);
				return;
			}

			if (cursor === 0) return;

			if (OPERATORS.has(expression[cursor - 1])) {
				setExpression(replaceRange(expression, cursor - 1, cursor, operator));
				return;
			}

			setExpression(replaceRange(expression, cursor, cursor, operator));
			setCursor(cursor + 1);
		},
		[cursor, expression, isResult],
	);

	const handleEquals = useCallback(() => {
		const result = evaluateExpression(expression);
		if (result === null) return;

		const resultText = String(result);
		setSecondaryDisplay(`${formatExpression(expression)}=`);
		setExpression(resultText);
		setCursor(resultText.length);
		setIsResult(true);
	}, [expression]);

	const handleConfirm = useCallback(() => {
		const result = evaluateExpression(expression);
		onConfirm(result ?? 0);
	}, [expression, onConfirm]);

	const moveCaretToPointer = useCallback((clientX: number) => {
		const container = displayRef.current;
		if (!container) return;

		// Reveal hidden characters when dragging against either edge.
		const containerRect = container.getBoundingClientRect();
		if (clientX > containerRect.right - EDGE_SCROLL_ZONE) {
			container.scrollLeft += EDGE_SCROLL_STEP;
		} else if (clientX < containerRect.left + EDGE_SCROLL_ZONE) {
			container.scrollLeft -= EDGE_SCROLL_STEP;
		}

		const spans = Array.from(
			container.querySelectorAll<HTMLElement>('[data-source]'),
		);
		if (spans.length === 0) return;

		let nearest = 0;
		let nearestDistance = Number.POSITIVE_INFINITY;

		for (const span of spans) {
			const rect = span.getBoundingClientRect();
			const source = Number(span.dataset.source);
			for (const [edge, position] of [
				[rect.left, source],
				[rect.right, source + 1],
			]) {
				const distance = Math.abs(clientX - edge);
				if (distance < nearestDistance) {
					nearestDistance = distance;
					nearest = position;
				}
			}
		}

		setCursor(nearest);
	}, []);

	const handleCaretPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		event.currentTarget.setPointerCapture(event.pointerId);
		setIsDragging(true);
		moveCaretToPointer(event.clientX);
	};

	const handleCaretPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		moveCaretToPointer(event.clientX);
	};

	const handleCaretPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		setIsDragging(false);
	};

	const canConfirm = evaluateExpression(expression) !== null;
	const hasPendingCalculation =
		!isResult && [...expression].some((char) => OPERATORS.has(char));

	return (
		<Dialog
			fullScreen
			open={open}
			onClose={onClose}
			slots={{ transition: Transition }}
			slotProps={{
				paper: {
					sx: { bgcolor: 'background.default' },
				},
			}}
		>
			<AppBar position="sticky">
				<Toolbar className="justify-between">
					<IconButton color="inherit" onClick={onClose} aria-label="Close">
						<Close />
					</IconButton>
					<Button
						onClick={handleConfirm}
						disabled={!canConfirm}
						color="inherit"
						variant="text"
					>
						Apply
					</Button>
				</Toolbar>
			</AppBar>

			<Box className="flex flex-1 flex-col gap-3 p-4">
				<div className="py-4">
					<div className={SCROLLER_CLASS}>
						<Typography
							component="div"
							variant="body1"
							color="text.secondary"
							className="w-max min-w-full pr-1 text-right"
						>
							{secondaryDisplay || <span>&nbsp;</span>}
						</Typography>
					</div>

					<div
						ref={displayRef}
						data-testid="calculator-display"
						onPointerDown={handleCaretPointerDown}
						onPointerMove={handleCaretPointerMove}
						onPointerUp={handleCaretPointerUp}
						onPointerCancel={handleCaretPointerUp}
						className={`touch-none select-none py-1 ${SCROLLER_CLASS}`}
					>
						<Typography
							component="div"
							variant="h2"
							fontWeight={500}
							fontFamily="monospace"
							className="flex w-max min-w-full items-center justify-end pr-1"
						>
							{displayChars.slice(0, caretIndex).map((char) => (
								<DisplayChar key={displayCharKey(char)} char={char} />
							))}
							<Box
								component="span"
								ref={caretRef}
								className="inline-block h-[1.1em] w-0.5 shrink-0 rounded-full [font:inherit]"
								sx={{
									bgcolor: 'primary.main',
									animation: isDragging
										? 'none'
										: 'calculator-caret-blink 1.1s step-end infinite',
									'@keyframes calculator-caret-blink': {
										'0%, 49%': { opacity: 1 },
										'50%, 100%': { opacity: 0 },
									},
								}}
							/>
							{displayChars.slice(caretIndex).map((char) => (
								<DisplayChar key={displayCharKey(char)} char={char} />
							))}
						</Typography>
					</div>
				</div>

				<Box className="grid grid-cols-4 gap-2">
					<CalButton onClick={reset} color="error">
						AC
					</CalButton>
					<div className="col-span-2" />
					<CalButton onClick={() => handleOperator('÷')} color="secondary">
						÷
					</CalButton>

					<CalButton onClick={() => handleDigit('7')}>7</CalButton>
					<CalButton onClick={() => handleDigit('8')}>8</CalButton>
					<CalButton onClick={() => handleDigit('9')}>9</CalButton>
					<CalButton onClick={() => handleOperator('×')} color="secondary">
						×
					</CalButton>

					<CalButton onClick={() => handleDigit('4')}>4</CalButton>
					<CalButton onClick={() => handleDigit('5')}>5</CalButton>
					<CalButton onClick={() => handleDigit('6')}>6</CalButton>
					<CalButton onClick={() => handleOperator('-')} color="secondary">
						-
					</CalButton>

					<CalButton onClick={() => handleDigit('1')}>1</CalButton>
					<CalButton onClick={() => handleDigit('2')}>2</CalButton>
					<CalButton onClick={() => handleDigit('3')}>3</CalButton>
					<CalButton onClick={() => handleOperator('+')} color="secondary">
						+
					</CalButton>

					<CalButton onClick={() => handleDigit('0')}>0</CalButton>
					<CalButton onClick={handleDecimal}>.</CalButton>
					<CalButton onClick={handleBackspace} label="Backspace">
						<BackspaceOutlined />
					</CalButton>
					{hasPendingCalculation ? (
						<CalButton
							onClick={handleEquals}
							color="primary"
							disabled={!canConfirm}
							label="Calculate"
						>
							=
						</CalButton>
					) : (
						<CalButton
							onClick={handleConfirm}
							color="primary"
							disabled={!canConfirm}
							label="Apply value"
						>
							<Check />
						</CalButton>
					)}
				</Box>
			</Box>
		</Dialog>
	);
}

function DisplayChar({ char }: { char: DisplayCharacter }) {
	return (
		// The global `span` base style would otherwise drop the display typography.
		<span
			className="[font:inherit] [letter-spacing:inherit]"
			data-source={char.isSeparator ? undefined : char.source}
		>
			{char.char}
		</span>
	);
}

interface CalButtonProps {
	onClick: () => void;
	color?: 'primary' | 'secondary' | 'error' | 'inherit';
	className?: string;
	disabled?: boolean;
	label?: string;
	children: ReactNode;
}

function CalButton({
	onClick,
	color = 'inherit',
	className = '',
	disabled = false,
	label,
	children,
}: CalButtonProps) {
	return (
		<Button
			variant="contained"
			color={color}
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			className={`min-h-0 ${className}`}
			sx={{
				width: '100%',
				aspectRatio: '1',
				borderRadius: '50%',
				minHeight: 0,
				fontSize: '1.5rem',
				fontWeight: 600,
				textTransform: 'none',
				boxShadow: 'none',
			}}
		>
			{children}
		</Button>
	);
}

const OPERATORS = new Set(['+', '-', '×', '÷']);

interface DisplayCharacter {
	char: string;
	/** Index in the raw expression this character belongs to. */
	source: number;
	/** True for grouping separators, which have no raw expression counterpart. */
	isSeparator: boolean;
}

function displayCharKey(char: DisplayCharacter): string {
	return `${char.source}-${char.isSeparator ? 'separator' : 'char'}`;
}

function buildDisplayChars(expression: string): DisplayCharacter[] {
	const chars: DisplayCharacter[] = [];
	let buffer = '';
	let bufferStart = 0;

	function flushBuffer() {
		if (!buffer) return;
		let offset = 0;
		for (const char of formatNumberBuffer(buffer)) {
			const isSeparator = char !== buffer[offset];
			chars.push({ char, source: bufferStart + offset, isSeparator });
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

function operandBounds(expression: string, cursor: number): [number, number] {
	let start = cursor;
	while (start > 0 && !OPERATORS.has(expression[start - 1])) start--;

	let end = cursor;
	while (end < expression.length && !OPERATORS.has(expression[end])) end++;

	return [start, end];
}

function replaceRange(
	expression: string,
	start: number,
	end: number,
	inserted: string,
): string {
	return expression.slice(0, start) + inserted + expression.slice(end);
}

function formatInput(value: number): string {
	if (!value) return '0';
	const str = value.toString();
	if (str.includes('e')) return value.toFixed(2);
	return str;
}

function formatExpression(expression: string): string {
	return buildDisplayChars(expression)
		.map(({ char }) => char)
		.join('');
}

function formatNumberBuffer(buf: string): string {
	const [intPart, decPart] = buf.split('.');
	const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return decPart !== undefined ? `${groupedInt}.${decPart}` : groupedInt;
}

function evaluateExpression(expr: string): number | null {
	// Tokenize: split into numbers and operators
	const tokens: (number | Operator)[] = [];
	let num = '';

	for (const ch of expr) {
		if (OPERATORS.has(ch)) {
			if (num) {
				const parsed = parseFloat(num);
				if (!Number.isFinite(parsed)) return null;
				tokens.push(parsed);
				num = '';
			}
			tokens.push(ch as Operator);
		} else {
			num += ch;
		}
	}

	if (num) {
		const parsed = parseFloat(num);
		if (!Number.isFinite(parsed)) return null;
		tokens.push(parsed);
	}

	if (tokens.length === 0) return null;
	if (tokens.length === 1) {
		return typeof tokens[0] === 'number' ? tokens[0] : null;
	}

	// Process × and ÷ first (higher precedence)
	const reduced: (number | '+' | '-')[] = [];
	let i = 0;

	while (i < tokens.length) {
		const token = tokens[i];

		if (typeof token === 'number') {
			let result = token;
			while (
				i + 2 < tokens.length &&
				(tokens[i + 1] === '×' || tokens[i + 1] === '÷')
			) {
				const op = tokens[i + 1] as Operator;
				const right = tokens[i + 2];
				if (typeof right !== 'number') break;
				result = op === '×' ? result * right : right === 0 ? 0 : result / right;
				i += 2;
			}
			reduced.push(result);
		} else {
			reduced.push(token as '+' | '-');
		}
		i++;
	}

	// Process + and -
	let result = reduced[0] as number;
	for (let j = 1; j < reduced.length; j += 2) {
		const op = reduced[j];
		const right = reduced[j + 1] as number;
		result = op === '+' ? result + right : result - right;
	}

	const rounded = Math.round(result * 100) / 100;
	return Number.isFinite(rounded) ? rounded : null;
}
