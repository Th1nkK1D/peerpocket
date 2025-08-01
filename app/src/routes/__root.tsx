import { CssBaseline } from '@mui/material';
import GlobalStyles from '@mui/material/GlobalStyles';
import {
	createTheme,
	StyledEngineProvider,
	ThemeProvider,
} from '@mui/material/styles';
import { createRootRoute, Outlet } from '@tanstack/react-router';

const theme = createTheme({
	colorSchemes: {
		light: true,
		dark: true,
	},
	cssVariables: true,
});

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<StyledEngineProvider enableCssLayer>
			<GlobalStyles styles="@layer theme, base, mui, components, utilities;" />

			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Outlet />
			</ThemeProvider>
		</StyledEngineProvider>
	);
}
