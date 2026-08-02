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
import type {
	KeyboardEvent as ReactKeyboardEvent,
	ReactNode,
	PointerEvent as ReactPointerEvent,
} from 'react';
import {
	forwardRef,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	buildDisplayChars,
	type DisplayCharacter,
	displayCharKey,
	evaluateExpression,
	formatExpression,
	formatInput,
	OPERATORS,
	type Operator,
	operandBounds,
	replaceRange,
} from '../utils/calculator';

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

/** Gap kept between the caret and the edges of the scrolling display. */
const CARET_MARGIN = 12;
const EDGE_SCROLL_ZONE = 32;
const EDGE_SCROLL_STEP = 16;
const EDGE_SCROLL_INTERVAL = 60;

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
	const [cursor, setCursor] = useState(() => expression.length);
	const [secondaryDisplay, setSecondaryDisplay] = useState('');
	const [isResult, setIsResult] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	const displayRef = useRef<HTMLDivElement>(null);
	const secondaryRef = useRef<HTMLDivElement>(null);
	const caretRef = useRef<HTMLSpanElement>(null);
	const pointerXRef = useRef<number | null>(null);
	const valueRef = useRef(value);

	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	// Only reopening seeds the expression, so a syncing value cannot wipe input.
	useEffect(() => {
		if (!open) return;

		const initial = formatInput(valueRef.current);
		setExpression(initial);
		setCursor(initial.length);
		setSecondaryDisplay('');
		setIsResult(false);
	}, [open]);

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

	useLayoutEffect(() => {
		const container = secondaryRef.current;
		if (container && secondaryDisplay) {
			container.scrollLeft = container.scrollWidth;
		}
	}, [secondaryDisplay]);

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

			// At the start only + and - are meaningful, as the sign of the operand.
			if (cursor === 0 && operator !== '+' && operator !== '-') return;

			if (cursor > 0 && OPERATORS.has(expression[cursor - 1])) {
				setExpression(replaceRange(expression, cursor - 1, cursor, operator));
				return;
			}

			setExpression(replaceRange(expression, cursor, cursor, operator));
			setCursor(cursor + 1);
		},
		[cursor, expression, isResult],
	);

	const result = useMemo(() => evaluateExpression(expression), [expression]);

	const handleEquals = useCallback(() => {
		if (result === null) return;

		const resultText = String(result);
		setSecondaryDisplay(`${formatExpression(expression)}=`);
		setExpression(resultText);
		setCursor(resultText.length);
		setIsResult(true);
	}, [expression, result]);

	const handleConfirm = useCallback(() => {
		onConfirm(result ?? 0);
	}, [onConfirm, result]);

	/** Reveals hidden characters when the pointer rests against either edge. */
	const scrollTowardsEdge = useCallback((clientX: number) => {
		const container = displayRef.current;
		if (!container) return false;

		const containerRect = container.getBoundingClientRect();
		const before = container.scrollLeft;

		if (clientX > containerRect.right - EDGE_SCROLL_ZONE) {
			container.scrollLeft += EDGE_SCROLL_STEP;
		} else if (clientX < containerRect.left + EDGE_SCROLL_ZONE) {
			container.scrollLeft -= EDGE_SCROLL_STEP;
		}

		return container.scrollLeft !== before;
	}, []);

	const setCursorFromPointer = useCallback((clientX: number) => {
		const container = displayRef.current;
		if (!container) return;

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

	const moveCaretToPointer = useCallback(
		(clientX: number) => {
			scrollTowardsEdge(clientX);
			setCursorFromPointer(clientX);
		},
		[scrollTowardsEdge, setCursorFromPointer],
	);

	// Keep scrolling while the pointer is held still against an edge.
	useEffect(() => {
		if (!isDragging) return;

		const timer = setInterval(() => {
			const clientX = pointerXRef.current;
			if (clientX === null) return;
			if (scrollTowardsEdge(clientX)) setCursorFromPointer(clientX);
		}, EDGE_SCROLL_INTERVAL);

		return () => clearInterval(timer);
	}, [isDragging, scrollTowardsEdge, setCursorFromPointer]);

	const handleCaretPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		event.currentTarget.setPointerCapture(event.pointerId);
		pointerXRef.current = event.clientX;
		setIsDragging(true);
		moveCaretToPointer(event.clientX);
	};

	const handleCaretPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		pointerXRef.current = event.clientX;
		moveCaretToPointer(event.clientX);
	};

	const handleCaretPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		pointerXRef.current = null;
		setIsDragging(false);
	};

	const handleCaretKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
		const moves: Record<string, number> = {
			ArrowLeft: Math.max(0, cursor - 1),
			ArrowRight: Math.min(expression.length, cursor + 1),
			Home: 0,
			End: expression.length,
		};

		const next = moves[event.key];
		if (next === undefined) return;

		event.preventDefault();
		setCursor(next);
	};

	const canConfirm = result !== null;
	const hasPendingCalculation =
		!isResult &&
		[...expression].some((char, index) => index > 0 && OPERATORS.has(char));

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
					<div ref={secondaryRef} className={SCROLLER_CLASS}>
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
						// biome-ignore lint/a11y/useSemanticElements: an input cannot render the per-character spans the caret is positioned from
						role="textbox"
						aria-label="Expression"
						aria-readonly="true"
						tabIndex={0}
						onPointerDown={handleCaretPointerDown}
						onPointerMove={handleCaretPointerMove}
						onPointerUp={handleCaretPointerUp}
						onPointerCancel={handleCaretPointerUp}
						onLostPointerCapture={() => {
							pointerXRef.current = null;
							setIsDragging(false);
						}}
						onKeyDown={handleCaretKeyDown}
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
			className={className}
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
