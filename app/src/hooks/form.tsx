import type { PropsOf } from '@emotion/react';
import { Button, TextField as MuiTextField } from '@mui/material';
import {
	createFormHook,
	createFormHookContexts,
	useStore,
} from '@tanstack/react-form';

const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

function TextField(props: PropsOf<typeof MuiTextField>) {
	const field = useFieldContext();

	return (
		<MuiTextField
			name={field.name}
			value={field.state.value}
			onChange={(e) => field.handleChange(e.target.value)}
			onBlur={field.handleBlur}
			error={!field.state.meta.isValid}
			helperText={field.state.meta.errors.map((e) => e.message).at(0)}
			{...props}
		></MuiTextField>
	);
}

function SubmitButton(props: PropsOf<typeof Button>) {
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
	},
	formComponents: {
		SubmitButton,
	},
});

export const useMuiForm = formHook.useAppForm;
