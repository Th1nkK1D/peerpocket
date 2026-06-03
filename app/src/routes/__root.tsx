import { CssBaseline } from '@mui/material';
import { amber, deepPurple, grey, orange } from '@mui/material/colors';
import GlobalStyles from '@mui/material/GlobalStyles';
import {
	createTheme,
	StyledEngineProvider,
	ThemeProvider,
	useColorScheme,
} from '@mui/material/styles';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import PwaCachePrompt from '../components/pwa-cache-prompt';

const theme = createTheme({
	colorSchemes: {
		light: {
			palette: {
				primary: {
					main: deepPurple[500],
				},
				secondary: {
					main: amber[800],
				},
			},
		},
		dark: {
			palette: {
				primary: {
					main: deepPurple[300],
				},
				secondary: {
					main: orange[600],
				},
			},
		},
	},
	cssVariables: {
		colorSchemeSelector: 'class',
	},

	shape: {
		borderRadius: 12,
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 24,
					textTransform: 'none',
				},
			},
		},
	},
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
				<MetaThemeColor />
				<PwaCachePrompt />
				<Outlet />
			</ThemeProvider>
		</StyledEngineProvider>
	);
}

function MetaThemeColor() {
	const { mode } = useColorScheme();

	useEffect(() => {
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', mode === 'dark' ? grey[900] : deepPurple[500]);
	}, [mode]);

	return null;
}
