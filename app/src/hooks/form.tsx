import {
	Button,
	FormControlLabel,
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
import { type ComponentProps, useState } from 'react';

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

function CurrencyField(props: ComponentProps<typeof BaseCurrencyField>) {
	const field = useFieldContext<number>();
	const [isFocused, setIsFocus] = useState(false);

	return (
		<BaseCurrencyField
			name={field.name}
			value={
				isFocused ? field.state.value || '' : formatDecimal(field.state.value)
			}
			error={!field.state.meta.isValid}
			helperText={field.state.meta.errors.map((e) => e.message).at(0)}
			onChange={(e) => field.handleChange(+e.target.value.replaceAll(',', ''))}
			onFocus={() => setIsFocus(true)}
			onBlur={() => {
				setIsFocus(false);
				field.handleBlur();
			}}
			{...props}
		></BaseCurrencyField>
	);
}

export function BaseCurrencyField(props: ComponentProps<typeof MuiTextField>) {
	return (
		<MuiTextField
			slotProps={{
				input: {
					endAdornment: <InputAdornment position="end">THB</InputAdornment>,
				},
				htmlInput: {
					className: 'text-right',
				},
			}}
			{...props}
		></MuiTextField>
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
		SelectField,
		DateField,
		Checkbox,
	},
	formComponents: {
		SubmitButton,
	},
}).useAppForm;

export function formatDecimal(value: number) {
	return value.toLocaleString('th-TH', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}
