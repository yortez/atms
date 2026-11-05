import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BriefcaseBusiness,
    GraduationCap,
    Menu,
    MoveUpRight,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { login, register } from '@/routes';

const highlights = [
    {
        eyebrow: 'ALUMNI NETWORK',
        title: 'Your story is part of ours.',
        description:
            'Reconnect with classmates, share where your journey has taken you, and help the next generation find their way.',
        icon: UsersRound,
        tone: 'bg-[#e9f1e7] text-[#42634a]',
    },
    {
        eyebrow: 'CAREER OPPORTUNITIES',
        title: 'Make your next move.',
        description:
            'Discover opportunities from trusted employers and stay connected to a community that wants to see you grow.',
        icon: BriefcaseBusiness,
        tone: 'bg-[#f5eadc] text-[#97673a]',
    },
    {
        eyebrow: 'LIFELONG LEARNING',
        title: 'Keep learning together.',
        description:
            'Take part in alumni stories, campus events, and graduate surveys that shape a stronger future for everyone.',
        icon: GraduationCap,
        tone: 'bg-[#e7edf5] text-[#4c6484]',
    },
];

const opportunities = [
    {
        company: 'Northstar Digital',
        title: 'Product Designer',
        type: 'Full-time',
        location: 'Makati City · Hybrid',
        color: 'bg-[#e4ece6] text-[#3d624b]',
    },
    {
        company: 'Harbor & Pine',
        title: 'Junior Data Analyst',
        type: 'Full-time',
        location: 'Quezon City · On-site',
        color: 'bg-[#f4e9dc] text-[#8d623b]',
    },
    {
        company: 'Common Ground Labs',
        title: 'Community Associate',
        type: 'Contract',
        location: 'Remote · Philippines',
        color: 'bg-[#e8eaf3] text-[#555d82]',
    },
];

export default function Welcome() {
    const { auth } = usePage().props;
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <Head title="Alumni community" />
            <div className="min-h-screen bg-[#f7f7f2] text-[#222820]">
                <header className="relative z-10 border-b border-[#e7e8df] bg-[#f7f7f2]">
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
                                Community
                            </a>
                            <a
                                className="text-sm text-[#596158] hover:text-[#234a37]"
                                href="#opportunities"
                                onClick={() => setMenuOpen(false)}
                            >
                                Opportunities
                            </a>
                            <a
                                className="text-sm text-[#596158] hover:text-[#234a37]"
                                href="#events"
                                onClick={() => setMenuOpen(false)}
                            >
                                Events
                            </a>
                            <Link
                                href="/preview"
                                className="text-sm text-[#596158] hover:text-[#234a37]"
                                onClick={() => setMenuOpen(false)}
                            >
                                Portal preview
                            </Link>
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#234a37] px-5 text-sm font-semibold text-white transition hover:bg-[#183b2a]"
                                >
                                    Open dashboard
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={login()}
                                        className="text-sm font-semibold text-[#344038] hover:text-[#234a37]"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="inline-flex h-10 items-center justify-center rounded-full bg-[#234a37] px-5 text-sm font-semibold text-white transition hover:bg-[#183b2a]"
                                    >
                                        Join the community
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                </header>

                <main>
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
                                    Reconnect with your college, find meaningful
                                    opportunities, and make your experience
                                    count for the next generation.
                                </p>
                                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href={
                                            auth.user
                                                ? '/dashboard'
                                                : register()
                                        }
                                        className="inline-flex h-12 items-center justify-center rounded-full bg-[#234a37] px-6 text-sm font-semibold text-white transition hover:bg-[#183b2a]"
                                    >
                                        {auth.user
                                            ? 'Go to your dashboard'
                                            : 'Find your place'}
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                    <a
                                        href="#community"
                                        className="inline-flex h-12 items-center justify-center rounded-full border border-[#dfe2d9] bg-white/60 px-6 text-sm font-semibold text-[#344038] transition hover:bg-white"
                                    >
                                        Explore the community
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
                                        Stories that keep moving forward.
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
                                            <span className="grid size-11 place-items-center rounded-full bg-[#e5eee4] text-[#45684b]">
                                                <MoveUpRight className="size-5" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-y border-[#e6e8df] bg-white/65">
                        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 sm:px-8 md:grid-cols-4 md:gap-4">
                            {[
                                ['12,400+', 'graduates'],
                                ['38', 'graduating classes'],
                                ['24', 'academic programs'],
                                ['One', 'Northfield community'],
                            ].map(([value, label]) => (
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

                    <section
                        id="community"
                        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28"
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
                                        <a
                                            href="#opportunities"
                                            className="mt-6 inline-flex items-center text-sm font-semibold text-[#45664a] hover:text-[#234a37]"
                                        >
                                            Explore more{' '}
                                            <ArrowUpRight className="ml-1.5 size-4" />
                                        </a>
                                    </article>
                                ),
                            )}
                        </div>
                    </section>

                    <section
                        id="opportunities"
                        className="bg-[#263f31] text-white"
                    >
                        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                            <div>
                                <p className="text-xs font-bold tracking-[0.18em] text-[#b8cdb5] uppercase">
                                    OPEN DOORS
                                </p>
                                <h2 className="mt-3 max-w-md text-3xl leading-tight font-medium tracking-[-0.04em] sm:text-4xl">
                                    Good work starts with good people.
                                </h2>
                                <p className="mt-5 max-w-md text-sm leading-6 text-[#d0d9ce]">
                                    Browse roles shared by employers who value
                                    Northfield talent. Your next opportunity
                                    could be closer than you think.
                                </p>
                                <a
                                    href="#job-board"
                                    className="mt-7 inline-flex items-center text-sm font-semibold text-white hover:text-[#d4e4d1]"
                                >
                                    See all opportunities{' '}
                                    <ArrowRight className="ml-2 size-4" />
                                </a>
                            </div>
                            <div id="job-board" className="space-y-3">
                                {opportunities.map((job) => (
                                    <article
                                        key={job.title}
                                        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-5 transition hover:bg-white/[0.11] sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span
                                                className={`grid size-11 shrink-0 place-items-center rounded-xl ${job.color}`}
                                            >
                                                <BriefcaseBusiness className="size-5" />
                                            </span>
                                            <div>
                                                <p className="text-xs text-[#c5d0c3]">
                                                    {job.company}
                                                </p>
                                                <h3 className="mt-1 font-semibold">
                                                    {job.title}
                                                </h3>
                                                <p className="mt-1 text-xs text-[#c5d0c3]">
                                                    {job.location}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                                            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#e2e8df]">
                                                {job.type}
                                            </span>
                                            <Link
                                                href="/preview"
                                                aria-label={`Preview ${job.title}`}
                                                className="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                                            >
                                                <ArrowUpRight className="size-4" />
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        id="events"
                        className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.85fr] lg:items-center"
                    >
                        <div>
                            <p className="text-xs font-bold tracking-[0.18em] text-[#6b836c] uppercase">
                                SAVE A DATE
                            </p>
                            <h2 className="mt-3 max-w-lg text-3xl leading-tight font-medium tracking-[-0.04em] text-[#26342a] sm:text-4xl">
                                The best conversations happen when we get
                                together.
                            </h2>
                            <p className="mt-5 max-w-lg text-sm leading-6 text-[#747c72]">
                                Come back to campus, meet the people shaping our
                                community, and make a few new memories along the
                                way.
                            </p>
                        </div>
                        <article className="flex gap-5 rounded-3xl border border-[#e6e8df] bg-white p-6 sm:p-8">
                            <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#eef2eb] text-[#46624b]">
                                <span className="text-[10px] font-bold tracking-widest">
                                    NOV
                                </span>
                                <span className="text-2xl font-semibold">
                                    21
                                </span>
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-[#edf2eb] px-2.5 py-1 text-[10px] font-semibold text-[#527054]">
                                        ON CAMPUS
                                    </span>
                                    <span className="text-xs text-[#858b80]">
                                        10:00 AM · Northfield Hall
                                    </span>
                                </div>
                                <h3 className="mt-3 text-lg font-semibold text-[#2b382e]">
                                    Alumni Homecoming 2026
                                </h3>
                                <p className="mt-2 text-sm leading-5 text-[#737b71]">
                                    A day to reconnect, celebrate our stories,
                                    and welcome the class of 2026.
                                </p>
                                <a
                                    href="/preview"
                                    className="mt-4 inline-flex items-center text-sm font-semibold text-[#45664a]"
                                >
                                    Event details{' '}
                                    <ArrowRight className="ml-2 size-4" />
                                </a>
                            </div>
                        </article>
                    </section>

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
                            <Link
                                href={auth.user ? '/dashboard' : register()}
                                className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#234a37] px-6 text-sm font-semibold text-white transition hover:bg-[#183b2a]"
                            >
                                Join the community{' '}
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-[#e6e8df] bg-white/60">
                    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 text-xs text-[#777f75] sm:px-8 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 font-semibold text-[#35463a]">
                            <GraduationCap className="size-4" />
                            Northfield College Alumni
                        </div>
                        <p>Every graduate. Every generation. One community.</p>
                        <div className="flex gap-4">
                            <a
                                href="#community"
                                className="hover:text-[#234a37]"
                            >
                                About
                            </a>
                            <a href="#events" className="hover:text-[#234a37]">
                                Events
                            </a>
                            <a href="/preview" className="hover:text-[#234a37]">
                                Portal preview
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
