import { CssBaseline } from '@mui/material';
import {
	blueGrey,
	deepOrange,
	deepPurple,
	grey,
	indigo,
	orange,
} from '@mui/material/colors';
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

const primaryColor = { light: indigo[300], dark: deepPurple[200] };

const theme = createTheme({
	colorSchemes: {
		light: {
			palette: {
				primary: {
					main: primaryColor.light,
				},
				secondary: {
					main: deepOrange[400],
				},
				background: {
					default: blueGrey[50],
					paper: grey[50],
				},
			},
		},
		dark: {
			palette: {
				primary: {
					main: primaryColor.dark,
				},
				secondary: {
					main: orange[300],
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
		MuiAppBar: {
			defaultProps: {
				enableColorOnDark: true,
			},
			styleOverrides: {
				root: ({ theme }) =>
					theme.applyStyles('dark', {
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)',
					}),
			},
		},
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
	const { colorScheme } = useColorScheme();

	useEffect(() => {
		if (colorScheme) {
			document
				.querySelector('meta[name="theme-color"]')
				?.setAttribute('content', primaryColor[colorScheme]);
		}
	}, [colorScheme]);

	return null;
}
