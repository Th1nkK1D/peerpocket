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
import {
	ClientOnly,
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
	useLocation,
} from '@tanstack/react-router';
import { type ReactNode, useEffect } from 'react';
import '@fontsource-variable/grandstander';

import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
import '../index.css';
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
	ssr: true,
	head: () => ({
		meta: [
			{ charSet: 'UTF-8' },
			{ name: 'viewport', content: 'initial-scale=1, width=device-width' },
			{ title: 'PeerPocket - Your peer-to-peer expense tracker' },
			{
				name: 'description',
				content: 'A peer-to-peer expense tracker where your data stays yours',
			},
			{ name: 'theme-color', content: '#000000' },
		],
		links: [
			{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
			{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
			...(import.meta.env.PROD
				? [{ rel: 'manifest', href: '/manifest.webmanifest' }]
				: []),
		],
	}),
	shellComponent: RootDocument,
	component: RootComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent() {
	const isLanding = useLocation({ select: ({ pathname }) => pathname === '/' });

	if (isLanding) return <Outlet />;

	// Server-rendered emotion styles get reordered on hydration, which breaks the CSS layer order
	return (
		<ClientOnly>
			<StyledEngineProvider enableCssLayer>
				<GlobalStyles styles="@layer theme, base, mui, components, utilities;" />

				<ThemeProvider theme={theme}>
					<CssBaseline />
					<MetaThemeColor />
					<PwaCachePrompt />
					<Outlet />
				</ThemeProvider>
			</StyledEngineProvider>
		</ClientOnly>
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
