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

type Operator = '+' | '-' | '×' | '÷' | null;

export function CalculatorDialog({
	open,
	value,
	onConfirm,
	onClose,
}: CalculatorDialogProps) {
	const [display, setDisplay] = useState(() => formatInput(value));
	const [previousValue, setPreviousValue] = useState<number | null>(null);
	const [operator, setOperator] = useState<Operator>(null);
	const [waitingForOperand, setWaitingForOperand] = useState(false);

	useEffect(() => {
		if (open) {
			setDisplay(formatInput(value));
			setPreviousValue(null);
			setOperator(null);
			setWaitingForOperand(false);
		}
	}, [open, value]);

	const reset = useCallback(() => {
		setDisplay('0');
		setPreviousValue(null);
		setOperator(null);
		setWaitingForOperand(false);
	}, []);

	const handleDigit = useCallback(
		(digit: string) => {
			if (waitingForOperand) {
				setDisplay(digit);
				setWaitingForOperand(false);
			} else {
				setDisplay((prev) => (prev === '0' ? digit : prev + digit));
			}
		},
		[waitingForOperand],
	);

	const handleDecimal = useCallback(() => {
		if (waitingForOperand) {
			setDisplay('0.');
			setWaitingForOperand(false);
			return;
		}
		if (!display.includes('.')) {
			setDisplay((prev) => `${prev}.`);
		}
	}, [display, waitingForOperand]);

	const handleBackspace = useCallback(() => {
		setDisplay((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
	}, []);

	const calculate = useCallback(
		(left: number, right: number, op: Operator): number => {
			switch (op) {
				case '+':
					return left + right;
				case '-':
					return left - right;
				case '×':
					return left * right;
				case '÷':
					return right === 0 ? 0 : left / right;
				default:
					return right;
			}
		},
		[],
	);

	const handleOperator = useCallback(
		(nextOp: Operator) => {
			const currentValue = parseFloat(display.replaceAll(',', ''));

			if (previousValue !== null && operator && !waitingForOperand) {
				const result = calculate(previousValue, currentValue, operator);
				setDisplay(formatResult(result));
				setPreviousValue(result);
			} else {
				setPreviousValue(currentValue);
			}

			setOperator(nextOp);
			setWaitingForOperand(true);
		},
		[display, previousValue, operator, waitingForOperand, calculate],
	);

	const handleEquals = useCallback(() => {
		if (previousValue === null || !operator) return;

		const currentValue = parseFloat(display.replaceAll(',', ''));
		const result = calculate(previousValue, currentValue, operator);
		setDisplay(formatResult(result));
		setPreviousValue(null);
		setOperator(null);
		setWaitingForOperand(true);
	}, [display, previousValue, operator, calculate]);

	const handleConfirm = useCallback(() => {
		const result = parseFloat(display.replaceAll(',', ''));
		onConfirm(Number.isFinite(result) ? result : 0);
	}, [display, onConfirm]);

	const numericValue = parseFloat(display.replaceAll(',', ''));
	const canConfirm = Number.isFinite(numericValue);

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
						Done
					</Button>
				</Toolbar>
			</AppBar>

			<Box className="flex flex-1 flex-col gap-3 p-4">
				<div className="p-4 text-right">
					<Typography variant="body1" color="text.secondary">
						{previousValue !== null && operator ? (
							`${formatResult(previousValue)} ${operator}`
						) : (
							<span>&nbsp;</span>
						)}
					</Typography>

					<Typography variant="h2" fontWeight={500} fontFamily="monospace">
						{formatDisplay(display)}
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

function formatInput(value: number): string {
	if (!value) return '0';
	const str = value.toString();
	// Avoid scientific notation for display
	if (str.includes('e')) return value.toFixed(2);
	return str;
}

function formatDisplay(value: string): string {
	const [intPart, decPart] = value.split('.');
	const formattedInt = Number.parseInt(intPart, 10).toLocaleString(undefined);
	return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

function formatResult(value: number): string {
	if (!Number.isFinite(value)) return '0';
	const rounded = Math.round(value * 100) / 100;
	return rounded.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
