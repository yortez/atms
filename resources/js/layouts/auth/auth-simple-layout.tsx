import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Moon,
    ShieldCheck,
    Sparkles,
    Sun,
} from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    return (
        <div className="flex min-h-svh flex-col bg-[#F5F4EE] font-sans text-zinc-900 antialiased transition-colors duration-200 selection:bg-[#E47818] selection:text-white dark:bg-[#0E1406] dark:text-[#F5F4EE]">
            {/* Top Institutional Header */}
            <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-[#006d5b]/25 dark:bg-[#081110]/90">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
                    <Link
                        href={home()}
                        className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
                    >
                        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white p-1 shadow-2xs transition group-hover:border-[#E47818]/60 sm:size-11 dark:border-white/15 dark:bg-white/10">
                            <img
                                src="/images/seait-logo.png"
                                alt="SEAIT Official Seal"
                                className="size-full object-contain"
                            />
                        </div>
                        <div className="min-w-0 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="font-heading text-lg font-extrabold tracking-tight text-zinc-900 transition-colors group-hover:text-[#E47818] sm:text-xl dark:text-white">
                                    SEAIT
                                </span>
                                <span className="rounded-lg border border-orange-300/80 bg-orange-50/90 px-2 py-0.5 font-heading text-[10px] font-bold tracking-wider text-[#E47818] uppercase shadow-2xs dark:border-orange-500/30 dark:bg-orange-950/60 dark:text-orange-400">
                                    ATMS
                                </span>
                            </div>
                            <span className="block truncate text-[10px] font-medium text-zinc-500 sm:text-[11px] dark:text-zinc-400">
                                Alumni Tracer Management System
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-label={
                                isDark
                                    ? 'Switch to light mode'
                                    : 'Switch to dark mode'
                            }
                            title={
                                isDark
                                    ? 'Switch to Light Mode'
                                    : 'Switch to Dark Mode'
                            }
                            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-100/80 text-zinc-700 transition hover:border-[#E47818]/40 hover:text-[#E47818] dark:border-white/15 dark:bg-zinc-800/80 dark:text-orange-400"
                        >
                            {isDark ? (
                                <Sun className="size-4" />
                            ) : (
                                <Moon className="size-4" />
                            )}
                        </button>
                        <Link
                            href={home()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 font-heading text-xs font-bold text-zinc-800 shadow-2xs transition hover:border-[#E47818] hover:text-[#E47818] dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-orange-400/50"
                        >
                            <ArrowLeft className="size-3.5 text-[#E47818]" />
                            <span>Public Portal</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Split Institutional Layout */}
            <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 sm:px-8 sm:py-12">
                <div className="grid w-full items-start gap-8 lg:grid-cols-12">
                    {/* Left Column: SEAIT Institutional Context Card */}
                    <div className="hidden lg:col-span-5 lg:block">
                        <div className="sticky top-24 overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-zinc-900 via-[#001c17] to-[#072422] p-8 text-white shadow-2xl">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/15 px-3 py-1 text-[10px] font-bold tracking-wider text-orange-300 uppercase">
                                <Sparkles className="size-3 text-orange-400" />
                                Official SEAIT Graduate & Career Gateway
                            </div>

                            <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                Verify your graduate pathway & connect with SEAIT.
                            </h2>
                            <p className="mt-3 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                                South East Asian Institute of Technology, Inc.
                                maintains a centralized CHED Graduate Tracer
                                Study (GTS) and verified industry placement
                                portal for all graduating batches.
                            </p>

                            <ul className="mt-6 space-y-3.5 border-t border-white/10 pt-6 text-xs text-zinc-200">
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#E47818]" />
                                    <div>
                                        <p className="font-heading font-bold text-white">
                                            3-Field Registrar Identity Match
                                        </p>
                                        <p className="mt-0.5 text-zinc-300">
                                            Instant account verification using
                                            your official Student Number, Last
                                            Name, and Date of Birth.
                                        </p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#E47818]" />
                                    <div>
                                        <p className="font-heading font-bold text-white">
                                            CHED GTS & Career Placement
                                        </p>
                                        <p className="mt-0.5 text-zinc-300">
                                            Log your employment milestones and
                                            apply directly to verified partner
                                            employers.
                                        </p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-400" />
                                    <div>
                                        <p className="font-heading font-bold text-white">
                                            RA 10173 Data Privacy Compliant
                                        </p>
                                        <p className="mt-0.5 text-zinc-300">
                                            Protected graduate records managed
                                            by the SEAIT Registrar and Alumni
                                            Affairs Office.
                                        </p>
                                    </div>
                                </li>
                            </ul>

                            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                                <img
                                    src="/images/seait-logo.png"
                                    alt="SEAIT Seal"
                                    className="size-10 shrink-0 object-contain"
                                />
                                <div className="min-w-0">
                                    <p className="font-heading text-[11px] font-bold tracking-wider text-teal-300 uppercase">
                                        “Educating Minds, Transforming Lives.”
                                    </p>
                                    <p className="truncate text-[11px] text-zinc-400">
                                        Crossing Rubber, Tupi, South Cotabato
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Auth Form Card */}
                    <div className="w-full lg:col-span-7">
                        <div className="mx-auto w-full max-w-xl rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xl sm:p-8 dark:border-white/10 dark:bg-[#15190B]">
                            <div className="mb-6 border-b border-zinc-200/80 pb-5 dark:border-white/10">
                                <span className="font-heading text-[11px] font-bold tracking-wider text-[#E47818] uppercase">
                                    SEAIT Institutional Portal
                                </span>
                                <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                                        {description}
                                    </p>
                                )}
                            </div>

                            {children}
                        </div>
                    </div>
                </div>
            </main>

            {/* Compact Institutional Footer */}
            <footer className="border-t border-zinc-200/80 bg-white/60 py-4 text-center text-xs text-zinc-500 dark:border-white/10 dark:bg-[#0A1006]/80 dark:text-zinc-400">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-8">
                    <span>
                        © {new Date().getFullYear()} South East Asian Institute
                        of Technology, Inc. (SEAIT)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        CHED GTS & RA 10173 Data Privacy Compliant
                    </span>
                </div>
            </footer>
        </div>
    );
}
