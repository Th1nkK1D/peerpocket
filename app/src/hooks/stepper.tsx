import { Step, StepLabel, Stepper } from '@mui/material';
import { type PropsWithChildren, useState } from 'react';

interface StepperViewProps {
	steps: string[];
	activeStep: number;
	className?: string;
}

export function useStepper(steps: string[]) {
	const [activeStep, setActiveStep] = useState(0);

	return { activeStep, setActiveStep, stepperProps: { steps, activeStep } };
}

export function StepperView({
	steps,
	activeStep,
	children,
	className = '',
}: PropsWithChildren<StepperViewProps>) {
	return (
		<div className={`flex flex-1 flex-col gap-4 ${className}`}>
			<Stepper activeStep={activeStep}>
				{steps.map((label) => {
					const stepProps: { completed?: boolean } = {};
					const labelProps: {
						optional?: React.ReactNode;
					} = {};
					return (
						<Step key={label} {...stepProps}>
							<StepLabel {...labelProps}>{label}</StepLabel>
						</Step>
					);
				})}
			</Stepper>
			{children}
		</div>
	);
}

export function StepNavigations({ children }: PropsWithChildren) {
	return (
		<div className="mt-auto flex flex-row justify-between">{children}</div>
	);
}
