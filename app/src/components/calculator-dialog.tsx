import { BackspaceOutlined, Close } from '@mui/icons-material';
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
import type { ReactNode } from 'react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

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

export function CalculatorDialog({
	open,
	value,
	onConfirm,
	onClose,
}: CalculatorDialogProps) {
	const [expression, setExpression] = useState(() => formatInput(value));
	const [secondaryDisplay, setSecondaryDisplay] = useState('');
	const [isResult, setIsResult] = useState(false);

	useEffect(() => {
		if (open) {
			setExpression(formatInput(value));
			setSecondaryDisplay('');
			setIsResult(false);
		}
	}, [open, value]);

	const reset = useCallback(() => {
		setExpression('0');
		setSecondaryDisplay('');
		setIsResult(false);
	}, []);

	const handleDigit = useCallback(
		(digit: string) => {
			if (isResult) {
				setExpression(digit);
				setSecondaryDisplay('');
				setIsResult(false);
			} else {
				setExpression((prev) => (prev === '0' ? digit : prev + digit));
			}
		},
		[isResult],
	);

	const handleDecimal = useCallback(() => {
		if (isResult) {
			setExpression('0.');
			setSecondaryDisplay('');
			setIsResult(false);
			return;
		}
		// Get current operand (after last operator)
		const lastOp = Math.max(
			expression.lastIndexOf('+'),
			expression.lastIndexOf('-'),
			expression.lastIndexOf('×'),
			expression.lastIndexOf('÷'),
		);
		const currentOperand = expression.slice(lastOp + 1);
		if (!currentOperand.includes('.')) {
			setExpression((prev) => `${prev}.`);
		}
	}, [expression, isResult]);

	const handleBackspace = useCallback(() => {
		if (isResult) {
			setExpression('0');
			setSecondaryDisplay('');
			setIsResult(false);
			return;
		}
		setExpression((prev) => {
			if (prev.length <= 1) return '0';
			return prev.slice(0, -1);
		});
	}, [isResult]);

	const handleOperator = useCallback(
		(op: Operator) => {
			const lastChar = expression.at(-1);
			const isOperator = (c: string) =>
				c === '+' || c === '-' || c === '×' || c === '÷';

			if (isResult) {
				setExpression(`${evaluateExpression(expression)}${op}`);
				setSecondaryDisplay('');
				setIsResult(false);
				return;
			}

			if (isOperator(lastChar ?? '')) {
				// Replace trailing operator
				setExpression((prev) => prev.slice(0, -1) + op);
			} else {
				setExpression((prev) => prev + op);
			}
		},
		[expression, isResult],
	);

	const handleEquals = useCallback(() => {
		const lastChar = expression.at(-1);
		const isOperator = (c: string) =>
			c === '+' || c === '-' || c === '×' || c === '÷';
		if (isOperator(lastChar ?? '')) return;

		const result = evaluateExpression(expression);
		if (result === null) return;

		setSecondaryDisplay(`${formatExpression(expression)}=`);
		setExpression(String(result));
		setIsResult(true);
	}, [expression]);

	const handleConfirm = useCallback(() => {
		const result = evaluateExpression(expression);
		onConfirm(result ?? 0);
	}, [expression, onConfirm]);

	const displayValue = isResult
		? formatNumber(expression)
		: formatExpression(expression);
	const canConfirm = evaluateExpression(expression) !== null;

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
				<div className="p-4 text-right">
					<Typography variant="body1" color="text.secondary">
						{secondaryDisplay || <span>&nbsp;</span>}
					</Typography>

					<Typography variant="h2" fontWeight={500} fontFamily="monospace">
						{displayValue}
					</Typography>
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
					<CalButton onClick={handleBackspace}>
						<BackspaceOutlined />
					</CalButton>
					<CalButton onClick={handleEquals} color="primary">
						=
					</CalButton>
				</Box>
			</Box>
		</Dialog>
	);
}

interface CalButtonProps {
	onClick: () => void;
	color?: 'primary' | 'secondary' | 'error' | 'inherit';
	className?: string;
	children: ReactNode;
}

function CalButton({
	onClick,
	color = 'inherit',
	className = '',
	children,
}: CalButtonProps) {
	return (
		<Button
			variant="contained"
			color={color}
			onClick={onClick}
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

function formatInput(value: number): string {
	if (!value) return '0';
	const str = value.toString();
	if (str.includes('e')) return value.toFixed(2);
	return str;
}

function formatNumber(value: string): string {
	const num = parseFloat(value);
	if (!Number.isFinite(num)) return value;
	const rounded = Math.round(num * 100) / 100;
	return rounded.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatExpression(expr: string): string {
	let result = '';
	let numberBuffer = '';

	for (const ch of expr) {
		if (OPERATORS.has(ch)) {
			if (numberBuffer) {
				result += formatNumberBuffer(numberBuffer);
				numberBuffer = '';
			}
			result += ch;
		} else {
			numberBuffer += ch;
		}
	}

	if (numberBuffer) {
		result += formatNumberBuffer(numberBuffer);
	}

	return result;
}

function formatNumberBuffer(buf: string): string {
	const [intPart, decPart] = buf.split('.');
	const formattedInt = Number.parseInt(intPart || '0', 10).toLocaleString(
		undefined,
	);
	return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
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
