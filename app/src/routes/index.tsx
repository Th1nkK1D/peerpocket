import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import type { CSSProperties, ReactNode } from 'react';
import * as z from 'zod';

import catPaw from '../components/landing/hero/cat-paw.svg';
import coin from '../components/landing/hero/coin.svg';
import dogPaw from '../components/landing/hero/dog-paw.svg';
import receipt from '../components/landing/hero/receipt.svg';
import addExpenseScreen from '../components/landing/screens/add-expense.webp';
import expensesScreen from '../components/landing/screens/expenses.webp';
import summaryScreen from '../components/landing/screens/summary.webp';

const REPO_URL = 'https://github.com/Th1nkK1D/peerpocket';

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

const heroLayers = [
	{
		src: receipt,
		width: 449.11,
		anchor: { left: 84.66, bottom: 140.91 },
		exit: { x: '-90vw', y: '20dvh', rotate: '-15deg' },
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

const steps = [
	{
		emoji: '👋',
		title: 'Install the app, pick a name',
		body: 'Add it to your home screen. No sign-up, email, or password needed.',
	},
	{
		emoji: '🤝',
		title: 'Start a group, invite friends',
		body: "Share an invite, or add placeholders for friends who haven't joined yet.",
	},
	{
		emoji: '🧾',
		title: 'Log what you spend',
		body: 'Record who paid and how to split it. Changes sync when you’re online together.',
	},
	{
		emoji: '🪙',
		title: 'See who owes whom',
		body: 'Balances are worked out for you, so settling up takes one look.',
	},
];

// Regenerate with scripts/landing-screenshots.ts
const screens = [
	{
		src: addExpenseScreen,
		caption: 'Log what you pay',
		fan: 'z-30 sm:z-0 sm:translate-y-6 sm:-rotate-6 sm:[--from-x:calc(100%-2rem)]',
	},
	{
		src: expensesScreen,
		caption: 'Everything in one list',
		fan: 'z-20 [--from-rotate:4deg] [--from-x:calc(-100%-1.5rem)] sm:z-10 sm:scale-105 sm:[--from-rotate:0deg] sm:[--from-x:0]',
	},
	{
		src: summaryScreen,
		caption: 'Spending at a glance',
		fan: 'z-10 [--from-rotate:8deg] [--from-x:calc(-200%-3rem)] sm:z-0 sm:translate-y-6 sm:rotate-6 sm:[--from-rotate:0deg] sm:[--from-x:calc(2rem-100%)]',
	},
];

const promises = [
	{
		title: 'Your data stays on your devices',
		body: "There's no database, no account, and no copy of your expenses on our side.",
	},
	{
		title: 'It syncs straight between friends',
		body: 'When group members are online together, changes merge automatically. Edits made offline catch up next time.',
	},
	{
		title: "Even our relay can't read it",
		body: "Everything is end-to-end encrypted. The relay only passes along data it can't read.",
	},
	{
		title: 'Free and open source',
		body: 'Licensed under MIT. Code reviews and contributions are always welcome.',
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
					<div className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap justify-center gap-3 text-[clamp(1.125rem,1.7vw,1.5rem)] *:w-[clamp(12rem,19.5vw,17.5rem)] *:rounded-full *:border-2 *:border-[#3F51B5] *:py-[clamp(0.5rem,1.25vw,1.25rem)] *:transition-colors">
						<Link
							to="/get-started"
							className="bg-[#3F51B5] text-white hover:border-[#303F9F] hover:bg-[#303F9F]"
						>
							Get started
						</Link>
						<a
							href="#how-it-works"
							className="text-[#3F51B5] hover:bg-[#3F51B5]/10"
						>
							How it works
						</a>
					</div>
				</div>
			</section>

			<div className="mx-auto flex max-w-6xl flex-col gap-24 px-4 py-24">
				<section
					id="how-it-works"
					className="flex scroll-mt-12 flex-col gap-10"
				>
					<SectionHeading>How it works</SectionHeading>
					<ol className="mx-auto flex w-full max-w-2xl flex-col rounded-3xl bg-white p-6 sm:p-10">
						{steps.map(({ emoji, title, body }, index) => (
							<li
								key={title}
								className="relative flex gap-4 pb-6 before:absolute before:top-14 before:bottom-0 before:left-7 before:w-0.5 before:-translate-x-1/2 before:bg-[#C5CAE9] last:pb-0 last:before:hidden md:gap-5 md:pb-10"
							>
								<span
									aria-hidden
									className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#E8EAF6] text-3xl"
								>
									{emoji}
								</span>
								<div className="flex flex-col gap-1 pt-1">
									<p className="text-sm font-medium text-[#3F51B5]">
										Step {index + 1}
									</p>
									<h3 className="text-xl font-medium">{title}</h3>
									<p className="text-base text-black/70">{body}</p>
								</div>
							</li>
						))}
					</ol>
					<ul className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[calc(50%-8rem)] py-6 [view-timeline:--fan] sm:mx-0 sm:justify-center sm:gap-0 sm:overflow-visible sm:px-0">
						{screens.map(({ src, caption, fan }) => (
							<li
								key={caption}
								className={`flex w-64 shrink-0 fan-in snap-center flex-col items-center gap-4 sm:-mx-4 sm:w-[clamp(12rem,24vw,17rem)] ${fan}`}
							>
								<img
									src={src}
									alt={`PeerPocket app: ${caption.toLowerCase()}`}
									width={390}
									height={844}
									loading="lazy"
									className="w-full rounded-3xl shadow-2xl ring-1 ring-[#1A1A2E]"
								/>
								<p className="text-white">{caption}</p>
							</li>
						))}
					</ul>
				</section>

				<section className="flex flex-col gap-10">
					<SectionHeading>
						No cloud. Your friends have your back.
					</SectionHeading>
					<ul className="grid gap-4 sm:grid-cols-2">
						{promises.map(({ title, body }) => (
							<li key={title} className="rounded-3xl bg-white/90 p-6">
								<h3 className="text-xl font-medium">{title}</h3>
								<p className="text-base text-black/70">{body}</p>
							</li>
						))}
					</ul>
					<a
						href={`${REPO_URL}#how-does-it-work`}
						className="self-center text-lg text-white underline underline-offset-4 hover:decoration-2"
					>
						Read how sync works
					</a>
				</section>

				<section className="flex flex-col items-center gap-6 text-center">
					<img
						src="/favicon-192x192-20261110.png"
						alt=""
						width={192}
						height={192}
						loading="lazy"
						className="size-28 rounded-3xl shadow-[0_0_64px_rgb(255_255_255/0.5)]"
					/>
					<SectionHeading>Ready to split the bill?</SectionHeading>
					<Link
						to="/get-started"
						className="rounded-full bg-[#3F51B5] px-10 py-2 text-lg text-white transition-colors hover:bg-[#303F9F] sm:px-12 sm:py-3 sm:text-xl"
					>
						Get started
					</Link>
				</section>
			</div>

			<footer className="flex flex-wrap justify-center gap-x-3 gap-y-1 border-t border-white/20 px-4 py-6 text-sm text-white/80">
				<span>
					Made with 🤍 by{' '}
					<FooterLink href="https://th1nkk1d.xyz">Th1nkK1D</FooterLink>
				</span>
				<span aria-hidden>·</span>
				<span>
					Source on <FooterLink href={REPO_URL}>GitHub</FooterLink>
				</span>
			</footer>
		</main>
	);
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
	return (
		<a
			href={href}
			className="underline underline-offset-4 transition-colors hover:text-white"
		>
			{children}
		</a>
	);
}

function SectionHeading({ children }: { children: ReactNode }) {
	return (
		<h2 className="text-center font-grandstander text-[clamp(2rem,5vw,3.5rem)] leading-tight text-white">
			{children}
		</h2>
	);
}
