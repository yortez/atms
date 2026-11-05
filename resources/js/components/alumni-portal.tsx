import { Link } from '@inertiajs/react';
import {
    Activity,
    ArrowDown,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Bell,
    BriefcaseBusiness,
    Building2,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleHelp,
    ClipboardList,
    FileSpreadsheet,
    GraduationCap,
    LayoutDashboard,
    Menu,
    MessageSquareText,
    Plus,
    Search,
    Settings2,
    ShieldCheck,
    SlidersHorizontal,
    UsersRound,
    X,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
    alumniRecords,
    graduateOutcomes,
    jobOpenings,
    upcomingActivities,
} from '@/lib/alumni-mock-data';

type Role =
    | 'Administrator'
    | 'Alumni coordinator'
    | 'Department coordinator'
    | 'Alumni'
    | 'Employer';
type NavigationItem = { label: string; icon: typeof LayoutDashboard };

const roles: Role[] = [
    'Administrator',
    'Alumni coordinator',
    'Department coordinator',
    'Alumni',
    'Employer',
];

const navigation: Record<Role, NavigationItem[]> = {
    Administrator: [
        { label: 'Overview', icon: LayoutDashboard },
        { label: 'Alumni directory', icon: UsersRound },
        { label: 'Academic programs', icon: GraduationCap },
        { label: 'Surveys', icon: ClipboardList },
        { label: 'Announcements', icon: MessageSquareText },
        { label: 'Employers & jobs', icon: BriefcaseBusiness },
        { label: 'Reports', icon: Activity },
        { label: 'Users & roles', icon: ShieldCheck },
        { label: 'Activity log', icon: FileSpreadsheet },
    ],
    'Alumni coordinator': [
        { label: 'Overview', icon: LayoutDashboard },
        { label: 'Alumni directory', icon: UsersRound },
        { label: 'Surveys', icon: ClipboardList },
        { label: 'Announcements', icon: MessageSquareText },
        { label: 'Employers & jobs', icon: BriefcaseBusiness },
        { label: 'Reports', icon: Activity },
    ],
    'Department coordinator': [
        { label: 'Overview', icon: LayoutDashboard },
        { label: 'Program alumni', icon: UsersRound },
        { label: 'Employment outcomes', icon: Activity },
        { label: 'Surveys', icon: ClipboardList },
        { label: 'Announcements', icon: MessageSquareText },
        { label: 'Department reports', icon: FileSpreadsheet },
    ],
    Alumni: [
        { label: 'My dashboard', icon: LayoutDashboard },
        { label: 'My profile', icon: UsersRound },
        { label: 'Academic records', icon: GraduationCap },
        { label: 'Employment tracer', icon: Activity },
        { label: 'Surveys', icon: ClipboardList },
        { label: 'Announcements', icon: MessageSquareText },
        { label: 'Career opportunities', icon: BriefcaseBusiness },
        { label: 'My applications', icon: FileSpreadsheet },
    ],
    Employer: [
        { label: 'Overview', icon: LayoutDashboard },
        { label: 'Company profile', icon: Building2 },
        { label: 'Job postings', icon: BriefcaseBusiness },
        { label: 'Applicants', icon: UsersRound },
        { label: 'Recruitment analytics', icon: Activity },
    ],
};

const roleDetails: Record<
    Role,
    { name: string; initials: string; context: string; scope: string }
> = {
    Administrator: {
        name: 'Jordan Lee',
        initials: 'JL',
        context: 'System administrator',
        scope: 'Institution-wide overview',
    },
    'Alumni coordinator': {
        name: 'Mara Villanueva',
        initials: 'MV',
        context: 'Alumni coordinator',
        scope: 'Alumni services',
    },
    'Department coordinator': {
        name: 'Paolo Garcia',
        initials: 'PG',
        context: 'Department coordinator',
        scope: 'School of Computing',
    },
    Alumni: {
        name: 'Sofia Reyes',
        initials: 'SR',
        context: 'Class of 2025 · BS Information Technology',
        scope: 'Your alumni portal',
    },
    Employer: {
        name: 'Nina Chen',
        initials: 'NC',
        context: 'Northstar Digital',
        scope: 'Employer workspace',
    },
};

const pageCopy: Record<
    string,
    { title: string; description: string; action?: string }
> = {
    Overview: {
        title: 'Good morning, Jordan',
        description: 'Here’s what’s happening across your alumni community.',
    },
    'My dashboard': {
        title: 'Welcome back, Sofia',
        description: 'Keep your profile current and stay close to what’s next.',
    },
    'Alumni directory': {
        title: 'Alumni directory',
        description:
            'Explore graduate records and their latest tracer updates.',
        action: 'Add alumni',
    },
    'Program alumni': {
        title: 'School of Computing',
        description: 'Alumni and outcomes for your assigned academic programs.',
    },
    'Academic programs': {
        title: 'Academic programs',
        description: 'Manage departments, programs, and graduating cohorts.',
        action: 'Add program',
    },
    Surveys: {
        title: 'Surveys',
        description: 'Keep graduates engaged and make every response count.',
        action: 'Create survey',
    },
    Announcements: {
        title: 'Announcements',
        description:
            'Share news and updates with the right alumni communities.',
        action: 'New announcement',
    },
    'Employers & jobs': {
        title: 'Employers & jobs',
        description:
            'Review employer partners and opportunities shared with alumni.',
        action: 'Review employers',
    },
    Reports: {
        title: 'Reports & insights',
        description: 'Understand graduate outcomes across the institution.',
        action: 'Export report',
    },
    'Employment outcomes': {
        title: 'Employment outcomes',
        description: 'A focused view of graduate outcomes for your programs.',
    },
    'Department reports': {
        title: 'Department reports',
        description:
            'Employment and engagement trends for your assigned programs.',
        action: 'Export report',
    },
    'My profile': {
        title: 'My profile',
        description: 'Your alumni profile helps Northfield stay connected.',
        action: 'Edit profile',
    },
    'Academic records': {
        title: 'Academic records',
        description: 'Your Northfield programs and graduation history.',
    },
    'Employment tracer': {
        title: 'Employment tracer',
        description: 'Tell us where your professional journey has taken you.',
        action: 'Update my status',
    },
    'Career opportunities': {
        title: 'Career opportunities',
        description: 'Roles shared by employers in the Northfield community.',
    },
    'My applications': {
        title: 'My applications',
        description: 'Keep track of your applications and next steps.',
    },
    'Company profile': {
        title: 'Company profile',
        description: 'Tell alumni about your company and the people behind it.',
        action: 'Edit company profile',
    },
    'Job postings': {
        title: 'Job postings',
        description: 'Manage your open roles and reach Northfield graduates.',
        action: 'Create job posting',
    },
    Applicants: {
        title: 'Applicants',
        description: 'Review candidates who applied to your job postings.',
    },
    'Recruitment analytics': {
        title: 'Recruitment analytics',
        description:
            'A snapshot of your hiring activity in the alumni community.',
        action: 'Export report',
    },
    'Users & roles': {
        title: 'Users & roles',
        description: 'Manage access for the people who support your community.',
        action: 'Invite user',
    },
    'Activity log': {
        title: 'Activity log',
        description: 'A recent record of important updates across the system.',
    },
};

const metrics: Record<
    Role,
    { label: string; value: string; change: string; icon: typeof UsersRound }[]
> = {
    Administrator: [
        {
            label: 'Alumni records',
            value: '12,486',
            change: '+8.2%',
            icon: UsersRound,
        },
        {
            label: 'Employment rate',
            value: '78.4%',
            change: '+3.1%',
            icon: BriefcaseBusiness,
        },
        {
            label: 'Survey responses',
            value: '2,841',
            change: '+12.6%',
            icon: ClipboardList,
        },
        {
            label: 'Verified employers',
            value: '64',
            change: '+6 this month',
            icon: Building2,
        },
    ],
    'Alumni coordinator': [
        {
            label: 'Alumni records',
            value: '12,486',
            change: '+8.2%',
            icon: UsersRound,
        },
        {
            label: 'Profile completion',
            value: '71.6%',
            change: '+4.2%',
            icon: Check,
        },
        {
            label: 'Survey responses',
            value: '2,841',
            change: '+12.6%',
            icon: ClipboardList,
        },
        {
            label: 'New registrations',
            value: '184',
            change: '+18 this week',
            icon: GraduationCap,
        },
    ],
    'Department coordinator': [
        {
            label: 'Program alumni',
            value: '2,418',
            change: '+6.8%',
            icon: UsersRound,
        },
        {
            label: 'Employment rate',
            value: '82.1%',
            change: '+2.4%',
            icon: BriefcaseBusiness,
        },
        {
            label: 'Survey responses',
            value: '624',
            change: '+9.3%',
            icon: ClipboardList,
        },
        {
            label: 'Profile completion',
            value: '76.8%',
            change: '+3.5%',
            icon: Check,
        },
    ],
    Alumni: [
        {
            label: 'Profile completeness',
            value: '82%',
            change: 'Almost there',
            icon: UsersRound,
        },
        {
            label: 'Applications',
            value: '3',
            change: '1 in review',
            icon: BriefcaseBusiness,
        },
        {
            label: 'Surveys to complete',
            value: '2',
            change: 'One due soon',
            icon: ClipboardList,
        },
        {
            label: 'Community updates',
            value: '4',
            change: 'Since your last visit',
            icon: Bell,
        },
    ],
    Employer: [
        {
            label: 'Active job posts',
            value: '4',
            change: '2 closing soon',
            icon: BriefcaseBusiness,
        },
        {
            label: 'New applicants',
            value: '28',
            change: '+8 this week',
            icon: UsersRound,
        },
        {
            label: 'In review',
            value: '12',
            change: 'Across all roles',
            icon: ClipboardList,
        },
        {
            label: 'Profile status',
            value: 'Verified',
            change: 'Verified Oct 12',
            icon: ShieldCheck,
        },
    ],
};

const statusClass: Record<string, string> = {
    Employed: 'bg-[#eaf1e9] text-[#45664a]',
    'Further studies': 'bg-[#eeeefa] text-[#62658f]',
    'Self-employed': 'bg-[#faf0e2] text-[#936536]',
    'Seeking work': 'bg-[#edf1f3] text-[#537483]',
};

function toastDemo(message: string) {
    toast.success(message, {
        description: 'This prototype uses sample data only.',
    });
}

function SectionTitle({
    title,
    action,
}: {
    title: string;
    action?: ReactNode;
}) {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-[#29382e]">
                {title}
            </h2>
            {action}
        </div>
    );
}

function MetricCard({
    label,
    value,
    change,
    icon: Icon,
    index,
}: {
    label: string;
    value: string;
    change: string;
    icon: typeof UsersRound;
    index: number;
}) {
    const backgrounds = [
        'bg-[#e9eee5]',
        'bg-[#f3eee5]',
        'bg-[#e8edf0]',
        'bg-[#efebf1]',
    ];

    return (
        <article className="rounded-2xl border border-[#e9ebe5] bg-white p-3.5 shadow-[0_1px_2px_rgba(27,39,30,0.02)] sm:p-4">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-[#788076]">{label}</p>
                <span
                    className={`grid size-9 place-items-center rounded-xl ${backgrounds[index % backgrounds.length]} text-[#516952]`}
                >
                    <Icon className="size-4" />
                </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-[#27362c]">
                {value}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-[#6e806d]">
                <ArrowUpRight className="size-3" />
                {change}
            </p>
        </article>
    );
}

function Overview({ role }: { role: Role }) {
    const isAlumni = role === 'Alumni';
    const isEmployer = role === 'Employer';

    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics[role].map((item, index) => (
                    <MetricCard key={item.label} {...item} index={index} />
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5">
                    <SectionTitle
                        title={
                            isAlumni
                                ? 'Your next steps'
                                : isEmployer
                                  ? 'Applicants by month'
                                  : 'Graduate outcomes'
                        }
                        action={
                            <button
                                type="button"
                                onClick={() =>
                                    toastDemo(
                                        'Showing the last 6 graduating classes',
                                    )
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-[#e7e9e3] px-2.5 py-1.5 text-[11px] font-medium text-[#687267] hover:bg-[#f7f8f5]"
                            >
                                {isEmployer ? 'Last 6 months' : 'Last 6 years'}{' '}
                                <ChevronDown className="size-3" />
                            </button>
                        }
                    />
                    {isEmployer ? (
                        <div className="mt-4">
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-[10px] text-[#7b8178]">
                                    New applications received
                                </span>
                                <span className="text-sm font-semibold text-[#426147]">
                                    28 this month
                                </span>
                            </div>
                            <div className="flex h-48 items-end justify-between gap-2 border-b border-l border-[#edf0e9] px-2 sm:px-4">
                                {[
                                    ['Jan', 44],
                                    ['Feb', 58],
                                    ['Mar', 48],
                                    ['Apr', 72],
                                    ['May', 62],
                                    ['Jun', 86],
                                ].map(([month, total]) => (
                                    <div
                                        key={month}
                                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                                    >
                                        <span
                                            className="w-full max-w-8 rounded-t-sm bg-[#6f8b70]"
                                            style={{ height: `${total}%` }}
                                        />
                                        <span className="mb-2 text-[10px] text-[#898f86]">
                                            {month}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f7f8f5] px-4 py-3">
                                <p className="text-[11px] text-[#747c72]">
                                    Applications across your open roles
                                </p>
                                <p className="text-sm font-semibold text-[#426147]">
                                    28
                                </p>
                            </div>
                        </div>
                    ) : isAlumni ? (
                        <div className="space-y-3 pt-1">
                            {[
                                [
                                    'Complete your profile',
                                    'Add a current phone number and location',
                                    '82%',
                                ],
                                [
                                    'Share your career update',
                                    'Update your employment tracer',
                                    '5 min',
                                ],
                                [
                                    'Take the graduate survey',
                                    'Help improve programs for future classes',
                                    '8 min',
                                ],
                            ].map(([title, detail, note], index) => (
                                <button
                                    type="button"
                                    key={title}
                                    onClick={() => toastDemo(`${title} opened`)}
                                    className="flex w-full items-center gap-3 rounded-xl border border-[#eff0ec] p-3 text-left transition hover:bg-[#f8f9f6]"
                                >
                                    <span
                                        className={`grid size-8 shrink-0 place-items-center rounded-full ${index === 0 ? 'bg-[#e9eee5] text-[#49694d]' : 'bg-[#f2f2ed] text-[#7b8178]'}`}
                                    >
                                        {index === 0 ? (
                                            <Check className="size-4" />
                                        ) : (
                                            <ArrowRight className="size-4" />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs font-semibold text-[#39463b]">
                                            {title}
                                        </span>
                                        <span className="mt-1 block truncate text-[11px] text-[#838980]">
                                            {detail}
                                        </span>
                                    </span>
                                    <span className="text-[10px] font-medium text-[#81877f]">
                                        {note}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4">
                            <div className="mb-4 flex items-center gap-4 text-[10px] text-[#7b8178]">
                                <span className="inline-flex items-center gap-1.5">
                                    <i className="size-2 rounded-full bg-[#66846a]" />{' '}
                                    Employed
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <i className="size-2 rounded-full bg-[#d6b384]" />{' '}
                                    Further studies
                                </span>
                            </div>
                            <div className="flex h-48 items-end justify-between gap-2 border-b border-l border-[#edf0e9] px-2 sm:px-4">
                                {graduateOutcomes.map((item) => (
                                    <div
                                        key={item.year}
                                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                                    >
                                        <div className="flex h-[80%] w-full max-w-10 items-end justify-center gap-1">
                                            <span
                                                className="w-2/5 rounded-t-sm bg-[#6f8b70]"
                                                style={{
                                                    height: `${item.employment}%`,
                                                }}
                                            />
                                            <span
                                                className="w-2/5 rounded-t-sm bg-[#dec39d]"
                                                style={{
                                                    height: `${item.furtherStudies * 2.8}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="mb-2 text-[10px] text-[#898f86]">
                                            {item.year}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f7f8f5] px-4 py-3">
                                <p className="text-[11px] text-[#747c72]">
                                    Employment rate across selected cohorts
                                </p>
                                <p className="text-sm font-semibold text-[#426147]">
                                    78.4%
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5">
                    <SectionTitle
                        title={
                            isAlumni
                                ? 'Recommended for you'
                                : isEmployer
                                  ? 'Hiring activity'
                                  : 'Coming up'
                        }
                        action={
                            <button
                                type="button"
                                onClick={() =>
                                    toastDemo('Opening the full activity list')
                                }
                                className="text-[11px] font-semibold text-[#587057] hover:text-[#294b32]"
                            >
                                View all
                            </button>
                        }
                    />
                    {isEmployer ? (
                        <div className="space-y-3">
                            {[
                                [
                                    'Product Designer',
                                    '12 applicants · 4 new',
                                    'Active',
                                ],
                                [
                                    'Software Engineer',
                                    '9 applicants · 2 new',
                                    'Active',
                                ],
                                [
                                    'UX Research Intern',
                                    '7 applicants · 2 new',
                                    'Closing soon',
                                ],
                            ].map(([title, detail, status]) => (
                                <button
                                    key={title}
                                    type="button"
                                    onClick={() =>
                                        toastDemo(`Opening ${title}`)
                                    }
                                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#eff0ec] p-3 text-left hover:bg-[#f8f9f6]"
                                >
                                    <span>
                                        <span className="block text-xs font-semibold text-[#39463b]">
                                            {title}
                                        </span>
                                        <span className="mt-1 block text-[11px] text-[#838980]">
                                            {detail}
                                        </span>
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-1 text-[9px] font-semibold ${status === 'Active' ? 'bg-[#eaf1e9] text-[#45664a]' : 'bg-[#fbf0df] text-[#936536]'}`}
                                    >
                                        {status}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : isAlumni ? (
                        <div className="space-y-3">
                            {jobOpenings.slice(0, 3).map((job) => (
                                <button
                                    key={job.title}
                                    type="button"
                                    onClick={() =>
                                        toastDemo(`Opening ${job.title}`)
                                    }
                                    className="flex w-full items-center gap-3 rounded-xl border border-[#eff0ec] p-3 text-left hover:bg-[#f8f9f6]"
                                >
                                    <span
                                        className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${job.tone}`}
                                    >
                                        {job.logo}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-semibold text-[#39463b]">
                                            {job.title}
                                        </span>
                                        <span className="mt-1 block truncate text-[11px] text-[#838980]">
                                            {job.company} · {job.location}
                                        </span>
                                    </span>
                                    <ArrowUpRight className="size-4 shrink-0 text-[#7a8578]" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingActivities.map((activity) => (
                                <button
                                    key={activity.title}
                                    type="button"
                                    onClick={() =>
                                        toastDemo(`Opening ${activity.title}`)
                                    }
                                    className="flex w-full items-center gap-3 rounded-xl border border-[#eff0ec] p-3 text-left hover:bg-[#f8f9f6]"
                                >
                                    <span
                                        className={`grid h-10 w-12 shrink-0 place-items-center rounded-lg text-[9px] font-bold tracking-wider ${activity.tone}`}
                                    >
                                        {activity.date}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-semibold text-[#39463b]">
                                            {activity.title}
                                        </span>
                                        <span className="mt-1 block truncate text-[11px] text-[#838980]">
                                            {activity.detail}
                                        </span>
                                    </span>
                                    <ChevronRight className="size-4 shrink-0 text-[#9aa097]" />
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {!isAlumni && !isEmployer && (
                <AlumniTable heading="Recently updated alumni" compact />
            )}
        </div>
    );
}

function AlumniTable({
    heading,
    compact = false,
    query = '',
}: {
    heading?: string;
    compact?: boolean;
    query?: string;
}) {
    const filteredRecords = alumniRecords.filter((record) =>
        [
            record.name,
            record.studentNumber,
            record.program,
            record.department,
            record.employer,
        ]
            .join(' ')
            .toLowerCase()
            .includes(query.toLowerCase()),
    );
    const records = compact ? filteredRecords.slice(0, 4) : filteredRecords;

    return (
        <section className="overflow-hidden rounded-2xl border border-[#e9ebe5] bg-white">
            {heading && (
                <div className="flex items-center justify-between gap-3 border-b border-[#eff0ec] px-4 py-4 sm:px-5">
                    <h2 className="text-sm font-semibold tracking-tight text-[#29382e]">
                        {heading}
                    </h2>
                    <button
                        type="button"
                        onClick={() =>
                            toastDemo('Opening the alumni directory')
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#587057] hover:text-[#294b32]"
                    >
                        View directory <ArrowRight className="size-3" />
                    </button>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[690px] text-left">
                    <thead>
                        <tr className="border-b border-[#eff0ec] bg-[#fafbf9] text-[10px] font-semibold tracking-wide text-[#848a81] uppercase">
                            <th className="px-4 py-3 sm:px-5">Alumnus</th>
                            <th className="px-4 py-3">Program</th>
                            <th className="px-4 py-3">Class</th>
                            <th className="px-4 py-3">Employment</th>
                            <th className="px-4 py-3">Current employer</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f1ed]">
                        {records.length ? (
                            records.map((record) => (
                                <tr
                                    key={record.studentNumber}
                                    className="text-xs text-[#5f685f] transition hover:bg-[#fcfcfa]"
                                >
                                    <td className="px-4 py-3.5 sm:px-5">
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold ${record.color}`}
                                            >
                                                {record.initials}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block font-semibold text-[#39463b]">
                                                    {record.name}
                                                </span>
                                                <span className="mt-0.5 block text-[10px] text-[#92978f]">
                                                    {record.studentNumber}
                                                </span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        {record.program}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        {record.year}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass[record.status] ?? 'bg-[#f0f1ed] text-[#6d746a]'}`}
                                        >
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        {record.employer}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-5 py-12 text-center text-sm text-[#858b82]"
                                >
                                    No alumni match this search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {!compact && (
                <div className="flex items-center justify-between border-t border-[#eff0ec] px-4 py-3 text-[11px] text-[#838980] sm:px-5">
                    <span>Showing {records.length} of 12,486 alumni</span>
                    <div className="flex items-center gap-1">
                        <button
                            aria-label="Previous page"
                            type="button"
                            className="grid size-7 place-items-center rounded-lg border border-[#e8eae4] hover:bg-[#f7f8f5]"
                        >
                            <ChevronLeft className="size-3.5" />
                        </button>
                        <span className="px-2">1 of 1,249</span>
                        <button
                            aria-label="Next page"
                            type="button"
                            className="grid size-7 place-items-center rounded-lg border border-[#e8eae4] hover:bg-[#f7f8f5]"
                        >
                            <ChevronRight className="size-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

function Opportunities({ role }: { role: Role }) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {jobOpenings.map((job, index) => (
                <article
                    key={job.title}
                    className="rounded-2xl border border-[#e9ebe5] bg-white p-5 transition hover:border-[#dce3d8] hover:shadow-sm"
                >
                    <div className="flex items-start justify-between gap-3">
                        <span
                            className={`grid size-11 place-items-center rounded-xl text-base font-bold ${job.tone}`}
                        >
                            {job.logo}
                        </span>
                        <span className="rounded-full bg-[#f3f5f0] px-2.5 py-1 text-[10px] font-medium text-[#687667]">
                            {job.posted}
                        </span>
                    </div>
                    <h2 className="mt-4 font-semibold text-[#2e3c31]">
                        {job.title}
                    </h2>
                    <p className="mt-1 text-sm text-[#687267]">{job.company}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#778075]">
                        <span className="rounded-full border border-[#e9ebe5] px-2.5 py-1">
                            {job.location}
                        </span>
                        <span className="rounded-full border border-[#e9ebe5] px-2.5 py-1">
                            {job.type}
                        </span>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-[#f0f1ed] pt-4">
                        <span className="text-[11px] text-[#858b82]">
                            {role === 'Employer'
                                ? `${12 - index * 2} applicants`
                                : 'Posted by verified employer'}
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                toastDemo(
                                    role === 'Employer'
                                        ? 'Opening applicants'
                                        : 'Application started',
                                )
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#45664a] hover:text-[#234a37]"
                        >
                            {role === 'Employer'
                                ? 'View applicants'
                                : 'View opportunity'}{' '}
                            <ArrowRight className="size-3.5" />
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
}

function GenericSection({ title, role }: { title: string; role: Role }) {
    if (['Alumni directory', 'Program alumni'].includes(title)) {
        return <SearchableDirectory />;
    }

    if (
        ['Career opportunities', 'Employers & jobs', 'Job postings'].includes(
            title,
        )
    ) {
        return <Opportunities role={role} />;
    }

    if (
        title.includes('Report') ||
        title.includes('outcomes') ||
        title.includes('analytics')
    ) {
        return (
            <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                    <SectionTitle
                        title="Employment by graduating class"
                        action={
                            <button
                                type="button"
                                onClick={() => toastDemo('Date range updated')}
                                className="text-[11px] font-medium text-[#687267]"
                            >
                                2021–2026{' '}
                                <ChevronDown className="ml-1 inline size-3" />
                            </button>
                        }
                    />
                    <div className="space-y-4 pt-3">
                        {graduateOutcomes.map((item) => (
                            <div
                                key={item.year}
                                className="grid grid-cols-[48px_1fr_42px] items-center gap-3 text-xs"
                            >
                                <span className="text-[#798076]">
                                    {item.year}
                                </span>
                                <div className="h-2.5 overflow-hidden rounded-full bg-[#f0f1ed]">
                                    <div
                                        className="h-full rounded-full bg-[#69866c]"
                                        style={{ width: `${item.employment}%` }}
                                    />
                                </div>
                                <span className="text-right font-semibold text-[#4c654f]">
                                    {item.employment}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                    <SectionTitle title="By employment status" />
                    <div className="space-y-4 pt-2">
                        {[
                            ['Employed', 78, 'bg-[#69866c]'],
                            ['Further studies', 12, 'bg-[#d6b384]'],
                            ['Seeking work', 7, 'bg-[#8da6b1]'],
                            ['Other', 3, 'bg-[#bdada0]'],
                        ].map(([label, percent, color]) => (
                            <div key={label as string}>
                                <div className="mb-1.5 flex justify-between text-[11px]">
                                    <span className="text-[#737b71]">
                                        {label}
                                    </span>
                                    <span className="font-semibold text-[#465248]">
                                        {percent}%
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[#f0f1ed]">
                                    <div
                                        className={`h-full rounded-full ${color}`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (
        title === 'My profile' ||
        title === 'Company profile' ||
        title === 'Academic records'
    ) {
        const detail = roleDetails[role];
        return (
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-6">
                    <div className="flex items-center gap-4">
                        <span className="grid size-14 place-items-center rounded-2xl bg-[#e9eee5] text-sm font-bold text-[#45634a]">
                            {detail.initials}
                        </span>
                        <div>
                            <h2 className="font-semibold text-[#2e3c31]">
                                {detail.name}
                            </h2>
                            <p className="mt-1 text-xs text-[#7a8278]">
                                {detail.context}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 space-y-3 border-t border-[#eff0ec] pt-5 text-xs">
                        {[
                            ['Email', 'sofia.reyes@email.com'],
                            ['Program', 'BS Information Technology'],
                            ['Graduation year', '2025'],
                            ['Location', 'Makati City, Philippines'],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="flex justify-between gap-3"
                            >
                                <span className="text-[#848a81]">{label}</span>
                                <span className="text-right font-medium text-[#4b574c]">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-6">
                    <SectionTitle
                        title={
                            title === 'Academic records'
                                ? 'Academic history'
                                : 'About'
                        }
                        action={
                            <button
                                type="button"
                                onClick={() => toastDemo('Edit form opened')}
                                className="text-[11px] font-semibold text-[#587057]"
                            >
                                Edit
                            </button>
                        }
                    />
                    <div className="rounded-xl bg-[#f8f9f6] p-4">
                        <p className="text-xs font-semibold text-[#3e4e41]">
                            Northfield College
                        </p>
                        <p className="mt-1 text-xs text-[#778075]">
                            Bachelor of Science in Information Technology
                        </p>
                        <p className="mt-3 text-[10px] text-[#8b9189]">
                            School of Computing · Class of 2025
                        </p>
                    </div>
                    <p className="mt-4 text-xs leading-5 text-[#747c72]">
                        Your profile is visible to authorized college
                        coordinators. Employers can only see information you
                        submit with a job application.
                    </p>
                </section>
            </div>
        );
    }

    if (title === 'Employment tracer') {
        return (
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                    <SectionTitle title="Current employment status" />
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            toastDemo('Employment information updated');
                        }}
                        className="mt-4 grid gap-4 sm:grid-cols-2"
                    >
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Employment status
                            <select className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs outline-none focus:border-[#819981]">
                                <option>Employed</option>
                                <option>Self-employed</option>
                                <option>Unemployed</option>
                                <option>Pursuing further studies</option>
                                <option>Freelance</option>
                                <option>Other</option>
                            </select>
                        </label>
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Employment type
                            <select className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs outline-none focus:border-[#819981]">
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contract</option>
                                <option>Freelance</option>
                            </select>
                        </label>
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Employer name
                            <input
                                defaultValue="Northstar Digital"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs outline-none focus:border-[#819981]"
                            />
                        </label>
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Job position
                            <input
                                defaultValue="Product Designer"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs outline-none focus:border-[#819981]"
                            />
                        </label>
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Industry
                            <input
                                defaultValue="Technology"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs outline-none focus:border-[#819981]"
                            />
                        </label>
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Work location
                            <input
                                defaultValue="Makati City, Philippines"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs outline-none focus:border-[#819981]"
                            />
                        </label>
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Start date
                            <input
                                type="date"
                                defaultValue="2025-03-10"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs outline-none focus:border-[#819981]"
                            />
                        </label>
                        <div className="flex items-end sm:justify-end">
                            <button
                                type="submit"
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2b5139] px-4 text-xs font-semibold text-white hover:bg-[#234530] sm:w-auto"
                            >
                                <Check className="size-3.5" /> Save update
                            </button>
                        </div>
                    </form>
                    <p className="mt-4 rounded-xl bg-[#f7f8f5] px-3 py-2.5 text-[10px] leading-4 text-[#7b8379]">
                        Your update adds a new employment history entry; it does
                        not replace previous records.
                    </p>
                </section>
                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                    <SectionTitle title="Employment history" />
                    <div className="relative mt-5 space-y-0 before:absolute before:top-2 before:bottom-5 before:left-[7px] before:w-px before:bg-[#e6e9e2]">
                        {[
                            [
                                'Mar 2025 – Present',
                                'Product Designer',
                                'Northstar Digital · Technology',
                                'bg-[#6d8b70]',
                            ],
                            [
                                'Jan 2024 – Feb 2025',
                                'Junior Designer',
                                'Harbor & Pine · Retail',
                                'bg-[#d5b17c]',
                            ],
                            [
                                'May 2023 – Dec 2023',
                                'Design intern',
                                'Common Ground Labs · Technology',
                                'bg-[#96a9b0]',
                            ],
                        ].map(([date, position, employer, color]) => (
                            <div
                                key={date}
                                className="relative flex gap-4 pb-6 last:pb-0"
                            >
                                <span
                                    className={`z-10 mt-1 size-[15px] shrink-0 rounded-full border-[3px] border-white ${color} ring-1 ring-[#e2e7df]`}
                                />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium text-[#8a9088]">
                                        {date}
                                    </p>
                                    <h3 className="mt-1 text-xs font-semibold text-[#3d4a3f]">
                                        {position}
                                    </h3>
                                    <p className="mt-1 text-[11px] text-[#7d857b]">
                                        {employer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        );
    }

    const entries =
        title === 'Surveys'
            ? [
                  [
                      'Graduate outcomes survey',
                      'Help us understand your transition after graduation.',
                      'Due Nov 17',
                      'In progress',
                  ],
                  [
                      'Alumni engagement pulse',
                      'Share what would make the alumni community more useful.',
                      'Due Nov 30',
                      'Not started',
                  ],
                  [
                      'Program feedback · Class of 2025',
                      'Reflect on your Northfield learning experience.',
                      'Closes Dec 08',
                      'Open',
                  ],
              ]
            : title === 'Announcements'
              ? [
                    [
                        'Alumni Homecoming 2026',
                        'Join us on campus to reconnect and celebrate our community.',
                        'Nov 21, 2026',
                        'Upcoming',
                    ],
                    [
                        'Applications open: Alumni mentorship',
                        'Share your experience with students beginning their journey.',
                        'Nov 12, 2026',
                        'New',
                    ],
                    [
                        'Northfield career connections night',
                        'Meet employers and fellow graduates at our online networking event.',
                        'Dec 08, 2026',
                        'Upcoming',
                    ],
                ]
              : title === 'Applicants'
                ? [
                      [
                          'Aria Mendoza',
                          'Product Designer · Class of 2024',
                          'Applied Nov 04',
                          'Under review',
                      ],
                      [
                          'Daniel Flores',
                          'Software Engineer · Class of 2023',
                          'Applied Nov 03',
                          'Shortlisted',
                      ],
                      [
                          'Katrina Yu',
                          'UX Research Intern · Class of 2025',
                          'Applied Nov 02',
                          'New applicant',
                      ],
                  ]
                : title === 'My applications'
                  ? [
                        [
                            'Product Designer · Northstar Digital',
                            'Makati · Hybrid · Full-time',
                            'Applied Nov 04',
                            'Under review',
                        ],
                        [
                            'Junior Data Analyst · Harbor & Pine',
                            'Quezon City · On-site · Full-time',
                            'Applied Oct 28',
                            'Interview scheduled',
                        ],
                        [
                            'UX Research Intern · Common Ground Labs',
                            'Remote · Philippines · Internship',
                            'Applied Oct 19',
                            'Submitted',
                        ],
                    ]
                  : [
                        [
                            'Registration review',
                            'A new alumni account is ready for coordinator review.',
                            'Nov 05, 2026',
                            'Needs review',
                        ],
                        [
                            'Graduate outcomes survey closes',
                            'A reminder to submit your response before the deadline.',
                            'Nov 17, 2026',
                            'Reminder',
                        ],
                        [
                            'Alumni Homecoming 2026',
                            'Meet classmates and celebrate the Northfield community.',
                            'Nov 21, 2026',
                            'Upcoming',
                        ],
                    ];

    return (
        <div className="grid gap-3">
            {entries.map(([titleText, description, date, badge]) => (
                <article
                    key={titleText}
                    className="flex flex-col gap-4 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:flex-row sm:items-center"
                >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eef2eb] text-[#5e795f]">
                        {title === 'Surveys' ? (
                            <ClipboardList className="size-4" />
                        ) : title === 'Applicants' ? (
                            <UsersRound className="size-4" />
                        ) : (
                            <MessageSquareText className="size-4" />
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-[#39463b]">
                            {titleText}
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-[#7a8278]">
                            {description}
                        </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <span className="text-[10px] text-[#858b82]">
                            {date}
                        </span>
                        <span className="rounded-full bg-[#f2f3ef] px-2.5 py-1 text-[10px] font-medium text-[#697367]">
                            {badge}
                        </span>
                        <button
                            type="button"
                            onClick={() => toastDemo(`Opening ${titleText}`)}
                            aria-label={`Open ${titleText}`}
                            className="grid size-8 place-items-center rounded-full border border-[#e8eae4] text-[#6e786c] hover:bg-[#f7f8f5]"
                        >
                            <ArrowUpRight className="size-3.5" />
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
}

function SearchableDirectory() {
    const [query, setQuery] = useState('');
    const filteredRecords = useMemo(
        () =>
            alumniRecords.filter((record) =>
                [
                    record.name,
                    record.studentNumber,
                    record.program,
                    record.department,
                    record.employer,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(query.toLowerCase()),
            ),
        [query],
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-[#e7e9e3] bg-white px-3">
                    <Search className="size-4 text-[#899087]" />
                    <input
                        aria-label="Search alumni"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by name, student number, or program"
                        className="w-full bg-transparent text-xs outline-none placeholder:text-[#9ca198]"
                    />
                </label>
                <button
                    type="button"
                    onClick={() => toastDemo('Filters opened')}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e7e9e3] bg-white px-4 text-xs font-semibold text-[#59665a] hover:bg-[#f8f9f6]"
                >
                    <SlidersHorizontal className="size-3.5" /> Filters{' '}
                    <ArrowDown className="size-3" />
                </button>
            </div>
            <section className="overflow-hidden rounded-2xl border border-[#e9ebe5] bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[690px] text-left">
                        <thead>
                            <tr className="border-b border-[#eff0ec] bg-[#fafbf9] text-[10px] font-semibold tracking-wide text-[#848a81] uppercase">
                                <th className="px-4 py-3 sm:px-5">Alumnus</th>
                                <th className="px-4 py-3">Program</th>
                                <th className="px-4 py-3">Class</th>
                                <th className="px-4 py-3">Employment</th>
                                <th className="px-4 py-3">Current employer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f1ed]">
                            {filteredRecords.length ? (
                                filteredRecords.map((record) => (
                                    <tr
                                        key={record.studentNumber}
                                        className="text-xs text-[#5f685f] hover:bg-[#fcfcfa]"
                                    >
                                        <td className="px-4 py-3.5 sm:px-5">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold ${record.color}`}
                                                >
                                                    {record.initials}
                                                </span>
                                                <span>
                                                    <span className="block font-semibold text-[#39463b]">
                                                        {record.name}
                                                    </span>
                                                    <span className="mt-0.5 block text-[10px] text-[#92978f]">
                                                        {record.studentNumber}
                                                    </span>
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {record.program}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {record.year}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass[record.status] ?? 'bg-[#f0f1ed] text-[#6d746a]'}`}
                                            >
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {record.employer}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-12 text-center text-sm text-[#858b82]"
                                    >
                                        No alumni match this search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between border-t border-[#eff0ec] px-4 py-3 text-[11px] text-[#838980] sm:px-5">
                    <span>
                        Showing {filteredRecords.length} of 12,486 alumni
                    </span>
                    <span>Sample records</span>
                </div>
            </section>
        </div>
    );
}

function CreateDialog({
    label,
    onClose,
}: {
    label: string;
    onClose: () => void;
}) {
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onClose();
        toastDemo(`${label} saved`);
    }

    return (
        <div
            role="presentation"
            onMouseDown={(event) =>
                event.target === event.currentTarget && onClose()
            }
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#17241a]/40 p-4 backdrop-blur-[2px]"
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-dialog-title"
                className="w-full max-w-md rounded-2xl border border-[#e8eae4] bg-white p-5 shadow-2xl sm:p-6"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h2
                            id="create-dialog-title"
                            className="text-lg font-semibold text-[#29382e]"
                        >
                            {label}
                        </h2>
                        <p className="mt-1 text-xs text-[#7b8379]">
                            Preview interaction · changes are not saved.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close dialog"
                        onClick={onClose}
                        className="grid size-8 place-items-center rounded-full text-[#778075] hover:bg-[#f1f3ee]"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <form onSubmit={submit} className="mt-5 space-y-4">
                    <label className="block text-xs font-medium text-[#4d5a4f]">
                        Name or title
                        <input
                            required
                            autoFocus
                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-sm outline-none focus:border-[#819981] focus:ring-2 focus:ring-[#e5ede3]"
                            placeholder="Enter a name or title"
                        />
                    </label>
                    <label className="block text-xs font-medium text-[#4d5a4f]">
                        Notes
                        <textarea
                            rows={3}
                            className="mt-1.5 w-full resize-none rounded-lg border border-[#e3e7df] px-3 py-2 text-sm outline-none focus:border-[#819981] focus:ring-2 focus:ring-[#e5ede3]"
                            placeholder="Add a short description"
                        />
                    </label>
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 rounded-lg px-4 text-xs font-semibold text-[#677166] hover:bg-[#f4f5f2]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white hover:bg-[#234530]"
                        >
                            <Check className="size-3.5" /> Save preview
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default function AlumniPortal() {
    const [role, setRole] = useState<Role>('Administrator');
    const [activePage, setActivePage] = useState('Overview');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const profile = roleDetails[role];
    const currentPage =
        activePage === 'Overview'
            ? {
                  ...pageCopy.Overview,
                  title: `Good morning, ${profile.name.split(' ')[0]}`,
              }
            : (pageCopy[activePage] ?? pageCopy.Overview);
    const navItems = navigation[role];
    const isOverview =
        activePage === 'Overview' || activePage === 'My dashboard';

    function changeRole(value: Role) {
        setRole(value);
        setActivePage(navigation[value][0].label);
        setMobileNavOpen(false);
        setSearch('');
    }

    function handleAction() {
        if (currentPage.action?.startsWith('Export')) {
            toastDemo('Your report is ready to export');
        } else if (currentPage.action === 'Review employers') {
            setActivePage('Employers & jobs');
        } else if (activePage === 'Employment tracer') {
            toastDemo('Employment status form is ready');
        } else {
            setDialogOpen(true);
        }
    }

    const content = isOverview ? (
        <Overview role={role} />
    ) : activePage === 'Alumni directory' || activePage === 'Program alumni' ? (
        <GenericSection title={activePage} role={role} />
    ) : activePage === 'Career opportunities' ||
      activePage === 'Employers & jobs' ||
      activePage === 'Job postings' ? (
        <GenericSection title={activePage} role={role} />
    ) : (
        <GenericSection title={activePage} role={role} />
    );

    return (
        <div className="min-h-screen bg-[#f7f8f5] text-[#29362c]">
            {mobileNavOpen && (
                <button
                    aria-label="Close navigation"
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="fixed inset-0 z-30 bg-[#17241a]/30 md:hidden"
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#e7e9e3] bg-white transition-transform duration-200 md:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex h-16 items-center justify-between border-b border-[#eff0ec] px-4">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="grid size-8 place-items-center rounded-xl bg-[#284c36] text-white">
                            <GraduationCap className="size-[18px]" />
                        </span>
                        <span>
                            <span className="block text-xs font-bold tracking-tight text-[#2c3d30]">
                                Northfield College
                            </span>
                            <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.15em] text-[#849083] uppercase">
                                Alumni portal
                            </span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setMobileNavOpen(false)}
                        className="grid size-8 place-items-center rounded-lg text-[#7f877e] hover:bg-[#f4f5f2] md:hidden"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <div className="px-3 pt-4">
                    <label
                        htmlFor="role-preview"
                        className="mb-1.5 block px-1 text-[9px] font-bold tracking-[0.14em] text-[#9aa097] uppercase"
                    >
                        Preview as
                    </label>
                    <div className="relative">
                        <select
                            id="role-preview"
                            value={role}
                            onChange={(event) => {
                                const selectedRole = roles.find(
                                    (item) => item === event.target.value,
                                );
                                if (selectedRole) changeRole(selectedRole);
                            }}
                            className="h-9 w-full appearance-none rounded-xl border border-[#e9ebe5] bg-[#fafbf9] pr-9 pl-3 text-xs font-semibold text-[#48564a] outline-none focus:border-[#9eb29e]"
                        >
                            {roles.map((item) => (
                                <option key={item}>{item}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-3 right-3 size-3.5 text-[#80897e]" />
                    </div>
                </div>
                <div className="px-4 pt-4 pb-1.5 text-[9px] font-bold tracking-[0.14em] text-[#9aa097] uppercase">
                    Workspace
                </div>
                <nav
                    aria-label={`${role} navigation`}
                    className="portal-sidebar-nav flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2.5 pb-3"
                >
                    {navItems.map(({ label, icon: Icon }) => {
                        const selected = activePage === label;
                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => {
                                    setActivePage(label);
                                    setMobileNavOpen(false);
                                }}
                                aria-current={selected ? 'page' : undefined}
                                className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium transition ${selected ? 'bg-[#edf2eb] text-[#33583b]' : 'text-[#6e786d] hover:bg-[#f6f7f4] hover:text-[#3e5542]'}`}
                            >
                                <Icon className="size-4 shrink-0" />
                                {label}
                                {label === 'Surveys' && role === 'Alumni' && (
                                    <span className="ml-auto grid size-5 place-items-center rounded-full bg-[#e2eadf] text-[9px] font-bold text-[#4f6b51]">
                                        2
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    <div className="my-3 border-t border-[#eff0ec]" />
                    <button
                        type="button"
                        onClick={() => toastDemo('Help center opened')}
                        className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium text-[#6e786d] hover:bg-[#f6f7f4]"
                    >
                        <CircleHelp className="size-4" /> Help center
                    </button>
                    <button
                        type="button"
                        onClick={() => toastDemo('Settings opened')}
                        className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium text-[#6e786d] hover:bg-[#f6f7f4]"
                    >
                        <Settings2 className="size-4" /> Settings
                    </button>
                </nav>
                <div className="border-t border-[#eff0ec] p-2.5">
                    <div className="flex items-center gap-2 rounded-xl bg-[#f7f8f5] p-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e4ece2] text-[10px] font-bold text-[#49664c]">
                            {profile.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-semibold text-[#435044]">
                                {profile.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-[#858c83]">
                                {profile.context}
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={() => toastDemo('Account menu opened')}
                            aria-label="Open account menu"
                            className="grid size-7 place-items-center rounded-lg text-[#818980] hover:bg-white"
                        >
                            <ChevronDown className="size-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            <div className="min-h-screen md:pl-[248px]">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e7e9e3] bg-[#ffffff]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            aria-label="Open navigation"
                            onClick={() => setMobileNavOpen(true)}
                            className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#e9ebe5] bg-white text-[#667166] hover:bg-[#f8f9f6] md:hidden"
                        >
                            <Menu className="size-4" />
                        </button>
                        <div className="hidden items-center gap-2 text-xs text-[#969c94] sm:flex">
                            <span>Workspace</span>
                            <ChevronRight className="size-3" />
                        </div>
                        <span className="truncate text-xs font-semibold text-[#4c584e]">
                            {activePage}
                        </span>
                        <span className="hidden rounded-full bg-[#f0f2ed] px-2 py-1 text-[9px] font-medium text-[#7a8278] lg:inline-flex">
                            {profile.scope}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <label className="hidden h-9 w-48 items-center gap-2 rounded-xl border border-[#e8eae4] bg-white px-2.5 lg:flex">
                            <Search className="size-3.5 text-[#929990]" />
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search anything..."
                                className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#9ca198]"
                            />
                            <kbd className="rounded border border-[#e8eae4] px-1 py-0.5 text-[9px] text-[#929990]">
                                ⌘ K
                            </kbd>
                        </label>
                        <button
                            type="button"
                            aria-label="Notifications"
                            onClick={() => toastDemo('You’re all caught up')}
                            className="relative grid size-9 place-items-center rounded-xl border border-[#e8eae4] bg-white text-[#687367] hover:bg-[#f8f9f6]"
                        >
                            <Bell className="size-4" />
                            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[#c57657]" />
                        </button>
                        <span className="grid size-8 place-items-center rounded-full bg-[#e4ece2] text-[10px] font-bold text-[#49664c]">
                            {profile.initials}
                        </span>
                    </div>
                </header>

                <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.16em] text-[#829080] uppercase">
                                {role} workspace
                            </p>
                            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-[#2c3c30] sm:text-[28px]">
                                {currentPage.title}
                            </h1>
                            <p className="mt-1.5 text-xs leading-5 text-[#7c847a] sm:text-sm">
                                {currentPage.description}
                            </p>
                        </div>
                        {currentPage.action && (
                            <button
                                type="button"
                                onClick={handleAction}
                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2b5139] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#234530]"
                            >
                                {currentPage.action.startsWith('Export') ? (
                                    <FileSpreadsheet className="size-3.5" />
                                ) : (
                                    <Plus className="size-3.5" />
                                )}
                                {currentPage.action}
                            </button>
                        )}
                    </div>

                    {search && !isOverview && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#dfe8dc] bg-[#f0f5ee] px-3 py-2 text-xs text-[#536c55]">
                            <Search className="size-3.5" />
                            Searching prototype data for “{search}”
                            <button
                                type="button"
                                aria-label="Clear search"
                                onClick={() => setSearch('')}
                                className="ml-auto"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>
                    )}

                    {content}

                    <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#e8eae4] pt-4 text-[10px] text-[#929990] sm:flex-row">
                        <span>
                            Northfield College · Alumni Tracer Management System
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-[#8da68a]" />{' '}
                            UI preview with sample data
                        </span>
                    </footer>
                </main>
            </div>

            <Link
                href="/"
                className="fixed right-4 bottom-4 z-20 inline-flex h-9 items-center gap-2 rounded-full border border-[#e3e7df] bg-white/95 px-3 text-[10px] font-semibold text-[#58665a] shadow-lg backdrop-blur transition hover:bg-white sm:right-6 sm:bottom-5"
            >
                <ArrowDownRight className="size-3.5 rotate-[-135deg]" /> Public
                website
            </Link>
            {dialogOpen && (
                <CreateDialog
                    label={currentPage.action ?? 'Create item'}
                    onClose={() => setDialogOpen(false)}
                />
            )}
        </div>
    );
}
