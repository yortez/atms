import { Head, Link, usePage } from '@inertiajs/react';
import Lenis from 'lenis';
import {
    Activity,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Award,
    BarChart3,
    BookOpen,
    BriefcaseBusiness,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ClipboardCheck,
    Cpu,
    ExternalLink,
    Facebook,
    FileCheck2,
    HardHat,
    Mail,
    MapPin,
    Megaphone,
    Menu,
    Moon,
    Phone,
    Scale,
    Search,
    Share2,
    ShieldCheck,
    Sparkles,
    Sun,
    TrendingUp,
    UsersRound,
    Wrench,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { login, register } from '@/routes';
import type { Auth } from '@/types/auth';

type PublicAnnouncement = {
    id: number;
    title: string;
    body: string;
    category?: string;
    is_pinned?: boolean;
    action_label?: string | null;
    action_url?: string | null;
    published_at: string | null;
};

type PublicJob = {
    id: number;
    title: string;
    description: string;
    location: string;
    employment_type: string;
    workplace_type: string;
    salary_min?: number | null;
    salary_max?: number | null;
    closes_at?: string | null;
    published_at?: string | null;
    company_name: string;
    industry: string;
    website?: string | null;
};

type PublicDepartment = {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    logo?: string | null;
    programs: Array<{
        id: number;
        code: string;
        name: string;
    }>;
};

type PublicEvent = {
    id: number;
    month: string;
    day: string;
    badge: string;
    timeAndVenue: string;
    title: string;
    summary: string;
    details: string;
};

type PublicSurvey = {
    id: number;
    title: string;
    description?: string | null;
    questions_count: number;
    closes_at?: string | null;
    published_at?: string | null;
};

type PublicStats = {
    graduates_count: number;
    claimed_graduates_count?: number;
    claim_rate?: number;
    tracked_graduates_count?: number;
    employed_graduates_count?: number;
    employment_rate?: number;
    degree_aligned_count?: number;
    degree_alignment_rate?: number;
    programs_count: number;
    departments_count: number;
    open_jobs_count: number;
    verified_employers_count?: number;
    active_surveys_count?: number;
    survey_responses_count?: number;
};

type WelcomeProps = {
    publicStats?: PublicStats;
    publicAnnouncements?: PublicAnnouncement[];
    publicEvents?: PublicEvent[];
    publicJobs?: PublicJob[];
    publicDepartments?: PublicDepartment[];
    publicActiveSurveys?: PublicSurvey[];
};

const fivePillars = [
    {
        eyebrow: 'CHED ACCREDITATION & COMPLIANCE',
        title: 'Standardized Graduate Tracer Study',
        description:
            'Tracks graduate employability, time-to-first-job, and curriculum relevance in direct support of SEAIT quality assurance and CHED program accreditation.',
        icon: ClipboardCheck,
        badgeTone:
            'border-orange-500/25 bg-orange-500/10 text-[#E47818] dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-400',
        portalPage: 'Employment tracer',
        ctaLabel: 'Update Tracer Record',
    },
    {
        eyebrow: 'REGISTRAR MASTERLIST VERIFICATION',
        title: 'Official Alumni Identity Claiming',
        description:
            'Matches your pre-registered SEAIT Student Number, Last Name, and Date of Birth against the Registrar roster with automated Department Coordinator assistance.',
        icon: UsersRound,
        badgeTone:
            'border-teal-600/25 bg-teal-500/10 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300',
        portalPage: 'My profile',
        ctaLabel: 'Claim Alumni Profile',
    },
    {
        eyebrow: 'REGIONAL & NATIONAL PLACEMENT',
        title: 'Verified Employer Job Portal',
        description:
            'Connects SEAIT alumni with vetted corporate and institutional employers across Tupi, South Cotabato, SOCCSKSARGEN (Region XII), and nationwide.',
        icon: BriefcaseBusiness,
        badgeTone:
            'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
        portalPage: 'Career opportunities',
        ctaLabel: 'Explore Career Portal',
    },
];

/**
 * Mirrors seait.edu.ph's signature geometric College Emblem component.
 */
function CollegeEmblem({
    code,
    name,
}: {
    code: string;
    name: string;
}) {
    const key = `${code} ${name}`.toLowerCase();
    const safeAcronym = (fallback: string) =>
        (code.trim().slice(0, 5).toUpperCase() || fallback);

    let config = {
        acronym: safeAcronym('DEPT'),
        bgGradient: 'from-orange-600 via-amber-600 to-amber-700',
        Icon: HardHat,
    };

    if (
        key.includes('information') ||
        key.includes('computer') ||
        key.includes('ict') ||
        key.includes('cit') ||
        key.includes('ccs') ||
        key.includes('it')
    ) {
        config = {
            acronym: safeAcronym('CIT'),
            bgGradient: 'from-teal-600 via-emerald-700 to-teal-900',
            Icon: Cpu,
        };
    } else if (
        key.includes('business') ||
        key.includes('governance') ||
        key.includes('cba') ||
        key.includes('cbgg') ||
        key.includes('hospitality') ||
        key.includes('account')
    ) {
        config = {
            acronym: safeAcronym('CBA'),
            bgGradient: 'from-amber-500 via-yellow-600 to-amber-800',
            Icon: BriefcaseBusiness,
        };
    } else if (
        key.includes('criminology') ||
        key.includes('criminal') ||
        key.includes('ccje')
    ) {
        config = {
            acronym: safeAcronym('CCJE'),
            bgGradient: 'from-rose-600 via-red-700 to-rose-900',
            Icon: Scale,
        };
    } else if (
        key.includes('teacher') ||
        key.includes('education') ||
        key.includes('cte') ||
        key.includes('bed')
    ) {
        config = {
            acronym: safeAcronym('CTE'),
            bgGradient: 'from-sky-600 via-blue-700 to-indigo-900',
            Icon: BookOpen,
        };
    } else if (
        key.includes('tesda') ||
        key.includes('tvet') ||
        key.includes('vocational')
    ) {
        config = {
            acronym: safeAcronym('TVET'),
            bgGradient: 'from-rose-600 via-red-700 to-rose-900',
            Icon: Wrench,
        };
    }

    const { Icon } = config;

    return (
        <div
            className={`group/emblem relative flex size-14 shrink-0 select-none items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br p-0.5 shadow-md ${config.bgGradient}`}
            title={name}
        >
            <div className="relative flex size-full flex-col items-center justify-center overflow-hidden rounded-[14px] border border-white/20 bg-zinc-950/40 p-1.5 text-center text-white backdrop-blur-xs">
                <svg
                    className="pointer-events-none absolute inset-0 size-full opacity-20"
                    viewBox="0 0 100 100"
                    fill="none"
                    stroke="currentColor"
                >
                    <circle
                        cx="50"
                        cy="50"
                        r="42"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                    />
                    <circle cx="50" cy="50" r="30" strokeWidth="1" />
                    <polygon
                        points="50,15 80,75 20,75"
                        strokeWidth="0.5"
                        strokeOpacity="0.3"
                    />
                </svg>
                <Icon className="z-10 size-5 text-white/95 drop-shadow-md transition-transform duration-300 group-hover/emblem:scale-110" />
                <span className="z-10 mt-0.5 font-mono text-[9px] font-black tracking-widest text-white/90">
                    {config.acronym}
                </span>
            </div>
            <div className="pointer-events-none absolute top-0 right-0 left-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
        </div>
    );
}

export default function Welcome({
    publicStats,
    publicAnnouncements = [],
    publicEvents = [],
    publicJobs = [],
    publicDepartments = [],
    publicActiveSurveys = [],
}: WelcomeProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAuthenticated = Boolean(auth?.user);
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    const [menuOpen, setMenuOpen] = useState(false);
    const [jobSearch, setJobSearch] = useState('');
    const [workplaceFilter, setWorkplaceFilter] = useState('All');
    const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null);
    const [selectedAnnouncement, setSelectedAnnouncement] =
        useState<PublicAnnouncement | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(
        null,
    );
    const [selectedLegalDoc, setSelectedLegalDoc] = useState<
        'terms' | 'privacy' | null
    >(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const lenisRef = useRef<Lenis | null>(null);

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    const stats: Required<PublicStats> = {
        graduates_count: publicStats?.graduates_count ?? 0,
        claimed_graduates_count: publicStats?.claimed_graduates_count ?? 0,
        claim_rate: publicStats?.claim_rate ?? 0,
        tracked_graduates_count: publicStats?.tracked_graduates_count ?? 0,
        employed_graduates_count: publicStats?.employed_graduates_count ?? 0,
        employment_rate: publicStats?.employment_rate ?? 0,
        degree_aligned_count: publicStats?.degree_aligned_count ?? 0,
        degree_alignment_rate: publicStats?.degree_alignment_rate ?? 0,
        programs_count: publicStats?.programs_count ?? 0,
        departments_count: publicStats?.departments_count ?? 0,
        open_jobs_count: publicStats?.open_jobs_count ?? publicJobs.length,
        verified_employers_count: publicStats?.verified_employers_count ?? 0,
        active_surveys_count:
            publicStats?.active_surveys_count ?? publicActiveSurveys.length,
        survey_responses_count: publicStats?.survey_responses_count ?? 0,
    };

    // Initialize Lenis Smooth Scroll (https://lenis.dev/)
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const lenis = new Lenis({
            autoRaf: true,
            lerp: 0.085,
            smoothWheel: true,
            anchors: {
                offset: -84,
            },
        });

        lenisRef.current = lenis;

        return () => {
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    // Pause Lenis background scroll whenever a detail modal is open
    useEffect(() => {
        const lenis = lenisRef.current;
        if (!lenis) {
            return;
        }

        if (
            selectedJob ||
            selectedAnnouncement ||
            selectedEvent ||
            selectedLegalDoc
        ) {
            lenis.stop();
        } else {
            lenis.start();
        }
    }, [selectedJob, selectedAnnouncement, selectedEvent, selectedLegalDoc]);

    const scrollToSection = (selector: string) => {
        if (typeof window === 'undefined') {
            return;
        }
        if (lenisRef.current) {
            lenisRef.current.scrollTo(selector, { offset: -84 });
        } else {
            document
                .querySelector(selector)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Deep-linking support (Option A: /?job=ID, /?event=ID, /?announcement=ID, /?legal=terms|privacy)
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const applyUrlParams = () => {
            const params = new URLSearchParams(window.location.search);
            const jobId = Number(params.get('job'));
            const eventId = Number(params.get('event'));
            const announcementId = Number(params.get('announcement'));
            const legalParam = params.get('legal');

            if (legalParam === 'terms' || legalParam === 'privacy') {
                setSelectedLegalDoc(legalParam);
            } else if (jobId) {
                const match = publicJobs.find((item) => item.id === jobId);
                if (match) {
                    setSelectedJob(match);
                    scrollToSection('#opportunities');
                }
            } else if (eventId) {
                const match = publicEvents.find((item) => item.id === eventId);
                if (match) {
                    setSelectedEvent(match);
                    scrollToSection('#events');
                }
            } else if (announcementId) {
                const match = publicAnnouncements.find(
                    (item) => item.id === announcementId,
                );
                if (match) {
                    setSelectedAnnouncement(match);
                    scrollToSection('#announcements');
                }
            }
        };

        applyUrlParams();
        window.addEventListener('popstate', applyUrlParams);
        return () => window.removeEventListener('popstate', applyUrlParams);
    }, [publicJobs, publicEvents, publicAnnouncements]);

    const updateDeepLinkParam = (
        type: 'job' | 'event' | 'announcement' | 'legal' | null,
        value?: number | string,
    ) => {
        if (typeof window === 'undefined') {
            return;
        }
        const url = new URL(window.location.href);
        url.searchParams.delete('job');
        url.searchParams.delete('event');
        url.searchParams.delete('announcement');
        url.searchParams.delete('legal');
        if (type && value !== undefined) {
            url.searchParams.set(type, String(value));
        }
        window.history.replaceState({}, '', url.toString());
    };

    const openJobModal = (job: PublicJob) => {
        setSelectedAnnouncement(null);
        setSelectedEvent(null);
        setSelectedLegalDoc(null);
        setSelectedJob(job);
        updateDeepLinkParam('job', job.id);
    };

    const openAnnouncementModal = (item: PublicAnnouncement) => {
        setSelectedJob(null);
        setSelectedEvent(null);
        setSelectedLegalDoc(null);
        setSelectedAnnouncement(item);
        updateDeepLinkParam('announcement', item.id);
    };

    const openEventModal = (ev: PublicEvent) => {
        setSelectedJob(null);
        setSelectedAnnouncement(null);
        setSelectedLegalDoc(null);
        setSelectedEvent(ev);
        updateDeepLinkParam('event', ev.id);
    };

    const openLegalModal = (doc: 'terms' | 'privacy') => {
        setSelectedJob(null);
        setSelectedAnnouncement(null);
        setSelectedEvent(null);
        setSelectedLegalDoc(doc);
        updateDeepLinkParam('legal', doc);
    };

    const closeAllModals = () => {
        setSelectedJob(null);
        setSelectedAnnouncement(null);
        setSelectedEvent(null);
        setSelectedLegalDoc(null);
        updateDeepLinkParam(null);
    };

    const copyShareLink = async (
        type: 'job' | 'event' | 'announcement',
        id: number,
    ) => {
        if (typeof window === 'undefined') {
            return;
        }
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set(type, String(id));
        const shareUrl = url.toString();

        try {
            await navigator.clipboard.writeText(shareUrl);
        } catch {
            const input = document.createElement('input');
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
        }

        const key = `${type}-${id}`;
        setCopiedKey(key);
        window.setTimeout(() => {
            setCopiedKey((current) => (current === key ? null : current));
        }, 2200);
    };

    const filteredJobs = publicJobs.filter((job) => {
        const matchesWorkplace =
            workplaceFilter === 'All' ||
            job.workplace_type.toLowerCase() === workplaceFilter.toLowerCase();
        const query = jobSearch.trim().toLowerCase();
        const matchesQuery =
            !query ||
            job.title.toLowerCase().includes(query) ||
            job.company_name.toLowerCase().includes(query) ||
            job.location.toLowerCase().includes(query) ||
            job.industry.toLowerCase().includes(query);

        return matchesWorkplace && matchesQuery;
    });

    return (
        <>
            <Head title="SEAIT | Alumni Tracer Management System · South East Asian Institute of Technology, Inc." />
            <div className="min-h-screen overflow-x-clip bg-[#F5F4EE] font-sans text-zinc-900 antialiased transition-colors duration-200 selection:bg-[#E47818] selection:text-white dark:bg-[#0E1406] dark:text-[#F5F4EE]">
                {/* Sticky Glass Navigation Header (seait.edu.ph Light & Dark glass pattern) */}
                <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md transition-colors duration-200 dark:border-[#006d5b]/25 dark:bg-[#081110]/90">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3.5 py-3 sm:px-6 lg:px-8">
                        <Link
                            href="/"
                            className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
                        >
                            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white p-1 shadow-xs transition group-hover:border-[#E47818]/60 sm:size-11 dark:border-white/15 dark:bg-white/10">
                                <img
                                    src="/images/seait-logo.png"
                                    alt="SEAIT Official Seal"
                                    className="size-full object-contain"
                                />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="font-heading text-base font-extrabold tracking-tight text-zinc-900 transition-colors group-hover:text-[#E47818] sm:text-xl dark:text-white">
                                        SEAIT
                                    </span>
                                    <span className="rounded-lg border border-orange-300/80 bg-orange-50/90 px-1.5 py-0.5 font-heading text-[9px] font-bold tracking-wider text-[#E47818] uppercase shadow-2xs sm:px-2 sm:text-[10px] dark:border-orange-500/30 dark:bg-orange-950/60 dark:text-orange-400">
                                        ATMS
                                    </span>
                                </div>
                                <span className="hidden truncate text-[10px] font-medium text-zinc-500 sm:block sm:text-[11px] dark:text-zinc-400">
                                    Alumni Tracer Management System
                                </span>
                            </div>
                        </Link>

                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label={
                                    isDark
                                        ? 'Switch to light mode'
                                        : 'Switch to dark mode'
                                }
                                className="flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100/80 text-zinc-700 transition hover:text-[#E47818] sm:size-10 dark:border-white/15 dark:bg-white/5 dark:text-orange-400"
                            >
                                {isDark ? (
                                    <Sun className="size-4" />
                                ) : (
                                    <Moon className="size-4" />
                                )}
                            </button>
                            <button
                                type="button"
                                aria-label="Toggle navigation"
                                aria-expanded={menuOpen}
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="relative flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100/80 text-zinc-900 transition-colors hover:border-[#E47818]/50 sm:size-10 dark:border-white/15 dark:bg-white/5 dark:text-white"
                            >
                                <Menu
                                    className={`size-5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                        menuOpen
                                            ? 'scale-50 rotate-90 opacity-0'
                                            : 'scale-100 rotate-0 opacity-100'
                                    }`}
                                />
                                <X
                                    className={`absolute size-5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                        menuOpen
                                            ? 'scale-100 rotate-0 opacity-100'
                                            : 'scale-50 -rotate-90 opacity-0'
                                    }`}
                                />
                            </button>
                        </div>

                        <nav
                            className={`max-lg:absolute max-lg:top-full max-lg:right-0 max-lg:left-0 max-lg:z-40 flex max-lg:origin-top flex-col gap-3.5 max-lg:border-b max-lg:border-zinc-200 max-lg:bg-white/98 max-lg:px-4 max-lg:shadow-2xl max-lg:backdrop-blur-md max-lg:transition-all max-lg:duration-300 max-lg:ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex-row lg:items-center lg:gap-0.5 lg:bg-transparent lg:backdrop-blur-none xl:gap-1 max-lg:dark:border-[#006d5b]/30 max-lg:dark:bg-[#081110]/98 ${
                                menuOpen
                                    ? 'max-lg:pointer-events-auto max-lg:visible max-lg:max-h-[480px] max-lg:translate-y-0 max-lg:scale-y-100 max-lg:py-4 max-lg:opacity-100'
                                    : 'max-lg:pointer-events-none max-lg:invisible max-lg:max-h-0 max-lg:-translate-y-3 max-lg:scale-y-95 max-lg:overflow-hidden max-lg:border-b-0 max-lg:py-0 max-lg:opacity-0'
                            }`}
                        >
                            <div
                                className={`grid grid-cols-2 gap-1.5 max-lg:transition-all max-lg:duration-300 max-lg:ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex lg:flex-row lg:items-center lg:gap-0.5 xl:gap-1 ${
                                    menuOpen
                                        ? 'max-lg:translate-y-0 max-lg:opacity-100 max-lg:delay-75'
                                        : 'max-lg:-translate-y-2 max-lg:opacity-0'
                                }`}
                            >
                                {[
                                    ['Tracer Study', '#tracer-study'],
                                    ['Live Metrics', '#tracer-metrics'],
                                    ['Academic Units', '#alumni-info'],
                                    ['Bulletins', '#announcements'],
                                    ['Job Board', '#opportunities'],
                                    ['Events', '#events'],
                                ].map(([label, href]) => (
                                    <a
                                        key={href}
                                        href={href}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-2.5 text-xs font-semibold whitespace-nowrap text-zinc-800 transition hover:border-[#E47818]/40 hover:bg-orange-50/90 hover:text-[#E47818] lg:border-0 lg:bg-transparent lg:px-2 lg:py-2 lg:text-zinc-700 xl:px-2.5 2xl:px-3 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-orange-950/40 dark:hover:text-orange-400 dark:lg:bg-transparent"
                                    >
                                        <span>{label}</span>
                                        <ArrowUpRight className="size-3.5 text-zinc-400 lg:hidden dark:text-zinc-500" />
                                    </a>
                                ))}
                            </div>

                            <div
                                className={`flex flex-col gap-2 border-t border-zinc-200/80 pt-3.5 max-lg:transition-all max-lg:duration-300 max-lg:ease-[cubic-bezier(0.16,1,0.3,1)] lg:mt-0 lg:ml-2 lg:shrink-0 lg:flex-row lg:flex-nowrap lg:items-center lg:border-t-0 lg:border-l lg:border-zinc-200 lg:pt-0 lg:pl-3 dark:border-white/10 dark:lg:border-white/15 ${
                                    menuOpen
                                        ? 'max-lg:translate-y-0 max-lg:opacity-100 max-lg:delay-100'
                                        : 'max-lg:-translate-y-2 max-lg:opacity-0'
                                }`}
                            >
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
                                    className="hidden size-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-100/80 text-zinc-700 transition hover:border-[#E47818]/40 hover:text-[#E47818] lg:flex dark:border-white/15 dark:bg-zinc-800/80 dark:text-orange-400 dark:hover:border-orange-400/50"
                                >
                                    {isDark ? (
                                        <Sun className="size-4" />
                                    ) : (
                                        <Moon className="size-4" />
                                    )}
                                </button>

                                {isAuthenticated ? (
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-xl bg-[#E47818] px-4 font-heading text-xs font-bold whitespace-nowrap text-white shadow-lg shadow-orange-900/25 transition hover:bg-[#F36C21] lg:h-9 lg:w-auto"
                                    >
                                        Open Portal Dashboard
                                        <ArrowRight className="ml-1.5 size-3.5" />
                                    </Link>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center lg:gap-2">
                                            <Link
                                                href="/register?type=employer"
                                                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold whitespace-nowrap text-zinc-700 transition hover:border-[#E47818] hover:text-[#E47818] lg:hidden xl:inline-flex xl:h-9 xl:border-0 xl:bg-transparent xl:px-2.5 xl:text-zinc-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:text-orange-400 dark:xl:bg-transparent"
                                            >
                                                Employer Partner
                                            </Link>
                                            <Link
                                                href={login()}
                                                className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold whitespace-nowrap text-zinc-800 transition hover:border-[#E47818] hover:text-[#E47818] lg:h-9 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-orange-400/50"
                                            >
                                                Sign In
                                            </Link>
                                        </div>
                                        <Link
                                            href={register()}
                                            className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-xl border border-[#E47818]/40 bg-[#E47818]/10 px-3.5 font-heading text-xs font-bold whitespace-nowrap text-[#E47818] transition hover:bg-[#E47818] hover:text-white lg:h-9 lg:w-auto dark:border-orange-400/40 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-[#E47818] dark:hover:text-white"
                                        >
                                            Claim Alumni Record
                                            <ArrowRight className="ml-1.5 size-3.5" />
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                </header>

                {/* Animated Mobile Drawer Backdrop Overlay */}
                <button
                    type="button"
                    aria-label="Close mobile navigation menu"
                    tabIndex={menuOpen ? 0 : -1}
                    onClick={() => setMenuOpen(false)}
                    className={`fixed inset-0 z-30 bg-zinc-950/35 backdrop-blur-[2px] transition-opacity duration-300 ease-out lg:hidden ${
                        menuOpen
                            ? 'pointer-events-auto opacity-100'
                            : 'pointer-events-none opacity-0'
                    }`}
                />

                <main>
                    {/* Hero Section: Exact seait.edu.ph Full-Bleed Campus Hero + Prominent CHED Tracer Study Card */}
                    <section className="relative flex min-h-[calc(100svh-4.5rem)] flex-col justify-center overflow-hidden border-b border-[#005244]/40 bg-[#001c17] pt-10 pb-20 text-white sm:pt-16 sm:pb-28">
                        {/* Campus Architectural Background & Multi-Stop Gradient Overlay */}
                        <div className="pointer-events-none absolute inset-0 z-0">
                            <img
                                src="/images/seait-admin-building.jpg"
                                alt="SEAIT Crossing Rubber, Tupi Campus"
                                className="size-full object-cover opacity-40"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#001c17] via-[#001c17]/90 via-60% to-[#001c17]/40 sm:bg-gradient-to-r sm:from-[#001c17]/95 sm:from-25% sm:via-[#001c17]/85 sm:via-60% md:via-[#002b24]/65 sm:to-[#0E1406]/70" />
                            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#001c17]/90 to-transparent" />
                        </div>

                        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:gap-12 sm:px-8 lg:grid-cols-12">
                            {/* Left 7 Columns: seait.edu.ph Editorial Hero Typography */}
                            <div className="min-w-0 lg:col-span-7">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-orange-300 uppercase shadow-sm backdrop-blur-md sm:text-xs">
                                    <span className="size-2 animate-pulse rounded-full bg-orange-400" />
                                    Official Institutional Portal
                                </div>

                                <p className="font-heading text-[11px] font-bold tracking-[0.14em] text-[#6BA886] uppercase sm:text-xs sm:tracking-[0.2em]">
                                    Committed to The Total Development of The Student
                                </p>

                                <h1 className="mt-2 max-w-3xl font-heading text-[28px] leading-[1.14] font-extrabold tracking-tight text-balance text-[#F5F4EE] sm:text-5xl lg:text-6xl">
                                    Alumni Tracer{' '}
                                    <br className="hidden sm:inline" />
                                    <span className="bg-gradient-to-r from-orange-400 via-[#E47818] to-amber-300 bg-clip-text text-transparent">
                                        Management System.
                                    </span>
                                </h1>

                                <p className="mt-5 max-w-2xl text-sm leading-relaxed font-normal text-zinc-200 sm:text-lg">
                                    A centralized platform for tracking, managing,
                                    and analyzing graduate outcomes in support of
                                    institutional excellence and CHED accreditation.
                                </p>

                                <div className="mt-8 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
                                    <Link
                                        href={
                                            isAuthenticated
                                                ? '/dashboard?page=Employment+tracer'
                                                : register()
                                        }
                                        className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#E47818] px-6 py-3.5 font-heading text-xs font-bold text-white shadow-xl shadow-orange-950/50 transition hover:bg-[#F36C21] sm:px-7 sm:py-4 sm:text-sm"
                                    >
                                        <span>
                                            {isAuthenticated
                                                ? 'Update My Graduate Tracer'
                                                : 'Claim Record & Join Tracer Study'}
                                        </span>
                                        <ArrowRight className="size-4 sm:size-5" />
                                    </Link>
                                    <a
                                        href="#opportunities"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-3 font-heading text-xs font-semibold whitespace-nowrap sm:px-6 text-white backdrop-blur-md transition hover:bg-white/15 sm:px-6 sm:py-4 sm:text-sm"
                                    >
                                        <BriefcaseBusiness className="size-4 text-teal-300 sm:size-5" />
                                        <span>Explore Job Board</span>
                                    </a>
                                    <a
                                        href="#tracer-metrics"
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#0A1006]/70 px-3 py-3 text-xs whitespace-nowrap sm:px-4 sm:py-3.5 font-semibold text-orange-300 backdrop-blur-md transition hover:border-orange-400/50 sm:py-4"
                                    >
                                        <BarChart3 className="size-4 text-orange-400" />
                                        <span>Live Outcomes</span>
                                        <ArrowDownRight className="size-3.5" />
                                    </a>
                                </div>

                                {/* Institutional Motto & Accreditation Strip */}

                            </div>

                            {/* Right 5 Columns: Prominent Tracer Study Participation Callout Card */}
                            <div
                                id="tracer-study"
                                className="min-w-0 lg:col-span-5"
                            >
                                <div className="rounded-3xl border border-zinc-200/80 bg-white/95 p-6 text-zinc-900 shadow-2xl backdrop-blur-md sm:p-7 dark:border-[#E47818]/40 dark:bg-[#15190B]/95 dark:text-[#F5F4EE]">
                                    <div className="flex items-start justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-white/10">
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-[#E47818] uppercase dark:bg-orange-500/15 dark:text-orange-300">
                                                <Sparkles className="size-3 text-[#E47818] dark:text-orange-400" />
                                                CHED GTS Participation Callout
                                            </span>
                                            <h2 className="mt-2.5 font-heading text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-[#F5F4EE]">
                                                Participate in the SEAIT Graduate Tracer Study
                                            </h2>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-[#F5F4EE]/80">
                                        All SEAIT graduates across every batch are
                                        requested to verify their alumni record,
                                        report their current employment status,
                                        and complete active CHED tracer surveys.
                                    </p>

                                    {/* Live Active Tracer Surveys List */}
                                    <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-[#F5F4EE] p-4 dark:border-white/10 dark:bg-[#0A1006]">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-heading font-bold tracking-wider text-teal-700 uppercase dark:text-teal-300">
                                                Open Tracer Surveys ({stats.active_surveys_count})
                                            </span>
                                            <span className="text-zinc-500 dark:text-zinc-400">
                                                {stats.survey_responses_count.toLocaleString()}{' '}
                                                responses recorded
                                            </span>
                                        </div>

                                        {publicActiveSurveys.length > 0 ? (
                                            <div className="mt-3 space-y-2">
                                                {publicActiveSurveys.map(
                                                    (survey) => (
                                                        <div
                                                            key={survey.id}
                                                            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 transition hover:border-[#E47818]/50 dark:border-white/10 dark:bg-[#15190B]"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate font-heading text-xs font-bold text-zinc-900 dark:text-white">
                                                                    {survey.title}
                                                                </p>
                                                                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                                                    {
                                                                        survey.questions_count
                                                                    }{' '}
                                                                    questions
                                                                    {survey.closes_at
                                                                        ? ` · Closes ${survey.closes_at}`
                                                                        : ' · Accepting responses'}
                                                                </p>
                                                            </div>
                                                            <Link
                                                                href={
                                                                    isAuthenticated
                                                                        ? '/dashboard?page=Surveys'
                                                                        : register()
                                                                }
                                                                className="shrink-0 rounded-lg border border-teal-600/30 bg-teal-600/10 px-3 py-1.5 font-heading text-[11px] font-bold text-teal-700 transition hover:bg-teal-600 hover:text-white dark:border-teal-400/30 dark:bg-teal-500/15 dark:text-teal-300 dark:hover:bg-teal-500 dark:hover:text-zinc-950"
                                                            >
                                                                Answer →
                                                            </Link>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-white/80 p-3.5 text-xs leading-relaxed text-zinc-600 dark:border-white/15 dark:bg-[#15190B]/60 dark:text-zinc-300">
                                                No cohort survey questionnaires are
                                                currently open, but you can claim
                                                your verified SEAIT profile and
                                                update your employment history at
                                                any time.
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                                        <Link
                                            href={
                                                isAuthenticated
                                                    ? '/dashboard?page=Surveys'
                                                    : register()
                                            }
                                            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#004d40]/30 bg-[#001c17] px-5 font-heading text-xs font-bold text-white shadow-sm transition hover:bg-[#002b24] dark:border-teal-400/30 dark:bg-teal-950/80 dark:text-teal-100 dark:hover:bg-teal-900"
                                        >
                                            {isAuthenticated
                                                ? 'Open Tracer Surveys'
                                                : 'Verify & Claim Alumni Account'}
                                            <ArrowRight className="ml-2 size-4 text-[#E47818] dark:text-orange-400" />
                                        </Link>
                                        <Link
                                            href="/alumni/registration-assistance"
                                            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:border-[#E47818] hover:text-[#E47818] dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:border-orange-400/50 dark:hover:text-orange-300"
                                        >
                                            <ShieldCheck className="mr-1.5 size-4 text-teal-600 dark:text-teal-300" />
                                            Record Assistance
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Floating Overlap Institutional Scale Bar (Distinct from outcome percentage cards below) */}
                    <section className="relative z-20 mx-auto -mt-10 max-w-6xl px-4 sm:px-8">
                        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-zinc-200/80 bg-white p-4 text-center shadow-xl sm:gap-6 sm:p-8 lg:grid-cols-4 lg:divide-x lg:divide-zinc-200/80 dark:border-white/15 dark:bg-[#15190B] dark:shadow-2xl lg:dark:divide-white/10">
                            <div className="rounded-2xl bg-zinc-50/70 p-3 sm:p-4 lg:rounded-none lg:bg-transparent lg:p-0 dark:bg-white/5 lg:dark:bg-transparent">
                                <span className="block font-heading text-2xl font-bold tracking-tight text-[#E47818] sm:text-4xl">
                                    {stats.graduates_count.toLocaleString()}
                                </span>
                                <span className="mt-1 block font-heading text-[11px] font-bold tracking-wider text-zinc-800 uppercase sm:text-xs dark:text-[#F5F4EE]">
                                    Alumni Masterlist
                                </span>
                                <span className="mt-0.5 block text-[10px] text-zinc-500 sm:text-[11px] dark:text-zinc-400">
                                    {stats.claimed_graduates_count.toLocaleString()} claimed accounts
                                </span>
                            </div>

                            <div className="rounded-2xl bg-zinc-50/70 p-3 sm:p-4 lg:rounded-none lg:bg-transparent lg:p-0 dark:bg-white/5 lg:dark:bg-transparent">
                                <span className="block font-heading text-2xl font-bold tracking-tight text-teal-600 sm:text-4xl dark:text-teal-400">
                                    {stats.programs_count.toLocaleString()}
                                </span>
                                <span className="mt-1 block font-heading text-[11px] font-bold tracking-wider text-zinc-800 uppercase sm:text-xs dark:text-[#F5F4EE]">
                                    Academic Programs
                                </span>
                                <span className="mt-0.5 block text-[10px] text-zinc-500 sm:text-[11px] dark:text-zinc-400">
                                    Across {stats.departments_count.toLocaleString()} SEAIT academic units
                                </span>
                            </div>

                            <div className="rounded-2xl bg-zinc-50/70 p-3 sm:p-4 lg:rounded-none lg:bg-transparent lg:p-0 dark:bg-white/5 lg:dark:bg-transparent">
                                <span className="block font-heading text-2xl font-bold tracking-tight text-[#CD7A30] sm:text-4xl dark:text-amber-400">
                                    {stats.survey_responses_count.toLocaleString()}
                                </span>
                                <span className="mt-1 block font-heading text-[11px] font-bold tracking-wider text-zinc-800 uppercase sm:text-xs dark:text-[#F5F4EE]">
                                    GTS Survey Responses
                                </span>
                                <span className="mt-0.5 block text-[10px] text-zinc-500 sm:text-[11px] dark:text-zinc-400">
                                    {stats.active_surveys_count} active tracer questionnaires
                                </span>
                            </div>

                            <div className="rounded-2xl bg-zinc-50/70 p-3 sm:p-4 lg:rounded-none lg:bg-transparent lg:p-0 dark:bg-white/5 lg:dark:bg-transparent">
                                <span className="block font-heading text-2xl font-bold tracking-tight text-emerald-600 sm:text-4xl dark:text-emerald-400">
                                    {stats.open_jobs_count.toLocaleString()}
                                </span>
                                <span className="mt-1 block font-heading text-[11px] font-bold tracking-wider text-zinc-800 uppercase sm:text-xs dark:text-[#F5F4EE]">
                                    Open Career Roles
                                </span>
                                <span className="mt-0.5 block text-[10px] text-zinc-500 sm:text-[11px] dark:text-zinc-400">
                                    {stats.verified_employers_count} verified partner employers
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Live Institutional Tracer Analytics & Executive Banner (Standardized py-20) */}
                    <section
                        id="tracer-metrics"
                        className="mx-auto max-w-6xl px-4 py-20 sm:px-8"
                    >
                        {/* Standardized Subpage/Section Header */}
                        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div>
                                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-bold tracking-wider text-[#E47818] uppercase dark:text-orange-400">
                                    <Activity className="size-3.5" />
                                    Live Institutional Outcomes
                                </div>
                                <h2 className="font-heading text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl dark:text-[#F5F4EE]">
                                    CHED Graduate Tracer & Employability Analytics
                                </h2>
                                <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                                    Real-time institutional telemetry computed
                                    directly from verified SEAIT alumni profiles,
                                    employment tracer submissions, and partner
                                    placements.
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-2 self-start rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-teal-700 shadow-2xs md:self-auto dark:border-white/10 dark:bg-[#15190B] dark:text-teal-300">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                Live Database Feed
                            </span>
                        </div>

                        {stats.tracked_graduates_count === 0 &&
                        stats.graduates_count === 0 ? (
                            <div className="rounded-3xl border border-dashed border-amber-400/60 bg-amber-50/60 p-7 sm:p-9 dark:border-amber-500/30 dark:bg-[#15190B]">
                                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                                    <div className="max-w-2xl space-y-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold tracking-wider text-[#CD7A30] uppercase dark:text-amber-300">
                                            Baseline Cohort Collection Active
                                        </span>
                                        <h3 className="font-heading text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">
                                            Awaiting Initial Graduate Tracer Submissions
                                        </h3>
                                        <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                            Institutional employability and curriculum relevance percentages are automatically published as SEAIT graduates claim their Registrar records and log their employment history.
                                        </p>
                                    </div>
                                    <Link
                                        href={
                                            isAuthenticated
                                                ? '/dashboard?page=Employment+tracer'
                                                : register()
                                        }
                                        className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#E47818] px-5 font-heading text-xs font-bold text-white shadow-md transition hover:bg-[#F36C21]"
                                    >
                                        Submit First Tracer Record
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            /* Detailed Progress Breakdown Grid */
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xs sm:p-7 dark:border-white/10 dark:bg-[#15190B]">
                                    <div className="flex items-center justify-between">
                                        <span className="font-heading text-xs font-bold tracking-wider text-[#E47818] uppercase dark:text-orange-400">
                                            Graduate Employability
                                        </span>
                                        <TrendingUp className="size-5 text-[#E47818] dark:text-orange-400" />
                                    </div>
                                    <p className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                                        {stats.tracked_graduates_count > 0
                                            ? `${stats.employment_rate}%`
                                            : 'Baseline'}
                                    </p>
                                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-[#0A1006]">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#E47818] to-amber-400 transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, stats.employment_rate))}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        {stats.employed_graduates_count.toLocaleString()}{' '}
                                        currently employed out of{' '}
                                        {stats.tracked_graduates_count.toLocaleString()}{' '}
                                        graduates with recorded employment status.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xs sm:p-7 dark:border-white/10 dark:bg-[#15190B]">
                                    <div className="flex items-center justify-between">
                                        <span className="font-heading text-xs font-bold tracking-wider text-teal-700 uppercase dark:text-teal-300">
                                            Curriculum Relevance
                                        </span>
                                        <Award className="size-5 text-teal-600 dark:text-teal-300" />
                                    </div>
                                    <p className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                                        {stats.employed_graduates_count > 0
                                            ? `${stats.degree_alignment_rate}%`
                                            : 'Baseline'}
                                    </p>
                                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-[#0A1006]">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, stats.degree_alignment_rate))}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        {stats.degree_aligned_count.toLocaleString()}{' '}
                                        employed alumni report roles directly aligned
                                        with their SEAIT academic degree program.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xs sm:p-7 dark:border-white/10 dark:bg-[#15190B]">
                                    <div className="flex items-center justify-between">
                                        <span className="font-heading text-xs font-bold tracking-wider text-[#CD7A30] uppercase dark:text-amber-300">
                                            Roster Claim Coverage
                                        </span>
                                        <FileCheck2 className="size-5 text-[#CD7A30] dark:text-amber-300" />
                                    </div>
                                    <p className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                                        {stats.claim_rate}%
                                    </p>
                                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-[#0A1006]">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#CD7A30] to-amber-300 transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, stats.claim_rate))}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        {stats.claimed_graduates_count.toLocaleString()}{' '}
                                        verified portal accounts linked out of{' '}
                                        {stats.graduates_count.toLocaleString()}{' '}
                                        total masterlist records across{' '}
                                        {stats.departments_count} academic units.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Executive Institutional Mandate Banner (Exact seait.edu.ph 12-col card pattern) */}
                        <div className="relative mt-10 overflow-hidden rounded-3xl border border-teal-900/40 bg-gradient-to-br from-zinc-900 via-[#0B1B1A] to-[#072422] p-8 text-white shadow-xl sm:p-12">
                            <div className="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full border border-teal-500/15" />
                            <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                                <div className="space-y-4 lg:col-span-8">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold tracking-wider text-orange-300 uppercase">
                                        <Sparkles className="size-3.5 text-orange-400" />
                                        Institutional Quality Assurance Mandate
                                    </span>
                                    <h3 className="font-heading text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl md:text-4xl">
                                        Empowering Communities Through{' '}
                                        <span className="text-orange-400">
                                            Accessible Technological Excellence
                                        </span>
                                    </h3>
                                    <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                                        Since our founding in Tupi, South
                                        Cotabato in 2006, South East Asian
                                        Institute of Technology, Inc. (SEAIT) has
                                        remained committed to dismantling
                                        economic barriers to higher education as
                                        a proud CHED UniFAST partner. Through
                                        this Alumni Tracer Management System,
                                        every graduate’s career milestone
                                        strengthens our curriculum, supports
                                        CHED accreditation, and opens doors for
                                        the next generation of SEAIT scholars.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-6 pt-2">
                                        <div>
                                            <h4 className="font-heading text-sm font-bold text-white">
                                                Office of the Registrar & Alumni Affairs
                                            </h4>
                                            <p className="text-[11px] text-teal-300">
                                                South East Asian Institute of Technology, Inc.
                                            </p>
                                        </div>
                                        <div className="hidden h-8 w-px bg-white/15 sm:block" />
                                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                                            <MapPin className="size-4 text-orange-400" />
                                            <span>
                                                Crossing Rubber, Tupi, South Cotabato
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xs lg:col-span-4">
                                    <div className="mb-4 flex size-20 items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-1.5 shadow-sm">
                                        <img
                                            src="/images/seait-logo.png"
                                            alt="SEAIT Official Seal"
                                            className="size-full object-contain"
                                        />
                                    </div>
                                    <span className="font-heading text-xs font-bold tracking-widest text-orange-300 uppercase">
                                        Official Seal · 2006
                                    </span>
                                    <p className="mt-1 text-[11px] leading-snug text-zinc-300">
                                        Committed to The Total Development of The Student
                                    </p>
                                    <Link
                                        href={
                                            isAuthenticated
                                                ? '/dashboard'
                                                : register()
                                        }
                                        className="mt-4 rounded-xl bg-white px-4 py-2 font-heading text-xs font-bold text-teal-950 transition hover:bg-orange-50"
                                    >
                                        {isAuthenticated
                                            ? 'Enter Alumni Portal →'
                                            : 'Claim Official Record →'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Platform Pillars Section (Standardized py-20) */}
                    <section
                        id="community"
                        className="border-t border-zinc-200/80 bg-white py-20 dark:border-white/10 dark:bg-[#0A1006]"
                    >
                        <div className="mx-auto max-w-6xl px-4 sm:px-8">
                            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                                <div>
                                    <span className="text-xs font-bold tracking-wider text-[#E47818] uppercase">
                                        Core Portal Capabilities
                                    </span>
                                    <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl dark:text-white">
                                        Unified Graduate Tracking & Career Placement
                                    </h2>
                                    <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                                        Designed for SEAIT graduates, Department
                                        Coordinators, the Office of the
                                        Registrar, and verified industry
                                        partners.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {fivePillars.map(
                                    ({
                                        eyebrow,
                                        title,
                                        description,
                                        icon: Icon,
                                        badgeTone,
                                        portalPage,
                                        ctaLabel,
                                    }) => (
                                        <article
                                            key={title}
                                            className="group flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-[#F5F4EE]/60 p-6 shadow-2xs transition hover:border-[#E47818]/40 sm:p-7 dark:border-white/10 dark:bg-[#15190B]"
                                        >
                                            <div>
                                                <span
                                                    className={`flex size-12 items-center justify-center rounded-2xl border ${badgeTone}`}
                                                >
                                                    <Icon className="size-5" />
                                                </span>
                                                <p className="mt-5 font-heading text-[10px] font-bold tracking-widest text-[#E47818] uppercase dark:text-orange-400">
                                                    {eyebrow}
                                                </p>
                                                <h3 className="mt-1.5 font-heading text-lg font-bold text-zinc-900 transition group-hover:text-[#E47818] dark:text-white dark:group-hover:text-orange-400">
                                                    {title}
                                                </h3>
                                                <p className="mt-2.5 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                    {description}
                                                </p>
                                            </div>
                                            <div className="mt-6 border-t border-zinc-200/80 pt-4 dark:border-white/10">
                                                <Link
                                                    href={
                                                        isAuthenticated
                                                            ? `/dashboard?page=${encodeURIComponent(portalPage)}`
                                                            : register()
                                                    }
                                                    className="inline-flex items-center gap-1.5 font-heading text-xs font-bold text-[#E47818] transition hover:text-[#CD7A30]"
                                                >
                                                    {isAuthenticated
                                                        ? `Open ${portalPage}`
                                                        : ctaLabel}
                                                    <ArrowUpRight className="size-4" />
                                                </Link>
                                            </div>
                                        </article>
                                    ),
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Academic Divisions & Verification Protocol (Standardized py-20 + seait.edu.ph College Emblems) */}
                    <section
                        id="alumni-info"
                        className="border-t border-zinc-200/80 bg-[#F5F4EE] py-20 dark:border-white/10 dark:bg-[#0E1406]"
                    >
                        <div className="mx-auto max-w-6xl px-4 sm:px-8">
                            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                                <div>
                                    <span className="text-xs font-bold tracking-wider text-[#E47818] uppercase">
                                        Academic Offerings & Roster Verification
                                    </span>
                                    <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl dark:text-white">
                                        SEAIT Academic Divisions & Claim Protocol
                                    </h2>
                                    <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                                        Strictly synchronized with the active
                                        departments and degree programs configured
                                        in the SEAIT Academic Catalog.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    <Link
                                        href={
                                            isAuthenticated
                                                ? '/dashboard?page=My+profile'
                                                : register()
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#E47818] px-4 py-2.5 font-heading text-xs font-bold text-white transition hover:bg-[#F36C21]"
                                    >
                                        {isAuthenticated
                                            ? 'View My Alumni Profile'
                                            : 'Verify & Claim Record'}
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                    <Link
                                        href="/alumni/registration-assistance"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:border-teal-600 hover:text-teal-700 dark:border-white/15 dark:bg-[#15190B] dark:text-zinc-200 dark:hover:border-teal-400 dark:hover:text-teal-300"
                                    >
                                        <ShieldCheck className="size-4 text-teal-600 dark:text-teal-400" />
                                        Coordinator Assistance
                                    </Link>
                                </div>
                            </div>

                            {/* 3-Step Claim Protocol Strip */}
                            <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                                {[
                                    {
                                        step: 'STEP 01',
                                        title: 'Enter 3 Academic Credentials',
                                        text: 'Provide your SEAIT Student Number, Last Name on record, and Date of Birth with your active personal email.',
                                    },
                                    {
                                        step: 'STEP 02',
                                        title: 'Instant Roster Match or Assistance',
                                        text: 'Exact matches verify immediately. Discrepancies can be routed directly to your Department Coordinator.',
                                    },
                                    {
                                        step: 'STEP 03',
                                        title: 'Complete GTS & Apply to Jobs',
                                        text: 'Log your employment history, indicate degree alignment for CHED reporting, and apply to verified partner employers.',
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.step}
                                        className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs dark:border-white/10 dark:bg-[#15190B]"
                                    >
                                        <span className="inline-block rounded-md bg-orange-500/15 px-2.5 py-0.5 font-heading text-[10px] font-bold tracking-wider text-[#E47818] uppercase dark:text-orange-400">
                                            {item.step}
                                        </span>
                                        <h3 className="mt-2.5 font-heading text-base font-bold text-zinc-900 dark:text-white">
                                            {item.title}
                                        </h3>
                                        <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                            {item.text}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Database-Driven Academic Divisions Grid (seait.edu.ph card style) */}
                            {publicDepartments.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {publicDepartments.map((dept) => (
                                        <div
                                            key={dept.id}
                                            className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs transition hover:border-[#E47818]/40 dark:border-white/10 dark:bg-[#15190B]"
                                        >
                                            <div>
                                                <div className="mb-4 flex items-center gap-4">
                                                    {dept.logo ? (
                                                        <img
                                                            src={dept.logo}
                                                            alt={`${dept.name} logo`}
                                                            className="size-14 shrink-0 rounded-2xl border border-zinc-200/80 bg-white object-cover shadow-md dark:border-white/10"
                                                        />
                                                    ) : (
                                                        <CollegeEmblem
                                                            code={dept.code}
                                                            name={dept.name}
                                                        />
                                                    )}
                                                    <div className="min-w-0">
                                                        <span className="block font-heading text-[10px] font-bold tracking-wider text-[#E47818] uppercase">
                                                            {dept.code} · Academic Division
                                                        </span>
                                                        <h3 className="line-clamp-2 font-heading text-base font-bold text-zinc-900 transition group-hover:text-[#E47818] dark:text-white dark:group-hover:text-orange-400">
                                                            {dept.name}
                                                        </h3>
                                                    </div>
                                                </div>

                                                {dept.description && (
                                                    <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                                        {dept.description}
                                                    </p>
                                                )}

                                                {dept.programs.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {dept.programs.map(
                                                            (prog) => (
                                                                <span
                                                                    key={prog.id}
                                                                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:border-white/10 dark:bg-[#0A1006] dark:text-zinc-200"
                                                                >
                                                                    <strong className="text-teal-700 dark:text-teal-300">
                                                                        {prog.code}
                                                                    </strong>{' '}
                                                                    {/* · {prog.name} */}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs italic text-zinc-400 dark:text-zinc-500">
                                                        No active degree programs
                                                        listed under this division yet.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-white/10">
                                                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                                                    {dept.programs.length}{' '}
                                                    {dept.programs.length === 1
                                                        ? 'Program'
                                                        : 'Programs'}{' '}
                                                    Offered
                                                </span>
                                                <Link
                                                    href={
                                                        isAuthenticated
                                                            ? '/dashboard?page=My+profile'
                                                            : register()
                                                    }
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 transition group-hover:text-[#E47818] dark:text-zinc-300 dark:group-hover:text-orange-400"
                                                >
                                                    Claim Graduate Record
                                                    <ArrowRight className="size-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/80 p-10 text-center dark:border-white/15 dark:bg-[#15190B]/60">
                                    <Building2 className="mx-auto size-8 text-[#E47818]" />
                                    <h3 className="mt-3 font-heading text-base font-bold text-zinc-900 dark:text-white">
                                        No Academic Divisions Configured Yet
                                    </h3>
                                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        Academic colleges and degree programs
                                        stored in the SEAIT database will appear
                                        here automatically once published.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Official Announcements & Bulletins Section (Standardized py-20 + Shareable Links) */}
                    <section
                        id="announcements"
                        className="border-t border-zinc-200/80 bg-white py-20 dark:border-white/10 dark:bg-[#0A1006]"
                    >
                        <div className="mx-auto max-w-6xl px-4 sm:px-8">
                            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                                <div>
                                    <span className="text-xs font-bold tracking-wider text-[#E47818] uppercase">
                                        SEAIT Communications & Alumni Office
                                    </span>
                                    <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl dark:text-white">
                                        Latest Campus & Alumni Bulletins
                                    </h2>
                                    <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                                        Official advisories, graduate tracer
                                        deadlines, and accreditation updates.
                                    </p>
                                </div>
                                <Link
                                    href={
                                        isAuthenticated
                                            ? '/dashboard?page=Announcements'
                                            : login()
                                    }
                                    className="inline-flex items-center gap-1.5 font-heading text-xs font-bold text-[#E47818] transition hover:text-[#CD7A30]"
                                >
                                    {isAuthenticated
                                        ? 'Open All Portal Bulletins'
                                        : 'Sign in for Cohort Bulletins'}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>

                            {publicAnnouncements.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    {publicAnnouncements.map((item) => {
                                        const isCopied =
                                            copiedKey ===
                                            `announcement-${item.id}`;
                                        return (
                                            <article
                                                key={item.id}
                                                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xs transition hover:border-[#E47818]/40 dark:border-white/10 dark:bg-[#15190B]"
                                            >
                                                <div>
                                                    <div className="flex h-24 items-center justify-between bg-gradient-to-r from-[#E47818] to-amber-600 px-6 text-white">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 font-heading text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs">
                                                            <Megaphone className="size-3.5" />
                                                            {item.is_pinned
                                                                ? 'Pinned · '
                                                                : ''}
                                                            {item.category &&
                                                                item.category !==
                                                                'general'
                                                                ? item.category
                                                                : 'Official Bulletin'}
                                                        </span>
                                                        <span className="text-xs font-semibold text-white/90">
                                                            {item.published_at ??
                                                                'Published'}
                                                        </span>
                                                    </div>
                                                    <div className="p-6">
                                                        <h3 className="line-clamp-2 font-heading text-lg font-bold tracking-tight text-zinc-900 transition group-hover:text-[#E47818] dark:text-white dark:group-hover:text-orange-400">
                                                            {item.title}
                                                        </h3>
                                                        <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                                                            {item.body}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 dark:border-white/10">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openAnnouncementModal(
                                                                item,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1 font-heading text-xs font-bold text-[#E47818] transition hover:text-[#CD7A30]"
                                                    >
                                                        Read Bulletin
                                                        <ArrowUpRight className="size-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyShareLink(
                                                                'announcement',
                                                                item.id,
                                                            )
                                                        }
                                                        aria-label={`Copy direct link to ${item.title}`}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-teal-600 hover:text-teal-700 dark:border-white/10 dark:bg-[#0A1006] dark:text-zinc-300 dark:hover:border-teal-400 dark:hover:text-teal-300"
                                                    >
                                                        {isCopied ? (
                                                            <>
                                                                <Check className="size-3 text-teal-600 dark:text-teal-400" />
                                                                <span className="text-teal-700 dark:text-teal-300">
                                                                    Copied
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Share2 className="size-3" />
                                                                Share
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-dashed border-zinc-300 bg-[#F5F4EE]/60 p-10 text-center dark:border-white/15 dark:bg-[#15190B]/60">
                                    <Megaphone className="mx-auto size-8 text-[#E47818]" />
                                    <h3 className="mt-3 font-heading text-base font-bold text-zinc-900 dark:text-white">
                                        No Public Bulletins Published Yet
                                    </h3>
                                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        Check back soon for official SEAIT campus
                                        announcements and graduate tracer
                                        advisories.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Verified Job Board Section (Standardized py-20 + Shareable Links) */}
                    <section
                        id="opportunities"
                        className="border-t border-zinc-200/80 bg-[#F5F4EE] py-20 dark:border-white/10 dark:bg-[#0E1406]"
                    >
                        <div className="mx-auto max-w-6xl px-4 sm:px-8">
                            <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                                <div className="min-w-0">
                                    <span className="text-xs font-bold tracking-wider text-[#E47818] uppercase">
                                        Industry Placement & Career Center
                                    </span>
                                    <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl dark:text-white">
                                        Verified SEAIT Alumni Job Board
                                    </h2>
                                    <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                                        Career opportunities from verified
                                        partner employers. Inspect any role or
                                        share its direct link with fellow
                                        graduates.
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
                                    <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 text-xs text-zinc-900 sm:w-auto dark:border-white/15 dark:bg-[#15190B] dark:text-white">
                                        <Search className="size-3.5 shrink-0 text-[#E47818]" />
                                        <input
                                            type="search"
                                            value={jobSearch}
                                            onChange={(e) =>
                                                setJobSearch(e.target.value)
                                            }
                                            placeholder="Search role, company, city…"
                                            className="w-full bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 sm:w-40 dark:text-white dark:placeholder:text-zinc-500"
                                        />
                                    </label>
                                    {['All', 'On-site', 'Hybrid', 'Remote'].map(
                                        (mode) => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() =>
                                                    setWorkplaceFilter(mode)
                                                }
                                                className={`h-10 shrink-0 rounded-xl px-3 font-heading text-xs font-bold whitespace-nowrap transition ${workplaceFilter === mode
                                                    ? 'bg-[#E47818] text-white shadow-sm'
                                                    : 'border border-zinc-300 bg-white text-zinc-700 hover:border-[#E47818] dark:border-white/15 dark:bg-[#15190B] dark:text-zinc-300 dark:hover:border-orange-400/50'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            <div
                                id="job-board"
                                className="grid grid-cols-1 gap-5 md:grid-cols-2"
                            >
                                {publicJobs.length === 0 ? (
                                    <div className="col-span-full rounded-3xl border border-dashed border-zinc-300 bg-white/80 p-10 text-center dark:border-white/15 dark:bg-[#15190B]/60">
                                        <BriefcaseBusiness className="mx-auto size-8 text-[#E47818]" />
                                        <h3 className="mt-3 font-heading text-base font-bold text-zinc-900 dark:text-white">
                                            No Open Job Postings Published Yet
                                        </h3>
                                        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                            Verified corporate and institutional
                                            partners can publish career openings
                                            directly to the SEAIT Job Board once
                                            approved.
                                        </p>
                                    </div>
                                ) : filteredJobs.length > 0 ? (
                                    filteredJobs.map((job) => {
                                        const isCopied =
                                            copiedKey === `job-${job.id}`;
                                        return (
                                            <article
                                                key={job.id}
                                                className="group flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs transition hover:border-[#E47818]/40 sm:p-6 dark:border-white/10 dark:bg-[#15190B]"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap sm:gap-4">
                                                    <div className="flex min-w-0 items-start gap-3.5">
                                                        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-[#E47818] dark:border-orange-500/30 dark:text-orange-400">
                                                            <BriefcaseBusiness className="size-5" />
                                                        </span>
                                                        <div>
                                                            <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                                                                {
                                                                    job.company_name
                                                                }{' '}
                                                                · {job.industry}
                                                            </p>
                                                            <h3 className="mt-1 font-heading text-lg font-bold text-zinc-900 transition group-hover:text-[#E47818] dark:text-white dark:group-hover:text-orange-400">
                                                                {job.title}
                                                            </h3>
                                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                                                <MapPin className="size-3.5 text-[#E47818]" />
                                                                {job.location} ·{' '}
                                                                {
                                                                    job.workplace_type
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="shrink-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[10px] font-bold tracking-wider text-teal-800 uppercase dark:border-teal-500/30 dark:bg-teal-950/60 dark:text-teal-300">
                                                        {job.employment_type}
                                                    </span>
                                                </div>

                                                <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                                                    {job.description}
                                                </p>

                                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4 dark:border-white/10">
                                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                        {job.closes_at
                                                            ? `Closes ${job.closes_at}`
                                                            : 'Open for applications'}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                copyShareLink(
                                                                    'job',
                                                                    job.id,
                                                                )
                                                            }
                                                            aria-label={`Copy direct link to ${job.title}`}
                                                            className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-teal-600 hover:text-teal-700 dark:border-white/10 dark:bg-[#0A1006] dark:text-zinc-300 dark:hover:border-teal-400 dark:hover:text-teal-300"
                                                        >
                                                            {isCopied ? (
                                                                <>
                                                                    <Check className="size-3.5 text-teal-600 dark:text-teal-400" />
                                                                    <span className="text-teal-700 dark:text-teal-300">
                                                                        Copied
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Share2 className="size-3.5" />
                                                                    Share
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openJobModal(
                                                                    job,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#E47818] px-3.5 py-1.5 font-heading text-xs font-bold text-white transition hover:bg-[#F36C21]"
                                                        >
                                                            Job Details
                                                            <ArrowUpRight className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full rounded-2xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 dark:border-white/10 dark:bg-[#15190B] dark:text-zinc-400">
                                        No job postings match your current search
                                        or workplace filter.
                                    </div>
                                )}
                            </div>

                            {/* Employer Partner Callout */}
                            <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl border border-orange-500/30 bg-gradient-to-r from-zinc-900 via-[#0B1B1A] to-[#072422] p-6 text-white sm:flex-row sm:items-center sm:p-8">
                                <div>
                                    <span className="font-heading text-xs font-bold tracking-wider text-orange-400 uppercase">
                                        Hiring SEAIT Graduates?
                                    </span>
                                    <p className="mt-1 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                                        Register your organization as a verified
                                        SEAIT Employer Partner to publish career
                                        openings and review alumni applicants.
                                    </p>
                                </div>
                                <Link
                                    href={
                                        isAuthenticated
                                            ? '/dashboard?page=Job+postings'
                                            : '/register?type=employer'
                                    }
                                    className="inline-flex h-11 shrink-0 items-center rounded-xl bg-[#E47818] px-5 font-heading text-xs font-bold text-white shadow-lg shadow-orange-950/40 transition hover:bg-[#F36C21]"
                                >
                                    {isAuthenticated
                                        ? 'Open Employer Workspace'
                                        : 'Employer Partner Registration'}
                                    <ArrowRight className="ml-2 size-3.5" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Upcoming Alumni Events Section (Standardized py-20 + seait.edu.ph Calendar Date Badge Style) */}
                    <section
                        id="events"
                        className="border-t border-zinc-200/80 bg-white py-20 dark:border-white/10 dark:bg-[#0A1006]"
                    >
                        <div className="mx-auto max-w-6xl px-4 sm:px-8">
                            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                                <div>
                                    <span className="text-xs font-bold tracking-wider text-[#E47818] uppercase">
                                        Institutional Schedule · Crossing Rubber, Tupi
                                    </span>
                                    <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl dark:text-white">
                                        Upcoming Alumni & Campus Events
                                    </h2>
                                    <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                                        Homecomings, career fairs, and
                                        department assemblies for the SEAIT
                                        alumni community.
                                    </p>
                                </div>
                                <Link
                                    href={
                                        isAuthenticated
                                            ? '/dashboard?page=Events'
                                            : register()
                                    }
                                    className="inline-flex items-center gap-1.5 font-heading text-xs font-bold text-[#E47818] transition hover:text-[#CD7A30]"
                                >
                                    {isAuthenticated
                                        ? 'Manage Event RSVPs'
                                        : 'Claim Account to RSVP'}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>

                            {publicEvents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {publicEvents.map((ev) => {
                                        const isCopied =
                                            copiedKey === `event-${ev.id}`;
                                        return (
                                            <article
                                                key={ev.id}
                                                className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-6 transition-all hover:border-teal-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#15190B]"
                                            >
                                                <div>
                                                    <div className="mb-4 flex items-start justify-between gap-3">
                                                        <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-xs transition-transform group-hover:scale-105">
                                                            <span className="text-[10px] font-bold tracking-widest uppercase">
                                                                {ev.month}
                                                            </span>
                                                            <span className="mt-0.5 font-heading text-xl leading-none font-black">
                                                                {ev.day}
                                                            </span>
                                                        </div>
                                                        <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-teal-800 uppercase dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                                                            {ev.badge}
                                                        </span>
                                                    </div>

                                                    <h3 className="line-clamp-2 font-heading text-lg leading-snug font-bold tracking-tight text-zinc-900 transition group-hover:text-[#E47818] dark:text-white dark:group-hover:text-orange-400">
                                                        {ev.title}
                                                    </h3>
                                                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                                                        {ev.summary}
                                                    </p>
                                                </div>

                                                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200/70 pt-3.5 text-[11px] text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                                                    <span className="flex items-center gap-1.5 font-medium">
                                                        <Calendar className="size-3.5 shrink-0 text-[#E47818]" />
                                                        <span className="truncate">
                                                            {ev.timeAndVenue}
                                                        </span>
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                copyShareLink(
                                                                    'event',
                                                                    ev.id,
                                                                )
                                                            }
                                                            aria-label={`Copy direct link to ${ev.title}`}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-teal-600 hover:text-teal-700 dark:border-white/10 dark:bg-[#0A1006] dark:text-zinc-300 dark:hover:border-teal-400 dark:hover:text-teal-300"
                                                        >
                                                            {isCopied ? (
                                                                <>
                                                                    <Check className="size-3 text-teal-600 dark:text-teal-400" />
                                                                    <span className="text-teal-700 dark:text-teal-300">
                                                                        Copied
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Share2 className="size-3" />
                                                                    Share
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEventModal(
                                                                    ev,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 font-heading text-xs font-bold text-[#E47818] transition hover:text-[#CD7A30]"
                                                        >
                                                            Details
                                                            <ArrowRight className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-dashed border-zinc-300 bg-[#F5F4EE]/60 p-10 text-center dark:border-white/15 dark:bg-[#15190B]/60">
                                    <Calendar className="mx-auto size-8 text-teal-600 dark:text-teal-400" />
                                    <h3 className="mt-3 font-heading text-base font-bold text-zinc-900 dark:text-white">
                                        No Upcoming Events Scheduled Yet
                                    </h3>
                                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        Upcoming SEAIT alumni homecomings,
                                        career fairs, and campus activities will
                                        appear here once scheduled.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Bottom Call to Action Banner (Standardized py-20) */}
                    <section className="border-t border-zinc-200/80 bg-[#F5F4EE] py-20 dark:border-white/10 dark:bg-[#0E1406]">
                        <div className="mx-auto max-w-6xl px-4 sm:px-8">
                            <div className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-orange-500/30 bg-gradient-to-r from-zinc-900 via-[#0B1B1A] to-[#072422] p-8 text-white shadow-2xl sm:p-12 lg:flex-row lg:items-center">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <img
                                        src="/images/seait-logo.png"
                                        alt="SEAIT Official Seal"
                                        className="size-16 shrink-0 rounded-2xl border border-white/15 bg-white/10 p-1.5 object-contain"
                                    />
                                    <div>
                                        <p className="font-heading text-xs font-bold tracking-widest text-orange-300 uppercase">
                                            Ready to Verify Your Pathway at SEAIT?
                                        </p>
                                        <h2 className="mt-1 max-w-xl font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                            Claim your official alumni record &
                                            strengthen SEAIT’s accreditation.
                                        </h2>
                                    </div>
                                </div>
                                <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
                                    <Link
                                        href={
                                            isAuthenticated
                                                ? '/dashboard'
                                                : register()
                                        }
                                        className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-[#E47818] px-6 font-heading text-xs font-bold whitespace-nowrap text-white shadow-lg shadow-orange-950/40 transition hover:bg-[#F36C21] sm:w-56 sm:text-sm"
                                    >
                                        {isAuthenticated
                                            ? 'Open Alumni Portal'
                                            : 'Claim Alumni Record'}
                                        <ArrowRight className="ml-2 size-4 shrink-0" />
                                    </Link>
                                    {!isAuthenticated && (
                                        <Link
                                            href="/register?type=employer"
                                            className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 font-heading text-xs font-bold whitespace-nowrap text-white transition hover:bg-white/15 sm:w-56 sm:text-sm"
                                        >
                                            Employer Registration
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Institutional Footer (seait.edu.ph campus offices & directory pattern) */}
                <footer className="border-t border-zinc-200/80 bg-[#0A1006] text-white dark:border-white/10">
                    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
                        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
                            <div className="md:col-span-5">
                                <div className="flex items-center gap-3.5">
                                    <img
                                        src="/images/seait-logo.png"
                                        alt="SEAIT Seal"
                                        className="size-11 object-contain"
                                    />
                                    <div>
                                        <p className="font-heading text-sm font-extrabold text-white">
                                            South East Asian Institute of
                                            Technology, Inc.
                                        </p>
                                        <p className="font-heading text-xs font-semibold text-orange-400">
                                            Alumni Tracer Management System (ATMS)
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-4 max-w-md text-xs leading-relaxed text-zinc-400">
                                    A centralized platform for tracking,
                                    managing, and analyzing graduate outcomes in
                                    support of institutional excellence and CHED
                                    accreditation.
                                </p>
                                <p className="mt-3 font-heading text-[11px] font-bold tracking-wider text-teal-400 uppercase">
                                    “Committed to The Total Development of The Student.”
                                </p>
                            </div>

                            <div className="md:col-span-4">
                                <h3 className="font-heading text-xs font-bold tracking-wider text-orange-400 uppercase">
                                    Campus Help Desk & Directory
                                </h3>
                                <ul className="mt-3.5 space-y-2.5 text-xs text-zinc-300">
                                    <li className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 size-4 shrink-0 text-orange-400" />
                                        <span>
                                            National Highway, Crossing Rubber,
                                            Tupi, South Cotabato, Philippines
                                            9505
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Mail className="size-4 shrink-0 text-orange-400" />
                                        <a
                                            href="mailto:support@seait.edu.ph"
                                            className="transition hover:text-orange-400"
                                        >
                                            support@seait.edu.ph
                                        </a>
                                        <span className="text-zinc-600"></span>

                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Phone className="size-4 shrink-0 text-orange-400" />
                                        <a
                                            href="tel:+63832281234"
                                            className="transition hover:text-orange-400"
                                        >
                                            +63 (083) 228-1234
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <a
                                            href="https://www.facebook.com/SEAITOfficial"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 transition hover:text-orange-400"
                                        >
                                            <Facebook className="size-4 shrink-0 text-orange-400" />
                                            <span>facebook.com/SEAITOfficial</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div className="md:col-span-3">
                                <h3 className="font-heading text-xs font-bold tracking-wider text-orange-400 uppercase">
                                    Campus Services & Links
                                </h3>
                                <ul className="mt-3.5 space-y-2 text-xs text-zinc-300">
                                    <li>
                                        <a
                                            href="#tracer-study"
                                            className="transition hover:text-orange-400"
                                        >
                                            CHED Graduate Tracer Study
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#tracer-metrics"
                                            className="transition hover:text-orange-400"
                                        >
                                            Live Institutional Outcomes
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#opportunities"
                                            className="transition hover:text-orange-400"
                                        >
                                            Verified Alumni Job Board
                                        </a>
                                    </li>
                                    <li>
                                        <Link
                                            href="/alumni/registration-assistance"
                                            className="transition hover:text-orange-400"
                                        >
                                            Registrar Claim Assistance
                                        </Link>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openLegalModal('terms')
                                            }
                                            className="cursor-pointer text-left transition hover:text-orange-400"
                                        >
                                            Terms & Conditions
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openLegalModal('privacy')
                                            }
                                            className="cursor-pointer text-left transition hover:text-orange-400"
                                        >
                                            Data Privacy Policy (RA 10173)
                                        </button>
                                    </li>
                                    <li>
                                        <a
                                            href="https://seait.edu.ph/"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-teal-300 transition hover:text-orange-400"
                                        >
                                            Main Institutional Website
                                            <ExternalLink className="size-3" />
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[11px] text-zinc-500 sm:flex-row">
                            <p>
                                © {new Date().getFullYear()} South East Asian
                                Institute of Technology, Inc. (SEAIT). All
                                rights reserved.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => openLegalModal('terms')}
                                    className="cursor-pointer transition hover:text-zinc-300"
                                >
                                    Terms & Conditions
                                </button>
                                <span>·</span>
                                <button
                                    type="button"
                                    onClick={() => openLegalModal('privacy')}
                                    className="cursor-pointer transition hover:text-zinc-300"
                                >
                                    Privacy Policy
                                </button>

                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Public Job Details Modal (Light & Dark Adaptive) */}
            {selectedJob && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="public-job-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                >
                    <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl sm:p-7 dark:border-white/15 dark:bg-[#15190B] dark:text-[#F5F4EE]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-[10px] font-bold text-teal-700 uppercase dark:bg-teal-500/15 dark:text-teal-300">
                                    <CheckCircle2 className="size-3" />
                                    Verified SEAIT Employer Partner
                                </span>
                                <h2
                                    id="public-job-title"
                                    className="mt-2.5 font-heading text-xl font-bold text-zinc-900 dark:text-white"
                                >
                                    {selectedJob.title}
                                </h2>
                                <p className="mt-1 text-xs font-medium text-[#E47818] dark:text-orange-400">
                                    {selectedJob.company_name} ·{' '}
                                    {selectedJob.industry}
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close job details"
                                onClick={closeAllModals}
                                className="flex size-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-[#E47818] hover:text-[#E47818] dark:border-white/15 dark:text-zinc-300"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-700 dark:border-white/10 dark:bg-[#0A1006] dark:text-zinc-200">
                                {selectedJob.location}
                            </span>
                            <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-700 dark:border-white/10 dark:bg-[#0A1006] dark:text-zinc-200">
                                {selectedJob.workplace_type}
                            </span>
                            <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-700 dark:border-white/10 dark:bg-[#0A1006] dark:text-zinc-200">
                                {selectedJob.employment_type}
                            </span>
                            {(selectedJob.salary_min ||
                                selectedJob.salary_max) && (
                                    <span className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 font-bold text-[#E47818] dark:bg-orange-500/15 dark:text-orange-300">
                                        ₱
                                        {selectedJob.salary_min?.toLocaleString() ??
                                            '—'}{' '}
                                        – ₱
                                        {selectedJob.salary_max?.toLocaleString() ??
                                            '—'}
                                    </span>
                                )}
                        </div>

                        <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-white/10">
                            <h3 className="font-heading text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                                Role Description
                            </h3>
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                                {selectedJob.description}
                            </p>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() =>
                                    copyShareLink('job', selectedJob.id)
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-teal-600 hover:text-teal-700 dark:border-white/15 dark:bg-[#0A1006] dark:text-zinc-200 dark:hover:border-teal-400 dark:hover:text-teal-300"
                            >
                                {copiedKey === `job-${selectedJob.id}` ? (
                                    <>
                                        <Check className="size-3.5 text-teal-600 dark:text-teal-400" />
                                        <span className="text-teal-700 dark:text-teal-300">
                                            Share Link Copied!
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="size-3.5" />
                                        Copy Share Link
                                    </>
                                )}
                            </button>

                            <div className="flex flex-wrap gap-2">
                                {isAuthenticated ? (
                                    <Link
                                        href="/dashboard?page=Career+opportunities"
                                        className="inline-flex h-10 items-center rounded-xl bg-[#E47818] px-5 font-heading text-xs font-bold text-white transition hover:bg-[#F36C21]"
                                    >
                                        Apply in Career Portal
                                        <ArrowRight className="ml-2 size-3.5" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="inline-flex h-10 items-center rounded-xl border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-800 hover:border-[#E47818] dark:border-white/15 dark:bg-[#0A1006] dark:text-white"
                                        >
                                            Sign in to Apply
                                        </Link>
                                        <Link
                                            href={register()}
                                            className="inline-flex h-10 items-center rounded-xl bg-[#E47818] px-5 font-heading text-xs font-bold text-white hover:bg-[#F36C21]"
                                        >
                                            Claim Alumni Account
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Public Announcement Reader Modal (Light & Dark Adaptive) */}
            {selectedAnnouncement && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="public-announcement-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                >
                    <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl sm:p-7 dark:border-white/15 dark:bg-[#15190B] dark:text-[#F5F4EE]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 font-heading text-[11px] font-bold text-[#E47818] uppercase dark:text-orange-400">
                                    <Megaphone className="size-3.5" />
                                    Official SEAIT Bulletin ·{' '}
                                    {selectedAnnouncement.published_at ??
                                        'Published'}
                                </span>
                                <h2
                                    id="public-announcement-title"
                                    className="mt-2 font-heading text-xl font-bold text-zinc-900 dark:text-white"
                                >
                                    {selectedAnnouncement.title}
                                </h2>
                            </div>
                            <button
                                type="button"
                                aria-label="Close announcement"
                                onClick={closeAllModals}
                                className="flex size-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-[#E47818] hover:text-[#E47818] dark:border-white/15 dark:text-zinc-300"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                            {selectedAnnouncement.body}
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-4 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() =>
                                    copyShareLink(
                                        'announcement',
                                        selectedAnnouncement.id,
                                    )
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-teal-600 hover:text-teal-700 dark:border-white/15 dark:bg-[#0A1006] dark:text-zinc-200 dark:hover:border-teal-400 dark:hover:text-teal-300"
                            >
                                {copiedKey ===
                                    `announcement-${selectedAnnouncement.id}` ? (
                                    <>
                                        <Check className="size-3.5 text-teal-600 dark:text-teal-400" />
                                        <span className="text-teal-700 dark:text-teal-300">
                                            Share Link Copied!
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="size-3.5" />
                                        Copy Share Link
                                    </>
                                )}
                            </button>

                            <Link
                                href={
                                    isAuthenticated
                                        ? '/dashboard?page=Announcements'
                                        : login()
                                }
                                className="inline-flex h-10 items-center rounded-xl bg-[#E47818] px-5 font-heading text-xs font-bold text-white hover:bg-[#F36C21]"
                            >
                                {isAuthenticated
                                    ? 'Open Portal Bulletins'
                                    : 'Sign in to Portal'}
                                <ArrowRight className="ml-2 size-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Upcoming Event Details Modal (Light & Dark Adaptive) */}
            {selectedEvent && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="public-event-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                >
                    <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl sm:p-7 dark:border-white/15 dark:bg-[#15190B] dark:text-[#F5F4EE]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 font-heading text-[11px] font-bold text-teal-700 uppercase dark:text-teal-300">
                                    <Calendar className="size-3.5" />
                                    {selectedEvent.badge} ·{' '}
                                    {selectedEvent.timeAndVenue}
                                </span>
                                <h2
                                    id="public-event-title"
                                    className="mt-2 font-heading text-xl font-bold text-zinc-900 dark:text-white"
                                >
                                    {selectedEvent.title}
                                </h2>
                            </div>
                            <button
                                type="button"
                                aria-label="Close event details"
                                onClick={closeAllModals}
                                className="flex size-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-[#E47818] hover:text-[#E47818] dark:border-white/15 dark:text-zinc-300"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                            {selectedEvent.details}
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-4 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() =>
                                    copyShareLink('event', selectedEvent.id)
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-teal-600 hover:text-teal-700 dark:border-white/15 dark:bg-[#0A1006] dark:text-zinc-200 dark:hover:border-teal-400 dark:hover:text-teal-300"
                            >
                                {copiedKey === `event-${selectedEvent.id}` ? (
                                    <>
                                        <Check className="size-3.5 text-teal-600 dark:text-teal-400" />
                                        <span className="text-teal-700 dark:text-teal-300">
                                            Share Link Copied!
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="size-3.5" />
                                        Copy Share Link
                                    </>
                                )}
                            </button>

                            <Link
                                href={
                                    isAuthenticated
                                        ? '/dashboard?page=Events'
                                        : register()
                                }
                                className="inline-flex h-10 items-center rounded-xl bg-[#E47818] px-5 font-heading text-xs font-bold text-white hover:bg-[#F36C21]"
                            >
                                {isAuthenticated
                                    ? 'Open Portal Events & RSVP'
                                    : 'Claim Account to RSVP'}
                                <ArrowRight className="ml-2 size-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Official SEAIT Terms & Conditions / Privacy Policy Modal (Exact seait.edu.ph Legal Content) */}
            {selectedLegalDoc && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="public-legal-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                >
                    <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-[#F5F4EE] text-zinc-900 shadow-2xl dark:border-white/15 dark:bg-[#0E1406] dark:text-[#F5F4EE]">
                        {/* Modal Header with Tab Switcher */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#15190B]">
                            <div>
                                <span className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-wider text-[#E47818] uppercase dark:text-orange-400">
                                    <ShieldCheck className="size-3.5" />
                                    {selectedLegalDoc === 'terms'
                                        ? 'Institutional Governance & Terms'
                                        : 'RA 10173 Data Privacy Act Compliance'}
                                </span>
                                <h2
                                    id="public-legal-title"
                                    className="mt-0.5 font-heading text-xl font-extrabold text-zinc-900 sm:text-2xl dark:text-white"
                                >
                                    {selectedLegalDoc === 'terms' ? (
                                        <>
                                            Terms &{' '}
                                            <span className="text-[#E47818]">
                                                Conditions
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            Privacy{' '}
                                            <span className="text-[#E47818]">
                                                Policy
                                            </span>
                                        </>
                                    )}
                                </h2>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 text-xs font-semibold dark:border-white/10 dark:bg-[#0A1006]">
                                    <button
                                        type="button"
                                        onClick={() => openLegalModal('terms')}
                                        className={`rounded-lg px-3 py-1.5 transition ${
                                            selectedLegalDoc === 'terms'
                                                ? 'bg-[#E47818] text-white shadow-2xs'
                                                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                                        }`}
                                    >
                                        Terms & Conditions
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openLegalModal('privacy')
                                        }
                                        className={`rounded-lg px-3 py-1.5 transition ${
                                            selectedLegalDoc === 'privacy'
                                                ? 'bg-[#E47818] text-white shadow-2xs'
                                                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                                        }`}
                                    >
                                        Privacy Policy
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Close legal document"
                                    onClick={closeAllModals}
                                    className="flex size-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-[#E47818] hover:text-[#E47818] dark:border-white/15 dark:text-zinc-300"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                            {selectedLegalDoc === 'terms' ? (
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                    {/* Sidebar Directory & Legal Desk */}
                                    <aside className="space-y-4 lg:col-span-4">
                                        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <span className="mb-2.5 block font-heading text-[11px] font-bold tracking-widest text-[#E47818] uppercase">
                                                Terms Directory
                                            </span>
                                            <ul className="space-y-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                                {[
                                                    [
                                                        '01',
                                                        'Acceptance & Institutional Scope',
                                                    ],
                                                    [
                                                        '02',
                                                        'Campus Acceptable Use Policy (AUP)',
                                                    ],
                                                    [
                                                        '03',
                                                        'Authorized Access & RA 10175',
                                                    ],
                                                    [
                                                        '04',
                                                        'Intellectual Property & Copyright',
                                                    ],
                                                    [
                                                        '05',
                                                        'Limitation of Liability & External Links',
                                                    ],
                                                    [
                                                        '06',
                                                        'Governing Law & Dispute Resolution',
                                                    ],
                                                ].map(([num, label]) => (
                                                    <li
                                                        key={num}
                                                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5"
                                                    >
                                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-orange-200/60 bg-orange-50 text-[10px] font-bold text-[#E47818] dark:border-orange-900/50 dark:bg-orange-950/50">
                                                            {num}
                                                        </span>
                                                        <span className="truncate">
                                                            {label}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="space-y-2.5 rounded-2xl border border-zinc-800 bg-[#050D0C] p-5 text-white shadow-md">
                                            <span className="block font-heading text-[11px] font-bold tracking-widest text-orange-400 uppercase">
                                                Institutional Legal Desk
                                            </span>
                                            <h3 className="font-heading text-sm font-bold">
                                                Questions on Governance?
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-300">
                                                For questions regarding website
                                                terms, copyright clearances, or
                                                institutional policies, reach
                                                out to the Administration
                                                Office.
                                            </p>
                                            <div className="space-y-1 pt-1 text-xs text-zinc-400">
                                                <div>
                                                    <strong className="text-white">
                                                        Location:
                                                    </strong>{' '}
                                                    Crossing Rubber, Tupi, South
                                                    Cotabato
                                                </div>
                                                <div>
                                                    <strong className="text-white">
                                                        Email:
                                                    </strong>{' '}
                                                    <a
                                                        href="mailto:support@seait.edu.ph"
                                                        className="text-orange-400 hover:underline"
                                                    >
                                                        support@seait.edu.ph
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </aside>

                                    {/* 6 Official Terms Articles */}
                                    <div className="space-y-5 lg:col-span-8">
                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-orange-200/60 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[#E47818] uppercase dark:border-orange-900/50 dark:bg-orange-950/50">
                                                    Section 01
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    Binding Institutional Agreement
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Acceptance of Terms & Scope
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                Welcome to the official
                                                institutional portal of{' '}
                                                <strong>
                                                    South East Asian Institute
                                                    of Technology, Inc. (SEAIT)
                                                </strong>
                                                . By accessing, browsing, or
                                                using this website, you
                                                acknowledge that you have read,
                                                understood, and agree to be
                                                bound by these Terms and
                                                Conditions, together with our{' '}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openLegalModal(
                                                            'privacy',
                                                        )
                                                    }
                                                    className="font-semibold text-[#E47818] hover:underline"
                                                >
                                                    Privacy Policy
                                                </button>{' '}
                                                and all applicable Philippine
                                                laws and regulations.
                                            </p>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                If you do not agree with any
                                                part of these Terms, you must
                                                discontinue your use of this
                                                digital portal immediately.
                                            </p>
                                        </article>

                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-amber-200/60 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-amber-700 uppercase dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300">
                                                    Section 02
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    Campus Rule
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Campus Acceptable Use Policy
                                                (AUP)
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                Students, faculty, staff,
                                                alumni, and visitors accessing
                                                the SEAIT network, online
                                                pre-registration portals, alumni
                                                tracer hubs, and institutional
                                                digital resources must conduct
                                                themselves ethically and
                                                responsibly.
                                            </p>
                                            <div className="rounded-xl border border-zinc-200/70 bg-zinc-50 p-4 text-xs dark:border-white/10 dark:bg-[#0A1006]">
                                                <h4 className="font-bold text-zinc-900 dark:text-white">
                                                    Prohibited Activities
                                                    include:
                                                </h4>
                                                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-zinc-600 dark:text-zinc-300">
                                                    <li>
                                                        Submitting fraudulent
                                                        academic documents,
                                                        counterfeit
                                                        identification, or
                                                        falsified personal
                                                        information during
                                                        account claiming or
                                                        inquiry submission.
                                                    </li>
                                                    <li>
                                                        Attempting unauthorized
                                                        vulnerability probing,
                                                        penetration testing,
                                                        denial of service (DoS),
                                                        or packet interception
                                                        against SEAIT servers.
                                                    </li>
                                                    <li>
                                                        Disseminating unlawful,
                                                        defamatory, harassing,
                                                        or sexually explicit
                                                        content through
                                                        institutional contact
                                                        forms or communication
                                                        channels.
                                                    </li>
                                                    <li>
                                                        Sharing, lending, or
                                                        compromising
                                                        administrative or
                                                        academic staff
                                                        credentials.
                                                    </li>
                                                </ul>
                                            </div>
                                        </article>

                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-teal-200/60 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-teal-700 uppercase dark:border-teal-900/50 dark:bg-teal-950/50 dark:text-teal-300">
                                                    Section 03
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    RA 10175 Cybercrime
                                                    Prevention Act Compliant
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Authorized Access & Cybercrime
                                                Security
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                Administrative interfaces,
                                                database operations, and user
                                                management modules are
                                                restricted exclusively to
                                                authorized employees granted
                                                explicit credentials by the
                                                Board of Trustees and the
                                                President’s Office.
                                            </p>
                                            <div className="rounded-xl border border-zinc-200/70 bg-zinc-50 p-4 text-xs dark:border-white/10 dark:bg-[#0A1006]">
                                                <h4 className="font-bold text-zinc-900 dark:text-white">
                                                    Statutory Penalties
                                                </h4>
                                                <p className="mt-1.5 leading-relaxed text-zinc-600 dark:text-zinc-300">
                                                    Unauthorized attempts to
                                                    bypass security controls,
                                                    tamper with academic
                                                    records, or exfiltrate
                                                    applicant/alumni information
                                                    constitute violations under{' '}
                                                    <strong>
                                                        Republic Act No. 10175
                                                        (Cybercrime Prevention
                                                        Act of 2012)
                                                    </strong>{' '}
                                                    and will be referred to law
                                                    enforcement authorities for
                                                    criminal prosecution.
                                                </p>
                                            </div>
                                        </article>

                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-emerald-700 uppercase dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                    Section 04
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    Institutional Standard
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Intellectual Property &
                                                Copyright Policy
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                All editorial articles, campus
                                                photography, academic syllabi,
                                                360° virtual tour media,
                                                official seals, logos, and
                                                custom web graphics on this
                                                website are the proprietary
                                                intellectual property of South
                                                East Asian Institute of
                                                Technology, Inc. or utilized
                                                under authorized permission.
                                            </p>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                No portion of this portal may be
                                                reproduced, mirrored,
                                                republished, or redistributed
                                                for commercial gain without
                                                express written authorization
                                                from the SEAIT Board of
                                                Trustees.
                                            </p>
                                        </article>

                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-zinc-700 uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                    Section 05
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    Disclaimers & Portals
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Limitation of Liability &
                                                External Links
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                While SEAIT takes every
                                                reasonable measure to ensure
                                                academic calendars, tuition
                                                subsidy guidelines, and course
                                                requirements are accurate and
                                                up-to-date, institutional
                                                schedules and curriculum
                                                offerings are subject to
                                                official CHED, DepEd, and TESDA
                                                circular updates without prior
                                                notice.
                                            </p>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                Links to external platforms
                                                (such as government portals,
                                                scholarship boards, and
                                                educational accreditation
                                                bodies) are provided for
                                                convenience. SEAIT does not
                                                control and assumes no liability
                                                for external website contents,
                                                availability, or privacy
                                                practices.
                                            </p>
                                        </article>

                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-blue-200/60 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-blue-700 uppercase dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-300">
                                                    Section 06
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    Legal Jurisdiction
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Governing Law & Dispute
                                                Resolution
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                These Terms and Conditions shall
                                                be governed by, construed, and
                                                enforced in accordance with the
                                                laws of the{' '}
                                                <strong>
                                                    Republic of the Philippines
                                                </strong>
                                                . Any legal dispute or
                                                proceeding arising out of or
                                                related to the use of this
                                                website shall fall under the
                                                exclusive jurisdiction of the
                                                competent courts of South
                                                Cotabato, Philippines.
                                            </p>
                                        </article>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                    {/* Sidebar Privacy Directory & DPO Desk */}
                                    <aside className="space-y-4 lg:col-span-4">
                                        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <span className="mb-2.5 block font-heading text-[11px] font-bold tracking-widest text-[#E47818] uppercase">
                                                Privacy Notice Directory
                                            </span>
                                            <ul className="space-y-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                                {[
                                                    [
                                                        '01',
                                                        'Personal Information Controller & Scope',
                                                    ],
                                                    [
                                                        '02',
                                                        'Personal Data We Collect',
                                                    ],
                                                    [
                                                        '03',
                                                        'Purposes & UniFAST Admissions',
                                                    ],
                                                    [
                                                        '04',
                                                        'Data Security & Retention Schedule',
                                                    ],
                                                    [
                                                        '05',
                                                        'Third-Party Sharing & Disclosures',
                                                    ],
                                                    [
                                                        '06',
                                                        'Rights of Data Subjects & DPO Contact',
                                                    ],
                                                ].map(([num, label]) => (
                                                    <li
                                                        key={num}
                                                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5"
                                                    >
                                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-orange-200/60 bg-orange-50 text-[10px] font-bold text-[#E47818] dark:border-orange-900/50 dark:bg-orange-950/50">
                                                            {num}
                                                        </span>
                                                        <span className="truncate">
                                                            {label}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="space-y-2.5 rounded-2xl border border-zinc-800 bg-[#050D0C] p-5 text-white shadow-md">
                                            <span className="block font-heading text-[11px] font-bold tracking-widest text-orange-400 uppercase">
                                                Data Protection Officer (DPO)
                                            </span>
                                            <h3 className="font-heading text-sm font-bold">
                                                Exercise Your Privacy Rights
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-300">
                                                To request access, correction,
                                                or deletion of your personal
                                                data records, submit an official
                                                inquiry to the SEAIT Data
                                                Protection Office.
                                            </p>
                                            <div className="space-y-1 pt-1 text-xs text-zinc-400">
                                                <div>
                                                    <strong className="text-white">
                                                        Officer:
                                                    </strong>{' '}
                                                    Institutional Data
                                                    Protection Officer
                                                </div>
                                                <div>
                                                    <strong className="text-white">
                                                        Campus:
                                                    </strong>{' '}
                                                    National Highway, Crossing
                                                    Rubber, Tupi, South Cotabato
                                                </div>
                                                <div>
                                                    <strong className="text-white">
                                                        Email:
                                                    </strong>{' '}
                                                    <a
                                                        href="mailto:privacy@seait.edu.ph"
                                                        className="text-orange-400 hover:underline"
                                                    >
                                                        privacy@seait.edu.ph
                                                    </a>
                                                </div>
                                                <div>
                                                    <strong className="text-white">
                                                        Desk:
                                                    </strong>{' '}
                                                    <a
                                                        href="mailto:support@seait.edu.ph"
                                                        className="text-zinc-300 hover:underline"
                                                    >
                                                        support@seait.edu.ph
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </aside>

                                    {/* 6 Official Privacy Policy Notices */}
                                    <div className="space-y-5 lg:col-span-8">
                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-orange-200/60 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[#E47818] uppercase dark:border-orange-900/50 dark:bg-orange-950/50">
                                                    Notice 01
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    RA 10173 Statutory Mandate
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Personal Information Controller
                                                & Scope
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                <strong>
                                                    South East Asian Institute
                                                    of Technology, Inc. (SEAIT)
                                                </strong>
                                                , located at Crossing Rubber,
                                                Tupi, South Cotabato,
                                                Philippines, operates as the{' '}
                                                <strong>
                                                    Personal Information
                                                    Controller (PIC)
                                                </strong>{' '}
                                                under the{' '}
                                                <strong>
                                                    Philippine Data Privacy Act
                                                    of 2012 (Republic Act No.
                                                    10173)
                                                </strong>{' '}
                                                and its Implementing Rules and
                                                Regulations (IRR).
                                            </p>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                This Privacy Policy applies to
                                                all personal data collected
                                                through our public web portal,
                                                alumni tracer management system,
                                                online pre-registration
                                                services, campus inquiry help
                                                desks, academic management
                                                interfaces, and related
                                                institutional digital services.
                                            </p>
                                        </article>

                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-teal-200/60 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-teal-700 uppercase dark:border-teal-900/50 dark:bg-teal-950/50 dark:text-teal-300">
                                                    Notice 02
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    Transparency in Collection
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Personal Data We Collect
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                Depending on how you interact
                                                with SEAIT’s digital services,
                                                we collect the following
                                                categories of information:
                                            </p>
                                            <div className="space-y-2.5 text-xs">
                                                <div className="rounded-xl border border-zinc-200/70 bg-zinc-50 p-4 dark:border-white/10 dark:bg-[#0A1006]">
                                                    <h4 className="font-bold text-zinc-900 dark:text-white">
                                                        A. Alumni, Students &
                                                        Applicants
                                                    </h4>
                                                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-300">
                                                        <li>
                                                            Full legal name,
                                                            student ID number,
                                                            date of birth, email
                                                            address, mobile
                                                            contact number, and
                                                            permanent residence.
                                                        </li>
                                                        <li>
                                                            Academic program,
                                                            degree, graduation
                                                            cohort, employment
                                                            history, and
                                                            curriculum alignment
                                                            records.
                                                        </li>
                                                        <li>
                                                            System-generated
                                                            verification and
                                                            registration status.
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div className="rounded-xl border border-zinc-200/70 bg-zinc-50 p-4 dark:border-white/10 dark:bg-[#0A1006]">
                                                    <h4 className="font-bold text-zinc-900 dark:text-white">
                                                        B. Public Visitors &
                                                        Inquirers
                                                    </h4>
                                                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-300">
                                                        <li>
                                                            Name, email address,
                                                            inquiry topic,
                                                            recipient
                                                            department, and
                                                            message narrative.
                                                        </li>
                                                        <li>
                                                            Technical metadata
                                                            including IP
                                                            address, user-agent
                                                            string, and
                                                            timestamp for
                                                            anti-spam security.
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div className="rounded-xl border border-zinc-200/70 bg-zinc-50 p-4 dark:border-white/10 dark:bg-[#0A1006]">
                                                    <h4 className="font-bold text-zinc-900 dark:text-white">
                                                        C. Faculty, Staff &
                                                        Authorized Operators
                                                    </h4>
                                                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-300">
                                                        <li>
                                                            Institutional
                                                            username,
                                                            cryptographically
                                                            salted bcrypt hash,
                                                            role assignments,
                                                            and immutable
                                                            administrative audit
                                                            logs.
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </article>

                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-emerald-700 uppercase dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                    Notice 03
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    Legitimate Institutional
                                                    Purpose
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Purpose of Processing, Tracer &
                                                UniFAST Mandates
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                Personal data collected by SEAIT
                                                is processed strictly for
                                                legitimate educational,
                                                academic, and administrative
                                                functions:
                                            </p>
                                            <ul className="list-disc space-y-1.5 pl-5 text-xs text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                <li>
                                                    <strong>
                                                        CHED Graduate Tracer
                                                        Study (GTS):
                                                    </strong>{' '}
                                                    Evaluating graduate
                                                    employability, curriculum
                                                    relevance, and institutional
                                                    outcomes for accreditation.
                                                </li>
                                                <li>
                                                    <strong>
                                                        UniFAST 100% Free Higher
                                                        Education:
                                                    </strong>{' '}
                                                    Validating eligibility under{' '}
                                                    <strong>
                                                        Republic Act No. 10931
                                                    </strong>{' '}
                                                    for Philippine government
                                                    tuition subsidies and
                                                    Tertiary Education Subsidy
                                                    (TES) grants.
                                                </li>
                                                <li>
                                                    <strong>
                                                        Admissions, Enrollment &
                                                        Alumni Verification:
                                                    </strong>{' '}
                                                    Managing student and
                                                    graduate records, course
                                                    allocation, and verification
                                                    of student ID numbers.
                                                </li>
                                                <li>
                                                    <strong>
                                                        Statutory Compliance:
                                                    </strong>{' '}
                                                    Generating mandatory
                                                    statistical and regulatory
                                                    reports required by CHED,
                                                    DepEd, and TESDA.
                                                </li>
                                            </ul>
                                        </article>

                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-amber-200/60 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-amber-700 uppercase dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300">
                                                    Notice 04
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    Information Security &
                                                    Storage
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Data Security Safeguards &
                                                Retention Schedule
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                SEAIT maintains rigorous
                                                organizational, physical, and
                                                technical measures to safeguard
                                                personal data against accidental
                                                destruction, unauthorized
                                                disclosure, or unlawful
                                                modification:
                                            </p>
                                            <div className="space-y-2.5 text-xs">
                                                <div className="rounded-xl border border-zinc-200/70 bg-zinc-50 p-4 dark:border-white/10 dark:bg-[#0A1006]">
                                                    <h4 className="font-bold text-zinc-900 dark:text-white">
                                                        Storage & Encryption
                                                        Standards
                                                    </h4>
                                                    <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-300">
                                                        Data in transit is
                                                        protected using TLS 1.3
                                                        / HTTPS encryption.
                                                        Administrative access
                                                        requires authenticated
                                                        session cookies with
                                                        strict HTTP-only and
                                                        Secure flags. Passwords
                                                        are never stored in
                                                        plaintext and utilize
                                                        industry-standard bcrypt
                                                        hashing.
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-zinc-200/70 bg-zinc-50 p-4 dark:border-white/10 dark:bg-[#0A1006]">
                                                    <h4 className="font-bold text-zinc-900 dark:text-white">
                                                        Retention Schedule
                                                    </h4>
                                                    <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-300">
                                                        Official student
                                                        academic transcripts and
                                                        permanent alumni records
                                                        are preserved
                                                        permanently as mandated
                                                        by the Commission on
                                                        Higher Education (CHED).
                                                        Unenrolled
                                                        pre-registration
                                                        applications and general
                                                        website inquiries are
                                                        retained for up to three
                                                        (3) academic years
                                                        before safe,
                                                        irreversible
                                                        anonymization.
                                                    </p>
                                                </div>
                                            </div>
                                        </article>

                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-blue-200/60 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-blue-700 uppercase dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-300">
                                                    Notice 05
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    Statutory Disclosure Limits
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Third-Party Sharing & Regulatory
                                                Disclosures
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                SEAIT does not sell, lease, or
                                                monetize student, alumni, or
                                                visitor personal data to
                                                commercial advertisers or
                                                third-party marketing brokers
                                                under any circumstances.
                                            </p>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                Disclosures of personal data are
                                                made solely under strict
                                                institutional oversight to
                                                authorized Philippine government
                                                entities, including the
                                                Commission on Higher Education
                                                (CHED), Department of Education
                                                (DepEd), Technical Education and
                                                Skills Development Authority
                                                (TESDA), Unified Student
                                                Financial Assistance System for
                                                Tertiary Education (UniFAST),
                                                and relevant law enforcement
                                                bodies upon valid court order.
                                            </p>
                                        </article>

                                        <article className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-[#15190B]">
                                            <div className="flex items-center gap-2.5">
                                                <span className="rounded-md border border-orange-200/60 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[#E47818] uppercase dark:border-orange-900/50 dark:bg-orange-950/50">
                                                    Notice 06
                                                </span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    Data Subject Protections
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
                                                Rights of Data Subjects & How to
                                                Inquire
                                            </h3>
                                            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">
                                                Under the Data Privacy Act of
                                                2012 (RA 10173), students,
                                                alumni, parents, faculty, staff,
                                                and visitors possess the
                                                following statutory rights:
                                            </p>
                                            <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
                                                {[
                                                    [
                                                        'Right to be Informed',
                                                        'Know whether your personal data is being processed and understand the purpose.',
                                                    ],
                                                    [
                                                        'Right to Access',
                                                        'Request reasonable access to the specific personal data held in institutional databases.',
                                                    ],
                                                    [
                                                        'Right to Rectification',
                                                        'Dispute inaccuracies or errors in your official academic records and request correction.',
                                                    ],
                                                    [
                                                        'Right to File a Complaint',
                                                        'File complaints regarding privacy violations with the National Privacy Commission (NPC).',
                                                    ],
                                                ].map(([title, desc]) => (
                                                    <div
                                                        key={title}
                                                        className="rounded-xl border border-zinc-200/70 bg-zinc-50 p-3.5 dark:border-white/10 dark:bg-[#0A1006]"
                                                    >
                                                        <h4 className="font-bold text-zinc-900 dark:text-white">
                                                            {title}
                                                        </h4>
                                                        <p className="mt-1 leading-relaxed text-zinc-500 dark:text-zinc-400">
                                                            {desc}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="pt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                                                To exercise any of these rights,
                                                contact the Institutional Data
                                                Protection Officer at{' '}
                                                <a
                                                    href="mailto:privacy@seait.edu.ph"
                                                    className="font-semibold text-[#E47818] hover:underline"
                                                >
                                                    privacy@seait.edu.ph
                                                </a>{' '}
                                                or visit the Main Administration
                                                Building, Crossing Rubber, Tupi,
                                                South Cotabato.
                                            </p>
                                        </article>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-white px-6 py-4 text-xs dark:border-white/10 dark:bg-[#15190B]">
                            <span className="text-zinc-500 dark:text-zinc-400">
                                South East Asian Institute of Technology, Inc. ·
                                Crossing Rubber, Tupi, South Cotabato
                            </span>
                            <button
                                type="button"
                                onClick={closeAllModals}
                                className="inline-flex h-9 items-center rounded-xl bg-[#E47818] px-5 font-heading text-xs font-bold text-white transition hover:bg-[#F36C21]"
                            >
                                Done Reading
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
