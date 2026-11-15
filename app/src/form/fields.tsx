import { CalculateOutlined } from '@mui/icons-material';
import {
	Autocomplete,
	Button,
	FormControlLabel,
	IconButton,
	InputAdornment,
	MenuItem,
	Checkbox as MuiCheckbox,
	TextField as MuiTextField,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
	createFormHook,
	createFormHookContexts,
	useStore,
} from '@tanstack/react-form';
import type { Dayjs } from 'dayjs';
import { type ComponentProps, useEffect, useState } from 'react';

import { currencyCodes, currencyName, currencySymbol } from '../utils/currency';
import { formatDecimal, roundToTwoDecimal } from '../utils/format';
import { CalculatorDialog } from './calculator-dialog';

const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

function TextField(props: ComponentProps<typeof MuiTextField>) {
	const field = useFieldContext<string>();

	return (
		<MuiTextField
			name={field.name}
			value={field.state.value}
			error={!field.state.meta.isValid}
			helperText={field.state.meta.errors.map((e) => e.message).at(0)}
			onChange={(e) => field.handleChange(e.target.value)}
			onBlur={field.handleBlur}
			slotProps={{
				input: {
					autoComplete: field.name,
				},
			}}
			{...props}
		></MuiTextField>
	);
}

function CurrencyField(props: ComponentProps<typeof MuiTextField>) {
	const field = useFieldContext<number>();
	const [temporaryValue, setTemporaryValue] = useState<string | null>(null);
	const [calculatorOpen, setCalculatorOpen] = useState(false);

	useEffect(() => {
		setTemporaryValue(formatDecimal(field.state.value, 0));
	}, [field.state.value]);

	function handleCalculatorConfirm(value: number) {
		const rounded = roundToTwoDecimal(value);
		field.handleChange(rounded);
		setTemporaryValue(formatDecimal(rounded, 0));
		setCalculatorOpen(false);
	}

	return (
		<>
			<MuiTextField
				name={field.name}
				value={temporaryValue ?? formatDecimal(field.state.value)}
				error={!field.state.meta.isValid}
				helperText={field.state.meta.errors.map((e) => e.message).at(0)}
				onChange={(e) => setTemporaryValue(e.target.value)}
				onFocus={() => {
					setTemporaryValue(
						field.state.value ? formatDecimal(field.state.value, 0) : '',
					);
				}}
				onBlur={() => {
					if (temporaryValue) {
						field.handleChange(
							roundToTwoDecimal(+temporaryValue.replaceAll(',', '')),
						);
					}
					field.handleBlur();
				}}
				{...props}
				slotProps={{
					...props.slotProps,
					input: {
						...props.slotProps?.input,
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									edge="end"
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										setCalculatorOpen(true);
									}}
									aria-label="Open calculator"
								>
									<CalculateOutlined fontSize="small" />
								</IconButton>
							</InputAdornment>
						),
					},
				}}
			></MuiTextField>
			<CalculatorDialog
				open={calculatorOpen}
				value={field.state.value}
				onConfirm={handleCalculatorConfirm}
				onClose={() => setCalculatorOpen(false)}
			/>
		</>
	);
}

function CurrencyPickerField({ label }: { label: string }) {
	const field = useFieldContext<string>();

	return (
		<Autocomplete
			autoHighlight
			options={currencyCodes}
			value={field.state.value || null}
			onChange={(_, value) => field.handleChange(value ?? '')}
			onBlur={field.handleBlur}
			getOptionLabel={(code) => {
				const symbol = currencySymbol(code);
				return `${symbol === code ? '' : `${symbol} `}${code} · ${currencyName(code)}`;
			}}
			renderInput={(params) => (
				<MuiTextField
					{...params}
					name={field.name}
					label={label}
					error={!field.state.meta.isValid}
					helperText={field.state.meta.errors.map((e) => e.message).at(0)}
				/>
			)}
		/>
	);
}

interface SelectFieldProps extends ComponentProps<typeof MuiTextField> {
	options: { label: string; value: string }[];
}

function SelectField({ options, ...textFieldProps }: SelectFieldProps) {
	return (
		<TextField select {...textFieldProps}>
			{options.map((option) => (
				<MenuItem key={option.value} value={option.value}>
					{option.label}
				</MenuItem>
			))}
		</TextField>
	);
}

function DateField(props: ComponentProps<typeof DatePicker>) {
	const field = useFieldContext<Dayjs | null>();

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<DatePicker
				value={field.state.value}
				onChange={field.handleChange}
				slotProps={{
					textField: {
						error: !field.state.meta.isValid,
						helperText: field.state.meta.errors.map((e) => e.message).at(0),
					},
				}}
				{...props}
			/>
		</LocalizationProvider>
	);
}

interface CheckboxProps extends ComponentProps<typeof MuiCheckbox> {
	label: string;
}

function Checkbox({ label, ...rest }: CheckboxProps) {
	const field = useFieldContext<boolean>();

	return (
		<FormControlLabel
			control={
				<MuiCheckbox
					checked={field.state.value}
					onChange={(e) => field.handleChange(e.target.checked)}
					{...rest}
				/>
			}
			label={label}
		/>
	);
}

function SubmitButton(props: ComponentProps<typeof Button>) {
	const form = useFormContext();
	const disabled = useStore(
		form.store,
		(state) => !state.isDirty || !state.canSubmit,
	);

	return (
		<Button
			type="submit"
			variant="contained"
			disabled={disabled}
			{...props}
		></Button>
	);
}

export const useMuiForm = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		CurrencyField,
		CurrencyPickerField,
		SelectField,
		DateField,
		Checkbox,
	},
	formComponents: {
		SubmitButton,
	},
}).useAppForm;
