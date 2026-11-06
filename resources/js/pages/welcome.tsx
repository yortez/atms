import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BriefcaseBusiness,
    Building2,
    Calendar,
    CheckCircle2,
    GraduationCap,
    MapPin,
    Megaphone,
    Menu,
    MoveUpRight,
    Search,
    ShieldCheck,
    UsersRound,
    X,
} from 'lucide-react';
import { useState } from 'react';
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
    programs: Array<{
        id: number;
        code: string;
        name: string;
    }>;
};

type WelcomeProps = {
    publicStats?: {
        graduates_count: number;
        programs_count: number;
        departments_count: number;
        open_jobs_count: number;
    };
    publicAnnouncements?: PublicAnnouncement[];
    publicJobs?: PublicJob[];
    publicDepartments?: PublicDepartment[];
};

const highlights = [
    {
        eyebrow: 'ALUMNI NETWORK',
        title: 'Your story is part of ours.',
        description:
            'Reconnect with classmates, share where your journey has taken you, and help the next generation find their way.',
        icon: UsersRound,
        tone: 'bg-[#e9f1e7] text-[#42634a]',
        portalPage: 'My profile',
    },
    {
        eyebrow: 'CAREER OPPORTUNITIES',
        title: 'Make your next move.',
        description:
            'Discover opportunities from verified employers and apply directly with your official Northfield alumni profile.',
        icon: BriefcaseBusiness,
        tone: 'bg-[#f5eadc] text-[#97673a]',
        portalPage: 'Career opportunities',
    },
    {
        eyebrow: 'GRADUATE TRACER & SURVEYS',
        title: 'Keep learning together.',
        description:
            'Update your employment history and participate in institutional tracer studies that shape academic excellence.',
        icon: GraduationCap,
        tone: 'bg-[#e7edf5] text-[#4c6484]',
        portalPage: 'Employment tracer',
    },
];

const fallbackAnnouncements: PublicAnnouncement[] = [
    {
        id: 101,
        title: '2026 Institutional Graduate Tracer Study Now Open',
        body: 'All Northfield College graduates are invited to claim their verified alumni account and update their current employment status and degree-alignment record for the annual institutional tracer study.',
        published_at: '2026-11-01',
    },
    {
        id: 102,
        title: 'Verified Employer Partner Recruitment Fair',
        body: 'Corporate partners across technology, finance, healthcare, and education are actively hiring Northfield alumni through our integrated Career Opportunities board.',
        published_at: '2026-10-24',
    },
    {
        id: 103,
        title: 'Registrar Verification & Claim Assistance Desk',
        body: 'Graduates who need help matching their Student Number, Last Name, or Date of Birth can submit an automated assistance request directly to their Department Coordinator.',
        published_at: '2026-10-15',
    },
];

const fallbackJobs: PublicJob[] = [
    {
        id: 201,
        company_name: 'Northstar Digital',
        industry: 'Information Technology',
        title: 'Product Designer',
        description:
            'Lead end-to-end user experience design for web and mobile platforms in collaboration with cross-functional engineering teams.',
        employment_type: 'Full-time',
        workplace_type: 'Hybrid',
        location: 'Makati City',
        salary_min: 45000,
        salary_max: 65000,
        closes_at: '2026-12-15',
        published_at: '2026-11-01',
    },
    {
        id: 202,
        company_name: 'Harbor & Pine Analytics',
        industry: 'Data & Consulting',
        title: 'Junior Data Analyst',
        description:
            'Analyze business intelligence datasets, build institutional dashboards, and support executive decision-making for enterprise clients.',
        employment_type: 'Full-time',
        workplace_type: 'On-site',
        location: 'Quezon City',
        salary_min: 36000,
        salary_max: 48000,
        closes_at: '2026-12-10',
        published_at: '2026-11-02',
    },
    {
        id: 203,
        company_name: 'Common Ground Labs',
        industry: 'Software Engineering',
        title: 'Full-Stack Web Developer',
        description:
            'Build modern TypeScript, React, and Laravel web applications for educational and enterprise organizations across the Philippines.',
        employment_type: 'Full-time',
        workplace_type: 'Remote',
        location: 'Remote · Philippines',
        salary_min: 55000,
        salary_max: 80000,
        closes_at: '2026-12-20',
        published_at: '2026-11-03',
    },
];

const upcomingEvents = [
    {
        id: 1,
        month: 'NOV',
        day: '21',
        badge: 'ON CAMPUS',
        timeAndVenue: '10:00 AM · Northfield Grand Hall',
        title: 'Alumni Homecoming 2026',
        summary:
            'A day to reconnect, celebrate milestone cohorts, and welcome the graduating class into the Northfield Alumni Association.',
        details:
            'Join fellow graduates, faculty members, and department coordinators for keynote talks, department networking lounges, campus tours, and the Distinguished Alumni Awards ceremony.',
    },
    {
        id: 2,
        month: 'DEC',
        day: '05',
        badge: 'CAREER FAIR',
        timeAndVenue: '1:00 PM · Innovation Center & Online',
        title: 'Northfield Career & Employer Partner Expo',
        summary:
            'Meet verified corporate partners hiring Northfield graduates for full-time, hybrid, and remote roles.',
        details:
            'Bring your updated alumni profile and resume snapshot. Verified employers will conduct on-the-spot portfolio reviews and fast-track interviews through the Alumni Job Portal.',
    },
];

export default function Welcome({
    publicStats,
    publicAnnouncements = [],
    publicJobs = [],
    publicDepartments = [],
}: WelcomeProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAuthenticated = Boolean(auth?.user);
    const [menuOpen, setMenuOpen] = useState(false);
    const [jobSearch, setJobSearch] = useState('');
    const [workplaceFilter, setWorkplaceFilter] = useState('All');
    const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null);
    const [selectedAnnouncement, setSelectedAnnouncement] =
        useState<PublicAnnouncement | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<
        (typeof upcomingEvents)[number] | null
    >(null);

    const announcements =
        publicAnnouncements.length > 0
            ? publicAnnouncements
            : fallbackAnnouncements;
    const jobs = publicJobs.length > 0 ? publicJobs : fallbackJobs;

    const filteredJobs = jobs.filter((job) => {
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

    const statItems = [
        [
            publicStats && publicStats.graduates_count > 0
                ? `${publicStats.graduates_count.toLocaleString()}+`
                : '12,400+',
            'verified alumni records',
        ],
        [
            publicStats && publicStats.programs_count > 0
                ? String(publicStats.programs_count)
                : '24',
            'academic programs',
        ],
        [
            publicStats && publicStats.open_jobs_count > 0
                ? String(publicStats.open_jobs_count)
                : String(jobs.length),
            'open career opportunities',
        ],
        ['One', 'Northfield community'],
    ];

    return (
        <>
            <Head title="Northfield College · Alumni Tracer & Career Portal" />
            <div className="min-h-screen bg-[#f7f7f2] text-[#222820]">
                <header className="sticky top-0 z-20 border-b border-[#e7e8df] bg-[#f7f7f2]/95 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                        <Link href="/" className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-xl bg-[#234a37] text-white">
                                <GraduationCap className="size-5" />
                            </span>
                            <span>
                                <span className="block text-sm font-bold tracking-tight">
                                    Northfield College
                                </span>
                                <span className="block text-[10px] font-semibold tracking-[0.17em] text-[#748074] uppercase">
                                    Alumni community
                                </span>
                            </span>
                        </Link>

                        <button
                            type="button"
                            aria-label="Toggle navigation"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="grid size-10 place-items-center rounded-full border border-[#dfe2d9] md:hidden"
                        >
                            <Menu className="size-5" />
                        </button>

                        <nav
                            className={`${menuOpen ? 'absolute top-full right-0 left-0 flex border-b border-[#e7e8df] bg-[#f7f7f2] p-5 shadow-lg' : 'hidden'} flex-col gap-5 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
                        >
                            <a
                                className="text-sm text-[#596158] hover:text-[#234a37]"
                                href="#community"
                                onClick={() => setMenuOpen(false)}
                            >
                                About
                            </a>
                            <a
                                className="text-sm text-[#596158] hover:text-[#234a37]"
                                href="#alumni-info"
                                onClick={() => setMenuOpen(false)}
                            >
                                Alumni Info
                            </a>
                            <a
                                className="text-sm text-[#596158] hover:text-[#234a37]"
                                href="#announcements"
                                onClick={() => setMenuOpen(false)}
                            >
                                Announcements
                            </a>
                            <a
                                className="text-sm text-[#596158] hover:text-[#234a37]"
                                href="#opportunities"
                                onClick={() => setMenuOpen(false)}
                            >
                                Job Board
                            </a>
                            <a
                                className="text-sm text-[#596158] hover:text-[#234a37]"
                                href="#events"
                                onClick={() => setMenuOpen(false)}
                            >
                                Events
                            </a>
                            {isAuthenticated ? (
                                <Link
                                    href="/dashboard"
                                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#234a37] px-5 text-sm font-semibold text-white transition hover:bg-[#183b2a]"
                                >
                                    Open dashboard
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                    <Link
                                        href={login()}
                                        className="text-sm font-semibold text-[#344038] hover:text-[#234a37]"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href="/register?type=employer"
                                        className="rounded-full border border-[#d6ddd3] bg-white px-4 py-2 text-xs font-semibold text-[#344038] transition hover:border-[#9eb29e]"
                                    >
                                        For Employers
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="inline-flex h-10 items-center justify-center rounded-full bg-[#234a37] px-5 text-sm font-semibold text-white transition hover:bg-[#183b2a]"
                                    >
                                        Claim Alumni Account
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                </header>

                <main>
                    {/* Hero Section */}
                    <section className="relative isolate overflow-hidden">
                        <div className="absolute -top-32 -right-36 -z-10 size-[34rem] rounded-full bg-[#e8eee3] blur-3xl" />
                        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-28">
                            <div>
                                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dfe5dc] bg-white/70 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#46624b]">
                                    <span className="size-2 rounded-full bg-[#71916e]" />
                                    ONE COMMUNITY, EVERY GENERATION
                                </div>
                                <h1 className="max-w-2xl text-5xl leading-[1.04] font-medium tracking-[-0.055em] text-[#1f2c23] sm:text-6xl lg:text-7xl">
                                    Wherever life takes you,{' '}
                                    <span className="font-serif text-[#668068] italic">
                                        you belong here.
                                    </span>
                                </h1>
                                <p className="mt-7 max-w-xl text-base leading-7 text-[#697168] sm:text-lg sm:leading-8">
                                    A home for every Northfield graduate.
                                    Claim your verified alumni record, update
                                    your career tracer, and discover
                                    opportunities from trusted employer
                                    partners.
                                </p>
                                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href={
                                            isAuthenticated
                                                ? '/dashboard'
                                                : register()
                                        }
                                        className="inline-flex h-12 items-center justify-center rounded-full bg-[#234a37] px-6 text-sm font-semibold text-white transition hover:bg-[#183b2a]"
                                    >
                                        {isAuthenticated
                                            ? 'Go to your dashboard'
                                            : 'Claim your alumni record'}
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                    <a
                                        href="#opportunities"
                                        className="inline-flex h-12 items-center justify-center rounded-full border border-[#dfe2d9] bg-white/60 px-6 text-sm font-semibold text-[#344038] transition hover:bg-white"
                                    >
                                        Explore Job Board
                                        <ArrowDownRight className="ml-2 size-4" />
                                    </a>
                                </div>
                                <div className="mt-12 flex items-center gap-4 border-t border-[#e4e6de] pt-6">
                                    <div className="flex -space-x-2">
                                        {['AM', 'JL', 'RK', 'TS'].map(
                                            (initials, index) => (
                                                <span
                                                    key={initials}
                                                    className={`grid size-9 place-items-center rounded-full border-2 border-[#f7f7f2] text-[10px] font-bold text-white ${['bg-[#52705a]', 'bg-[#ad8061]', 'bg-[#6d7994]', 'bg-[#a36e69]'][index]}`}
                                                >
                                                    {initials}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                    <p className="text-xs leading-5 text-[#747c72]">
                                        <span className="font-semibold text-[#344038]">
                                            Generations connected.
                                        </span>
                                        <br />
                                        Official Alumni Tracer & Career
                                        Placement Portal.
                                    </p>
                                </div>
                            </div>

                            <div className="relative mx-auto w-full max-w-[540px]">
                                <div className="absolute -top-7 -left-7 size-32 rounded-full border border-[#d7dfd1]" />
                                <div className="absolute right-8 -bottom-8 size-40 rounded-full bg-[#ebeee5]" />
                                <div className="relative overflow-hidden rounded-[2rem] bg-[#dfe8de] p-4 sm:p-6">
                                    <div className="relative min-h-[420px] overflow-hidden rounded-[1.5rem] bg-[#aabda8] sm:min-h-[490px]">
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_68%_36%,rgba(246,239,219,0.95),transparent_38%),linear-gradient(145deg,#c8d3c3_0%,#8ca58f_52%,#657e6c_100%)]" />
                                        <div className="absolute right-[14%] bottom-0 left-[14%] h-[68%] rounded-t-[48%] bg-[#e5d7c0] shadow-[inset_-35px_0_50px_rgba(74,84,66,0.1)]" />
                                        <div className="absolute right-[23%] bottom-0 left-[23%] h-[53%] rounded-t-[45%] bg-[#667d68]" />
                                        <div className="absolute right-[29%] bottom-[21%] left-[29%] h-[31%] rounded-t-[45%] bg-[#e6c8a9]" />
                                        <div className="absolute top-[8%] left-[8%] max-w-48 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-xl backdrop-blur-md">
                                            <p className="text-[10px] font-bold tracking-[0.16em] text-[#6c796d] uppercase">
                                                Northfield network
                                            </p>
                                            <p className="mt-2 text-sm leading-5 font-semibold text-[#2e4133]">
                                                The next chapter starts with a
                                                connection.
                                            </p>
                                        </div>
                                        <div className="absolute right-4 bottom-5 left-4 flex items-center justify-between rounded-2xl border border-white/60 bg-white/85 p-4 shadow-xl backdrop-blur-md sm:right-6 sm:bottom-6 sm:left-6">
                                            <div>
                                                <p className="text-[10px] font-bold tracking-[0.14em] text-[#758174] uppercase">
                                                    Graduates, connected
                                                </p>
                                                <p className="mt-1 text-xl font-semibold tracking-tight text-[#26392b]">
                                                    One shared story
                                                </p>
                                            </div>
                                            <Link
                                                href={
                                                    isAuthenticated
                                                        ? '/dashboard'
                                                        : register()
                                                }
                                                aria-label="Enter alumni portal"
                                                className="grid size-11 place-items-center rounded-full bg-[#e5eee4] text-[#45684b] transition hover:bg-[#d3e3d1]"
                                            >
                                                <MoveUpRight className="size-5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Key Metrics Bar */}
                    <section className="border-y border-[#e6e8df] bg-white/65">
                        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 sm:px-8 md:grid-cols-4 md:gap-4">
                            {statItems.map(([value, label]) => (
                                <div
                                    key={label}
                                    className="text-center md:border-r md:border-[#e6e8df] last:md:border-0"
                                >
                                    <p className="text-2xl font-semibold tracking-tight text-[#2b4934] sm:text-3xl">
                                        {value}
                                    </p>
                                    <p className="mt-1 text-xs text-[#788076] sm:text-sm">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* About & Highlights Section */}
                    <section
                        id="community"
                        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"
                    >
                        <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                            <div>
                                <p className="text-xs font-bold tracking-[0.18em] text-[#6b836c] uppercase">
                                    MORE THAN A DIRECTORY
                                </p>
                                <h2 className="mt-3 max-w-xl text-3xl leading-tight font-medium tracking-[-0.04em] text-[#26342a] sm:text-4xl">
                                    A community that grows with you.
                                </h2>
                            </div>
                            <p className="max-w-md text-sm leading-6 text-[#747c72]">
                                From your first day on campus to wherever you
                                are today, your connection to Northfield keeps
                                opening doors.
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {highlights.map(
                                ({
                                    eyebrow,
                                    title,
                                    description,
                                    icon: Icon,
                                    tone,
                                    portalPage,
                                }) => (
                                    <article
                                        key={title}
                                        className="rounded-3xl border border-[#e8e9e2] bg-white p-6 sm:p-7"
                                    >
                                        <span
                                            className={`grid size-12 place-items-center rounded-2xl ${tone}`}
                                        >
                                            <Icon className="size-5" />
                                        </span>
                                        <p className="mt-7 text-[10px] font-bold tracking-[0.16em] text-[#858b80]">
                                            {eyebrow}
                                        </p>
                                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-[#2b382e]">
                                            {title}
                                        </h3>
                                        <p className="mt-3 text-sm leading-6 text-[#737b71]">
                                            {description}
                                        </p>
                                        <Link
                                            href={
                                                isAuthenticated
                                                    ? `/dashboard?page=${encodeURIComponent(portalPage)}`
                                                    : register()
                                            }
                                            className="mt-6 inline-flex items-center text-sm font-semibold text-[#45664a] hover:text-[#234a37]"
                                        >
                                            {isAuthenticated
                                                ? `Open ${portalPage}`
                                                : 'Claim account to access'}{' '}
                                            <ArrowUpRight className="ml-1.5 size-4" />
                                        </Link>
                                    </article>
                                ),
                            )}
                        </div>
                    </section>

                    {/* Alumni Information & Claim Verification Guide */}
                    <section
                        id="alumni-info"
                        className="border-y border-[#e6e8df] bg-white/80 py-20 sm:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-5 sm:px-8">
                            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                                <div>
                                    <p className="text-xs font-bold tracking-[0.18em] text-[#6b836c] uppercase">
                                        ALUMNI INFORMATION & VERIFICATION
                                    </p>
                                    <h2 className="mt-3 text-3xl leading-tight font-medium tracking-[-0.04em] text-[#26342a] sm:text-4xl">
                                        How to claim your official Northfield
                                        alumni account.
                                    </h2>
                                    <p className="mt-4 text-sm leading-6 text-[#6e776d]">
                                        Every graduate has a pre-registered
                                        institutional record maintained by the
                                        Registrar and Alumni Office. Claiming
                                        your profile links your academic history
                                        to your personal portal account.
                                    </p>

                                    <div className="mt-8 space-y-4">
                                        {[
                                            {
                                                step: '1',
                                                title: 'Verify Your 3 Academic Credentials',
                                                text: 'Enter your Student Number, Last Name on record, and Date of Birth. You can register using any modern personal email address.',
                                            },
                                            {
                                                step: '2',
                                                title: 'Automatic Profile Linking or Coordinator Assistance',
                                                text: 'Matching records are verified immediately. If any detail differs from the roster, a request is automatically routed to your Department Coordinator.',
                                            },
                                            {
                                                step: '3',
                                                title: 'Update Employment Tracer & Apply to Jobs',
                                                text: 'Record your career progression, indicate curriculum alignment, respond to tracer surveys, and apply to verified employers with frozen resume snapshots.',
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.step}
                                                className="flex gap-4 rounded-2xl border border-[#e7e9e2] bg-[#fafbf8] p-4"
                                            >
                                                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#234a37] text-xs font-bold text-white">
                                                    {item.step}
                                                </span>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-[#28372c]">
                                                        {item.title}
                                                    </h3>
                                                    <p className="mt-1 text-xs leading-5 text-[#6e776d]">
                                                        {item.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-7 flex flex-wrap gap-3">
                                        <Link
                                            href={
                                                isAuthenticated
                                                    ? '/dashboard?page=My+profile'
                                                    : register()
                                            }
                                            className="inline-flex h-11 items-center rounded-full bg-[#234a37] px-5 text-xs font-semibold text-white transition hover:bg-[#183b2a]"
                                        >
                                            {isAuthenticated
                                                ? 'View My Alumni Profile'
                                                : 'Verify & Claim Record'}
                                            <ArrowRight className="ml-2 size-4" />
                                        </Link>
                                        <Link
                                            href="/alumni/registration-assistance"
                                            className="inline-flex h-11 items-center rounded-full border border-[#d8dfd5] bg-white px-5 text-xs font-semibold text-[#38473b] transition hover:bg-[#f4f6f2]"
                                        >
                                            <ShieldCheck className="mr-2 size-4 text-[#4a6b4f]" />
                                            Request Registration Assistance
                                        </Link>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-[#e4e7df] bg-[#f7f8f4] p-6 sm:p-8">
                                    <div className="flex items-center justify-between border-b border-[#e6e9e1] pb-4">
                                        <div>
                                            <p className="text-[10px] font-bold tracking-[0.16em] text-[#6b836c] uppercase">
                                                ACADEMIC COLLEGES & PROGRAMS
                                            </p>
                                            <h3 className="mt-1 text-lg font-semibold text-[#26342a]">
                                                Northfield Academic Units
                                            </h3>
                                        </div>
                                        <Building2 className="size-5 text-[#5b775e]" />
                                    </div>

                                    {publicDepartments.length > 0 ? (
                                        <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
                                            {publicDepartments.map((dept) => (
                                                <div
                                                    key={dept.id}
                                                    className="rounded-2xl border border-[#e8ebe4] bg-white p-4"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-[#2b4934]">
                                                            {dept.name}
                                                        </span>
                                                        <span className="rounded-full bg-[#edf2eb] px-2.5 py-0.5 text-[10px] font-semibold text-[#3b5d42]">
                                                            {dept.code}
                                                        </span>
                                                    </div>
                                                    {dept.programs.length >
                                                        0 && (
                                                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                            {dept.programs.map(
                                                                (prog) => (
                                                                    <span
                                                                        key={
                                                                            prog.id
                                                                        }
                                                                        className="rounded-lg bg-[#f4f6f2] px-2 py-1 text-[11px] font-medium text-[#546155]"
                                                                    >
                                                                        {
                                                                            prog.code
                                                                        }{' '}
                                                                        ·{' '}
                                                                        {
                                                                            prog.name
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-4 space-y-3">
                                            {[
                                                [
                                                    'CCS',
                                                    'College of Computer Studies',
                                                    'BS Information Technology · BS Computer Science · BS Information Systems',
                                                ],
                                                [
                                                    'CBA',
                                                    'College of Business Administration',
                                                    'BS Business Administration · BS Accountancy · BS Marketing Management',
                                                ],
                                                [
                                                    'COE',
                                                    'College of Engineering',
                                                    'BS Civil Engineering · BS Electrical Engineering · BS Industrial Engineering',
                                                ],
                                            ].map(([code, name, progs]) => (
                                                <div
                                                    key={code}
                                                    className="rounded-2xl border border-[#e8ebe4] bg-white p-4"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-[#2b4934]">
                                                            {name}
                                                        </span>
                                                        <span className="rounded-full bg-[#edf2eb] px-2.5 py-0.5 text-[10px] font-semibold text-[#3b5d42]">
                                                            {code}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-xs text-[#687267]">
                                                        {progs}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Public Announcements Section */}
                    <section
                        id="announcements"
                        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"
                    >
                        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                            <div>
                                <p className="text-xs font-bold tracking-[0.18em] text-[#6b836c] uppercase">
                                    CAMPUS & ALUMNI BULLETINS
                                </p>
                                <h2 className="mt-3 text-3xl leading-tight font-medium tracking-[-0.04em] text-[#26342a] sm:text-4xl">
                                    Latest Announcements
                                </h2>
                            </div>
                            <Link
                                href={
                                    isAuthenticated
                                        ? '/dashboard?page=Announcements'
                                        : login()
                                }
                                className="inline-flex items-center text-xs font-semibold text-[#33583b] hover:underline"
                            >
                                {isAuthenticated
                                    ? 'View all in Portal Announcements'
                                    : 'Sign in for cohort-specific updates'}
                                <ArrowRight className="ml-1.5 size-3.5" />
                            </Link>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            {announcements.map((item) => (
                                <article
                                    key={item.id}
                                    className="flex flex-col justify-between rounded-3xl border border-[#e6e8df] bg-white p-6 transition hover:border-[#c6d3c2]"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#6b836c]">
                                            <span className="inline-flex items-center gap-1.5 uppercase">
                                                <Megaphone className="size-3.5" />
                                                {item.is_pinned
                                                    ? '📌 Pinned · '
                                                    : ''}
                                                {item.category &&
                                                item.category !== 'general'
                                                    ? item.category
                                                    : 'OFFICIAL BULLETIN'}
                                            </span>
                                            <span>
                                                {item.published_at ?? 'Recent'}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 text-lg font-semibold tracking-tight text-[#26342a]">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2.5 line-clamp-3 text-xs leading-5 text-[#6e776d]">
                                            {item.body}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedAnnouncement(item)
                                        }
                                        className="mt-5 inline-flex items-center text-xs font-semibold text-[#234a37] hover:underline"
                                    >
                                        Read announcement{' '}
                                        <ArrowUpRight className="ml-1 size-3.5" />
                                    </button>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* Public Job Board & Job Details */}
                    <section
                        id="opportunities"
                        className="bg-[#263f31] text-white"
                    >
                        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
                            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                                <div>
                                    <p className="text-xs font-bold tracking-[0.18em] text-[#b8cdb5] uppercase">
                                        PUBLIC JOB BOARD
                                    </p>
                                    <h2 className="mt-3 max-w-xl text-3xl leading-tight font-medium tracking-[-0.04em] sm:text-4xl">
                                        Good work starts with good people.
                                    </h2>
                                    <p className="mt-3 max-w-xl text-sm leading-6 text-[#d0d9ce]">
                                        Browse verified career opportunities
                                        shared by partner employers. Click any
                                        role to inspect full job details and
                                        apply through your alumni portal.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    <label className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 text-xs text-white">
                                        <Search className="size-3.5 text-[#c5d0c3]" />
                                        <input
                                            type="search"
                                            value={jobSearch}
                                            onChange={(e) =>
                                                setJobSearch(e.target.value)
                                            }
                                            placeholder="Search role, company, city…"
                                            className="w-44 bg-transparent text-xs text-white outline-none placeholder:text-[#b7c4b5]"
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
                                                className={`h-9 rounded-full px-3.5 text-xs font-semibold transition ${
                                                    workplaceFilter === mode
                                                        ? 'bg-white text-[#234a37]'
                                                        : 'border border-white/15 bg-white/5 text-[#d7e0d5] hover:bg-white/15'
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
                                className="mt-10 grid gap-4 md:grid-cols-2"
                            >
                                {filteredJobs.length > 0 ? (
                                    filteredJobs.map((job) => (
                                        <article
                                            key={job.id}
                                            className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-5 transition hover:bg-white/[0.12]"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3.5">
                                                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e4ece6] text-[#2b5139]">
                                                        <BriefcaseBusiness className="size-5" />
                                                    </span>
                                                    <div>
                                                        <p className="text-xs font-medium text-[#c5d0c3]">
                                                            {job.company_name} ·{' '}
                                                            {job.industry}
                                                        </p>
                                                        <h3 className="mt-1 text-base font-semibold text-white">
                                                            {job.title}
                                                        </h3>
                                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#c5d0c3]">
                                                            <MapPin className="size-3.5" />
                                                            {job.location} ·{' '}
                                                            {job.workplace_type}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-[#e2e8df]">
                                                    {job.employment_type}
                                                </span>
                                            </div>

                                            <p className="line-clamp-2 text-xs leading-5 text-[#cfd8cd]">
                                                {job.description}
                                            </p>

                                            <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                                <span className="text-[11px] text-[#bfd0bd]">
                                                    {job.closes_at
                                                        ? `Closes ${job.closes_at}`
                                                        : 'Open for applications'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedJob(job)
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white hover:text-[#234a37]"
                                                >
                                                    Job details
                                                    <ArrowUpRight className="size-3.5" />
                                                </button>
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-[#cfd8cd]">
                                        No job postings match your current filter.
                                    </div>
                                )}
                            </div>

                            {/* Employer Partner Callout */}
                            <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/15 bg-white/[0.06] p-6 sm:flex-row sm:items-center">
                                <div>
                                    <p className="text-xs font-bold tracking-wider text-[#b8cdb5] uppercase">
                                        HIRING NORTHFIELD GRADUATES?
                                    </p>
                                    <p className="mt-1 text-sm text-[#e1e8df]">
                                        Register your company as a verified
                                        Employer Partner to publish job openings
                                        and review alumni applicants.
                                    </p>
                                </div>
                                <Link
                                    href={
                                        isAuthenticated
                                            ? '/dashboard?page=Job+postings'
                                            : '/register?type=employer'
                                    }
                                    className="inline-flex h-10 shrink-0 items-center rounded-full bg-white px-5 text-xs font-semibold text-[#234a37] transition hover:bg-[#e8f0e6]"
                                >
                                    {isAuthenticated
                                        ? 'Open Employer Workspace'
                                        : 'Employer Registration'}
                                    <ArrowRight className="ml-2 size-3.5" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Upcoming Alumni Events */}
                    <section
                        id="events"
                        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"
                    >
                        <div className="mb-10">
                            <p className="text-xs font-bold tracking-[0.18em] text-[#6b836c] uppercase">
                                UPCOMING ALUMNI EVENTS
                            </p>
                            <h2 className="mt-3 max-w-lg text-3xl leading-tight font-medium tracking-[-0.04em] text-[#26342a] sm:text-4xl">
                                The best conversations happen when we get
                                together.
                            </h2>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {upcomingEvents.map((ev) => (
                                <article
                                    key={ev.id}
                                    className="flex gap-5 rounded-3xl border border-[#e6e8df] bg-white p-6 sm:p-8"
                                >
                                    <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#eef2eb] text-[#46624b]">
                                        <span className="text-[10px] font-bold tracking-widest">
                                            {ev.month}
                                        </span>
                                        <span className="text-2xl font-semibold">
                                            {ev.day}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-[#edf2eb] px-2.5 py-1 text-[10px] font-semibold text-[#527054]">
                                                {ev.badge}
                                            </span>
                                            <span className="text-xs text-[#858b80]">
                                                {ev.timeAndVenue}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 text-lg font-semibold text-[#2b382e]">
                                            {ev.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-5 text-[#737b71]">
                                            {ev.summary}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedEvent(ev)}
                                            className="mt-4 inline-flex items-center text-sm font-semibold text-[#45664a] hover:text-[#234a37]"
                                        >
                                            Event details{' '}
                                            <ArrowRight className="ml-2 size-4" />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* Bottom Call to Action */}
                    <section className="px-5 pb-20 sm:px-8 sm:pb-24">
                        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-[#e8eee5] p-7 sm:p-10 md:flex-row md:items-center">
                            <div>
                                <p className="text-xs font-bold tracking-[0.18em] text-[#6b836c] uppercase">
                                    STILL PART OF THE STORY
                                </p>
                                <h2 className="mt-3 max-w-xl text-2xl leading-tight font-medium tracking-[-0.04em] text-[#26342a] sm:text-3xl">
                                    Wherever you are, there’s a place for you
                                    here.
                                </h2>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={
                                        isAuthenticated
                                            ? '/dashboard'
                                            : register()
                                    }
                                    className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#234a37] px-6 text-sm font-semibold text-white transition hover:bg-[#183b2a]"
                                >
                                    {isAuthenticated
                                        ? 'Open Alumni Portal'
                                        : 'Claim Alumni Account'}{' '}
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                                {!isAuthenticated && (
                                    <Link
                                        href="/register?type=employer"
                                        className="inline-flex h-12 shrink-0 items-center justify-center rounded-full border border-[#c8d4c4] bg-white px-6 text-sm font-semibold text-[#2b4934] transition hover:bg-[#f4f7f2]"
                                    >
                                        Employer Registration
                                    </Link>
                                )}
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-[#e6e8df] bg-white/60">
                    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 text-xs text-[#777f75] sm:px-8 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 font-semibold text-[#35463a]">
                            <GraduationCap className="size-4" />
                            Northfield College Alumni Tracer Management System
                        </div>
                        <p>Every graduate. Every generation. One community.</p>
                        <div className="flex flex-wrap gap-4">
                            <a
                                href="#community"
                                className="hover:text-[#234a37]"
                            >
                                About
                            </a>
                            <a
                                href="#announcements"
                                className="hover:text-[#234a37]"
                            >
                                Announcements
                            </a>
                            <a
                                href="#opportunities"
                                className="hover:text-[#234a37]"
                            >
                                Jobs
                            </a>
                            <Link
                                href="/alumni/registration-assistance"
                                className="hover:text-[#234a37]"
                            >
                                Claim Assistance
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Public Job Details Modal */}
            {selectedJob && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="public-job-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
                >
                    <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#e5e8df] bg-white p-6 shadow-2xl sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf2eb] px-3 py-1 text-[10px] font-bold text-[#2b5139] uppercase">
                                    <CheckCircle2 className="size-3" />
                                    Verified Employer Partner
                                </span>
                                <h2
                                    id="public-job-title"
                                    className="mt-2.5 text-xl font-bold text-[#233227]"
                                >
                                    {selectedJob.title}
                                </h2>
                                <p className="mt-1 text-xs font-medium text-[#657064]">
                                    {selectedJob.company_name} ·{' '}
                                    {selectedJob.industry}
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close job details"
                                onClick={() => setSelectedJob(null)}
                                className="grid size-8 place-items-center rounded-full border border-[#e4e7df] text-[#687267] hover:bg-[#f4f5f2]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-lg bg-[#f3f5f0] px-3 py-1.5 font-medium text-[#3f4d41]">
                                {selectedJob.location}
                            </span>
                            <span className="rounded-lg bg-[#f3f5f0] px-3 py-1.5 font-medium text-[#3f4d41]">
                                {selectedJob.workplace_type}
                            </span>
                            <span className="rounded-lg bg-[#f3f5f0] px-3 py-1.5 font-medium text-[#3f4d41]">
                                {selectedJob.employment_type}
                            </span>
                            {(selectedJob.salary_min ||
                                selectedJob.salary_max) && (
                                <span className="rounded-lg bg-[#edf2eb] px-3 py-1.5 font-semibold text-[#2b5139]">
                                    ₱
                                    {selectedJob.salary_min?.toLocaleString() ??
                                        '—'}{' '}
                                    – ₱
                                    {selectedJob.salary_max?.toLocaleString() ??
                                        '—'}
                                </span>
                            )}
                        </div>

                        <div className="mt-5 border-t border-[#eff0ec] pt-4">
                            <h3 className="text-xs font-bold tracking-wider text-[#7a8278] uppercase">
                                Role Description
                            </h3>
                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#3e4a40]">
                                {selectedJob.description}
                            </p>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#eff0ec] pt-5">
                            <span className="text-xs text-[#7a8278]">
                                {selectedJob.closes_at
                                    ? `Application deadline: ${selectedJob.closes_at}`
                                    : 'Accepting applications now'}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {isAuthenticated ? (
                                    <Link
                                        href="/dashboard?page=Career+opportunities"
                                        className="inline-flex h-10 items-center rounded-full bg-[#234a37] px-5 text-xs font-semibold text-white transition hover:bg-[#183b2a]"
                                    >
                                        Apply in Career Portal
                                        <ArrowRight className="ml-2 size-3.5" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="inline-flex h-10 items-center rounded-full border border-[#d6ddd3] px-4 text-xs font-semibold text-[#344038] hover:bg-[#f4f6f2]"
                                        >
                                            Sign in to Apply
                                        </Link>
                                        <Link
                                            href={register()}
                                            className="inline-flex h-10 items-center rounded-full bg-[#234a37] px-5 text-xs font-semibold text-white hover:bg-[#183b2a]"
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

            {/* Public Announcement Reader Modal */}
            {selectedAnnouncement && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="public-announcement-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
                >
                    <div className="w-full max-w-lg rounded-3xl border border-[#e5e8df] bg-white p-6 shadow-2xl sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4a6b4f] uppercase">
                                    <Megaphone className="size-3.5" />
                                    Official Announcement ·{' '}
                                    {selectedAnnouncement.published_at ??
                                        'Published'}
                                </span>
                                <h2
                                    id="public-announcement-title"
                                    className="mt-2 text-xl font-bold text-[#233227]"
                                >
                                    {selectedAnnouncement.title}
                                </h2>
                            </div>
                            <button
                                type="button"
                                aria-label="Close announcement"
                                onClick={() => setSelectedAnnouncement(null)}
                                className="grid size-8 place-items-center rounded-full border border-[#e4e7df] text-[#687267] hover:bg-[#f4f5f2]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#424e44]">
                            {selectedAnnouncement.body}
                        </p>

                        <div className="mt-6 flex justify-end gap-2 border-t border-[#eff0ec] pt-4">
                            <Link
                                href={
                                    isAuthenticated
                                        ? '/dashboard?page=Announcements'
                                        : login()
                                }
                                className="inline-flex h-10 items-center rounded-full bg-[#234a37] px-5 text-xs font-semibold text-white hover:bg-[#183b2a]"
                            >
                                {isAuthenticated
                                    ? 'Open Portal Announcements'
                                    : 'Sign in to Portal'}
                                <ArrowRight className="ml-2 size-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Upcoming Event Details Modal */}
            {selectedEvent && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="public-event-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
                >
                    <div className="w-full max-w-lg rounded-3xl border border-[#e5e8df] bg-white p-6 shadow-2xl sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4a6b4f] uppercase">
                                    <Calendar className="size-3.5" />
                                    {selectedEvent.badge} ·{' '}
                                    {selectedEvent.timeAndVenue}
                                </span>
                                <h2
                                    id="public-event-title"
                                    className="mt-2 text-xl font-bold text-[#233227]"
                                >
                                    {selectedEvent.title}
                                </h2>
                            </div>
                            <button
                                type="button"
                                aria-label="Close event details"
                                onClick={() => setSelectedEvent(null)}
                                className="grid size-8 place-items-center rounded-full border border-[#e4e7df] text-[#687267] hover:bg-[#f4f5f2]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-[#424e44]">
                            {selectedEvent.details}
                        </p>

                        <div className="mt-6 flex justify-end gap-2 border-t border-[#eff0ec] pt-4">
                            <Link
                                href={
                                    isAuthenticated ? '/dashboard' : register()
                                }
                                className="inline-flex h-10 items-center rounded-full bg-[#234a37] px-5 text-xs font-semibold text-white hover:bg-[#183b2a]"
                            >
                                {isAuthenticated
                                    ? 'Open Alumni Portal'
                                    : 'Claim Account to RSVP'}
                                <ArrowRight className="ml-2 size-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
