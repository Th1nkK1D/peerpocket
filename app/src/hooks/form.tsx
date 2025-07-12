import {
	Button,
	InputAdornment,
	MenuItem,
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
import type { ComponentProps } from 'react';

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
	const field = useFieldContext<string>();

	return (
		<MuiTextField
			name={field.name}
			value={field.state.value}
			error={!field.state.meta.isValid}
			helperText={field.state.meta.errors.map((e) => e.message).at(0)}
			slotProps={{
				input: {
					startAdornment: <InputAdornment position="start">THB</InputAdornment>,
				},
			}}
			onChange={(e) => field.handleChange(e.target.value)}
			onFocus={() => field.handleChange(field.state.value.replaceAll(',', ''))}
			onBlur={() => {
				field.handleChange(
					(+field.state.value.replaceAll(',', '')).toLocaleString(undefined, {
						minimumFractionDigits: 0,
						maximumFractionDigits: 2,
					}),
				);
				field.handleBlur();
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

const formHook = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		CurrencyField,
		SelectField,
		DateField,
	},
	formComponents: {
		SubmitButton,
	},
});

export const useMuiForm = formHook.useAppForm;
