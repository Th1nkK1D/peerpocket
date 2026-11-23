import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import type { CSSProperties } from 'react';
import * as z from 'zod';

import catPaw from '../components/landing/hero/cat-paw.svg';
import coin from '../components/landing/hero/coin.svg';
import dogPaw from '../components/landing/hero/dog-paw.svg';
import receipt from '../components/landing/hero/receipt.svg';

export const Route = createFileRoute('/')({
	component: RouteComponent,
	ssr: true,
	beforeLoad({ search }) {
		if (typeof window === 'undefined') return;

		// Invite links copied before the get-started route existed still point here
		if (search.path) {
			throw redirect({ to: '/get-started', search, replace: true });
		}

		// iOS never refreshes an installed app's manifest, so older installs still start at "/"
		if (window.matchMedia('(display-mode: standalone)').matches) {
			throw redirect({ to: '/groups', replace: true });
		}
	},
	validateSearch: z.object({
		path: z.string().optional(),
		params: z.record(z.string(), z.any()).optional(),
	}),
});

// Lengths come from the 1440x1024 hero design, scaled by --u (one design pixel)
const u = (designPx: number) => `calc(${designPx} * var(--u))`;

// While the hero scrolls out, the cat paw snatches the coin up and away and the dog paw pulls the receipt back down
const heroLayers = [
	{
		src: receipt,
		width: 449.11,
		anchor: { left: 84.66, bottom: 140.91 },
		exit: { x: '-70vw', y: '20dvh', rotate: '-15deg' },
	},
	{
		src: coin,
		width: 170.05,
		anchor: { right: 264.95, top: 287 },
		exit: { x: '60vw', y: '-40dvh', rotate: '90deg' },
	},
	{
		src: catPaw,
		width: 619.41,
		anchor: { right: -169.41, top: -160 },
		exit: { x: '60vw', y: '-40dvh', rotate: '10deg' },
	},
	{
		src: dogPaw,
		width: 505.26,
		anchor: { left: -195, bottom: -85.8 },
		exit: { x: '-80vw', y: '25dvh', rotate: '-10deg' },
	},
];

// Statically rendered outside the root's ClientOnly, so it sticks to plain markup and Tailwind instead of MUI
function RouteComponent() {
	return (
		<main className="bg-[#5C6BC0] font-[Roboto] text-black">
			<section className="relative flex h-dvh items-center justify-center overflow-x-clip px-4 [--u:max(0.5px,min(100vw/1440,100dvh/1024))] [view-timeline:--hero]">
				{heroLayers.map(({ src, width, anchor, exit }) => (
					<img
						key={src}
						src={src}
						alt=""
						className="pointer-events-none absolute max-w-none parallax select-none"
						style={
							{
								width: u(width),
								...Object.fromEntries(
									Object.entries(anchor).map(([side, px]) => [side, u(px)]),
								),
								'--parallax-x': exit.x,
								'--parallax-y': exit.y,
								'--parallax-rotate': exit.rotate,
							} as CSSProperties
						}
					/>
				))}

				<div className="pointer-events-none absolute inset-0 parallax bg-[radial-gradient(72.5%_69.5%_at_50%_50%,rgb(255_255_255/0.8),transparent)] mask-b-from-70% [--parallax-opacity:0]" />

				<div className="relative flex parallax flex-col items-center text-center [--parallax-opacity:0] [--parallax-y:15dvh]">
					<h1 className="font-grandstander text-[clamp(3.5rem,9vw,8rem)] leading-tight">
						PeerPocket
					</h1>
					<p className="text-[clamp(1.125rem,2.5vw,2.25rem)] font-light">
						Your peer-to-peer expense tracker
					</p>
					<Link
						to="/groups"
						className="mt-[clamp(2rem,4vw,3rem)] rounded-full bg-[#3F51B5] px-[clamp(3rem,5vw,4.5rem)] py-[clamp(0.75rem,1.25vw,1.25rem)] text-[clamp(1.25rem,1.7vw,1.5rem)] text-white"
					>
						Get started
					</Link>
				</div>
			</section>

			{/* Placeholder for the upcoming "How this works" section, also gives the hero room to scroll out */}
			<section className="min-h-dvh" />
		</main>
	);
}
