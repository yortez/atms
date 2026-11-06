import { useEffect, useState, type FormEvent } from 'react';
import {
    ArrowRight,
    BriefcaseBusiness,
    Building2,
    ClipboardList,
    MessageSquareText,
    UserPlus,
    UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/confirmation-dialog';
import { useApiResource } from '@/hooks/use-api-resource';
import {
    ApiError,
    apiRequest,
    type ApiEnvelope,
    type PaginatedApiResponse,
} from '@/lib/api';
import type {
    AcademicDepartment,
    AcademicProgram,
    ActivityLogEntry,
    Announcement,
    AlumniProfile,
    DashboardStatistics,
    EmploymentRecord,
    EmploymentStatus,
    Employer,
    JobApplication,
    JobPosting,
    RegistrationAssistanceRequest,
    Survey,
    UserNotification,
} from '@/types/alumni';

function LoadingState() {
    return (
        <div
            role="status"
            className="rounded-2xl border border-[#e9ebe5] bg-white p-6 text-sm text-[#7a8278]"
        >
            Loading records…
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div
            role="alert"
            className="rounded-2xl border border-[#ecd8d2] bg-white p-6 text-sm text-[#8b4e43]"
        >
            {message}
        </div>
    );
}

function EmptyState({ children }: { children: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#dfe4dc] bg-white p-8 text-center text-sm text-[#858b82]">
            {children}
        </div>
    );
}

type WorkspaceRole =
    | 'Administrator'
    | 'Alumni coordinator'
    | 'Department coordinator'
    | 'Alumni'
    | 'Employer';

type OverviewProps = {
    role: WorkspaceRole;
    onNavigate: (page: string) => void;
};

export function LiveOverview({ role, onNavigate }: OverviewProps) {
    const statsResource = useApiResource<ApiEnvelope<DashboardStatistics>>(
        '/api/dashboard/stats',
    );
    const announcementsResource =
        useApiResource<ApiEnvelope<PaginatedApiResponse<Announcement>>>(
            '/api/announcements',
        );
    const surveysResource = useApiResource<
        ApiEnvelope<PaginatedApiResponse<Survey>>
    >(role === 'Alumni' ? '/api/surveys' : null);
    const jobsResource = useApiResource<
        ApiEnvelope<PaginatedApiResponse<JobPosting>>
    >(role === 'Alumni' ? '/api/jobs' : null);

    if (statsResource.loading) {
        return <LoadingState />;
    }

    if (statsResource.error) {
        return <ErrorState message={statsResource.error} />;
    }

    const stats = statsResource.data?.data;
    if (!stats) {
        return <EmptyState>Dashboard statistics are not available.</EmptyState>;
    }

    const { metrics } = stats;
    const outcomeTotal = stats.employment_outcomes.reduce(
        (total, outcome) => total + outcome.alumni_count,
        0,
    );
    const employedTotal = stats.employment_outcomes.reduce(
        (total, outcome) =>
            isEmployedOutcome(outcome.code)
                ? total + outcome.alumni_count
                : total,
        0,
    );
    const employmentRate = outcomeTotal
        ? Math.round((employedTotal / outcomeTotal) * 100)
        : 0;

    const cards =
        role === 'Alumni'
            ? [
                {
                    label: 'Surveys to complete',
                    value:
                        surveysResource.data?.data.data.filter(
                            (survey) => !survey.has_responded,
                        ).length ?? '—',
                    detail: 'Open surveys',
                    icon: ClipboardList,
                },
                {
                    label: 'Applications',
                    value: metrics.applications.total,
                    detail: 'Your submissions',
                    icon: BriefcaseBusiness,
                },
                {
                    label: 'Career opportunities',
                    value: metrics.jobs.published,
                    detail: 'Open positions',
                    icon: Building2,
                },
                {
                    label: 'Community updates',
                    value: metrics.announcements_published_count,
                    detail: 'Published announcements',
                    icon: UsersRound,
                },
            ]
            : role === 'Employer'
                ? [
                    {
                        label: 'Active job posts',
                        value: metrics.jobs.published,
                        detail: 'Your published roles',
                        icon: BriefcaseBusiness,
                    },
                    {
                        label: 'Applications',
                        value: metrics.applications.total,
                        detail: 'Received for your roles',
                        icon: UsersRound,
                    },
                    {
                        label: 'Employers',
                        value: metrics.employers.verified
                            ? 'Verified'
                            : metrics.employers.pending
                                ? 'Pending review'
                                : 'Not registered',
                        detail: 'Company status',
                        icon: Building2,
                    },
                    {
                        label: 'Announcements',
                        value: metrics.announcements_published_count,
                        detail: 'Community updates',
                        icon: ClipboardList,
                    },
                ]
                : [
                    {
                        label:
                            role === 'Department coordinator'
                                ? 'Program alumni'
                                : 'Alumni records',
                        value: metrics.alumni_count,
                        detail: 'Active alumni',
                        icon: UsersRound,
                    },
                    {
                        label: 'Employment rate',
                        value: outcomeTotal ? `${employmentRate}%` : '—',
                        detail: `${employedTotal} reported employed`,
                        icon: BriefcaseBusiness,
                    },
                    {
                        label: 'Survey responses',
                        value: metrics.survey_response_count,
                        detail: `${metrics.survey_count} surveys`,
                        icon: ClipboardList,
                    },
                    {
                        label:
                            role === 'Department coordinator'
                                ? 'Announcements'
                                : 'Verified employers',
                        value:
                            role === 'Department coordinator'
                                ? metrics.announcements_published_count
                                : metrics.employers.verified,
                        detail:
                            role === 'Department coordinator'
                                ? 'Published updates'
                                : `${metrics.employers.pending} pending review`,
                        icon:
                            role === 'Department coordinator'
                                ? ClipboardList
                                : Building2,
                    },
                ];

    const announcements = announcementsResource.data?.data.data ?? [];
    const openSurveys =
        surveysResource.data?.data.data.filter(
            (survey) => !survey.has_responded,
        ) ?? [];
    const availableJobs = jobsResource.data?.data.data ?? [];

    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ label, value, detail, icon: Icon }, index) => (
                    <article
                        key={label}
                        className="rounded-2xl border border-[#e9ebe5] bg-white p-3.5 shadow-[0_1px_2px_rgba(27,39,30,0.02)] sm:p-4"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium text-[#788076]">
                                {label}
                            </p>
                            <span
                                className={`grid size-9 place-items-center rounded-xl ${['bg-[#e9eee5]', 'bg-[#f3eee5]', 'bg-[#e8edf0]', 'bg-[#efebf1]'][index]} text-[#516952]`}
                            >
                                <Icon className="size-4" />
                            </span>
                        </div>
                        <p className="mt-4 text-2xl font-semibold tracking-tight text-[#27362c]">
                            {value}
                        </p>
                        <p className="mt-1 text-[11px] text-[#6e806d]">
                            {detail}
                        </p>
                    </article>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold tracking-tight text-[#29382e]">
                            {role === 'Alumni'
                                ? 'Your next steps'
                                : role === 'Employer'
                                    ? 'Applications by status'
                                    : 'Employment outcomes'}
                        </h2>
                        <button
                            type="button"
                            onClick={() =>
                                onNavigate(
                                    role === 'Employer'
                                        ? 'Applicants'
                                        : role === 'Alumni'
                                            ? 'Employment tracer'
                                            : 'Reports',
                                )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#587057]"
                        >
                            View details <ArrowRight className="size-3" />
                        </button>
                    </div>
                    {role === 'Employer' ? (
                        metrics.applications.by_status.length ? (
                            <div className="space-y-4 pt-2">
                                {metrics.applications.by_status.map(
                                    ({ status, count }) => {
                                        const percent = metrics.applications
                                            .total
                                            ? Math.round(
                                                (count /
                                                    metrics.applications
                                                        .total) *
                                                100,
                                            )
                                            : 0;
                                        return (
                                            <div key={status}>
                                                <div className="mb-1.5 flex justify-between text-[11px]">
                                                    <span className="text-[#737b71] capitalize">
                                                        {status.replaceAll(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </span>
                                                    <span className="font-semibold text-[#465248]">
                                                        {count}
                                                    </span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-[#f0f1ed]">
                                                    <div
                                                        className="h-full rounded-full bg-[#69866c]"
                                                        style={{
                                                            width: `${percent}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        ) : (
                            <EmptyState>
                                No applications have been received yet.
                            </EmptyState>
                        )
                    ) : role === 'Alumni' &&
                        (surveysResource.error || jobsResource.error) ? (
                        <ErrorState
                            message={
                                surveysResource.error ??
                                jobsResource.error ??
                                'Dashboard data could not be loaded.'
                            }
                        />
                    ) : role === 'Alumni' ? (
                        <div className="space-y-3">
                            {openSurveys.slice(0, 2).map((survey) => (
                                <button
                                    key={survey.id}
                                    type="button"
                                    onClick={() => onNavigate('Surveys')}
                                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#eff0ec] p-3 text-left hover:bg-[#f8f9f6]"
                                >
                                    <span>
                                        <span className="block text-xs font-semibold text-[#39463b]">
                                            {survey.title}
                                        </span>
                                        <span className="mt-1 block text-[10px] text-[#858b82]">
                                            Survey awaiting your response
                                        </span>
                                    </span>
                                    <ArrowRight className="size-3.5 text-[#6b7b69]" />
                                </button>
                            ))}
                            {availableJobs.slice(0, 2).map((job) => (
                                <button
                                    key={job.id}
                                    type="button"
                                    onClick={() =>
                                        onNavigate('Career opportunities')
                                    }
                                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#eff0ec] p-3 text-left hover:bg-[#f8f9f6]"
                                >
                                    <span>
                                        <span className="block text-xs font-semibold text-[#39463b]">
                                            {job.title}
                                        </span>
                                        <span className="mt-1 block text-[10px] text-[#858b82]">
                                            {job.employer?.company_name ??
                                                'Employer'}{' '}
                                            ·{' '}
                                            {job.location ??
                                                'Location not listed'}
                                        </span>
                                    </span>
                                    <ArrowRight className="size-3.5 text-[#6b7b69]" />
                                </button>
                            ))}
                            {!openSurveys.length && !availableJobs.length ? (
                                <EmptyState>
                                    There are no open surveys or job
                                    opportunities right now.
                                </EmptyState>
                            ) : null}
                        </div>
                    ) : stats.employment_outcomes.length ? (
                        <div className="space-y-4">
                            {stats.employment_outcomes.map((outcome) => {
                                const percent = outcomeTotal
                                    ? Math.round(
                                        (outcome.alumni_count /
                                            outcomeTotal) *
                                        100,
                                    )
                                    : 0;
                                return (
                                    <div key={outcome.code}>
                                        <div className="mb-1.5 flex justify-between text-[11px]">
                                            <span className="text-[#737b71]">
                                                {outcome.label}
                                            </span>
                                            <span className="font-semibold text-[#465248]">
                                                {outcome.alumni_count}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-[#f0f1ed]">
                                            <div
                                                className="h-full rounded-full bg-[#69866c]"
                                                style={{
                                                    width: `${percent}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState>
                            No employment tracer updates have been reported.
                        </EmptyState>
                    )}
                </section>

                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold tracking-tight text-[#29382e]">
                            Recent announcements
                        </h2>
                        <button
                            type="button"
                            onClick={() => onNavigate('Announcements')}
                            className="text-[11px] font-semibold text-[#587057]"
                        >
                            View all
                        </button>
                    </div>
                    {announcementsResource.loading ? (
                        <p className="text-xs text-[#7a8278]">
                            Loading announcements…
                        </p>
                    ) : announcementsResource.error ? (
                        <p role="alert" className="text-xs text-[#8b4e43]">
                            {announcementsResource.error}
                        </p>
                    ) : announcements.length ? (
                        <div className="space-y-3">
                            {announcements.slice(0, 3).map((announcement) => (
                                <button
                                    type="button"
                                    key={announcement.id}
                                    onClick={() => onNavigate('Announcements')}
                                    className="w-full rounded-xl border border-[#eff0ec] p-3 text-left hover:bg-[#f8f9f6]"
                                >
                                    <span className="block text-xs font-semibold text-[#39463b]">
                                        {announcement.title}
                                    </span>
                                    <span className="mt-1 line-clamp-2 block text-[10px] leading-4 text-[#7a8278]">
                                        {announcement.body}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <EmptyState>
                            No announcements have been published.
                        </EmptyState>
                    )}
                </section>
            </div>
        </div>
    );
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function isEmployedOutcome(status: string): boolean {
    return [
        'employed',
        'self-employed',
        'government-employee',
        'government employee',
        'freelance',
    ].includes(status.toLowerCase().replaceAll('_', '-'));
}

const statusClass: Record<string, string> = {
    Employed: 'bg-[#eaf1e9] text-[#45664a]',
    'Further studies': 'bg-[#eeeefa] text-[#62658f]',
    'Self-employed': 'bg-[#faf0e2] text-[#936536]',
    'Seeking work': 'bg-[#edf1f3] text-[#537483]',
};

function AlumniProfileDialog({
    profileId,
    onClose,
}: {
    profileId: number;
    onClose: () => void;
}) {
    const { data, loading, error } = useApiResource<ApiEnvelope<AlumniProfile>>(
        `/api/alumni/${profileId}`,
    );
    const profile = data?.data;

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const detail = (label: string, value: string | null | undefined) => (
        <div>
            <dt className="text-[10px] font-semibold tracking-wide text-[#8a9088] uppercase">
                {label}
            </dt>
            <dd className="mt-0.5 text-xs text-[#36443a]">{value || '—'}</dd>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/40"
            onClick={onClose}
        >
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Alumni profile"
                onClick={(event) => event.stopPropagation()}
                className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl"
            >
                <div className="sticky top-0 flex items-center justify-between border-b border-[#eff0ec] bg-white px-5 py-4">
                    <h2 className="text-sm font-semibold text-[#29382e]">
                        Alumni profile
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close profile"
                        className="rounded-lg p-1 text-[#838c81] hover:bg-[#f2f4f0]"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-5 p-5">
                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <ErrorState message={error} />
                    ) : profile ? (
                        <>
                            <section className="flex items-center gap-3">
                                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e9eee5] text-sm font-bold text-[#45634a]">
                                    {initials(profile.name)}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-base font-semibold text-[#29382e]">
                                        {profile.name}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        {profile.is_claimed ? (
                                            <span className="rounded-full bg-[#e3eee0] px-2 py-0.5 text-[10px] font-medium text-[#2f5a37]">
                                                Claimed
                                                {profile.claimed_at
                                                    ? ` · ${new Date(profile.claimed_at).toLocaleDateString()}`
                                                    : ''}
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-[#f3efe6] px-2 py-0.5 text-[10px] font-medium text-[#8a6a35]">
                                                Unclaimed
                                            </span>
                                        )}
                                        <span className="rounded-full bg-[#f0f1ed] px-2 py-0.5 text-[10px] font-medium text-[#6d746a] capitalize">
                                            {profile.profile_status}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-[#e9ebe5] p-4">
                                <h3 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[#495a4f] uppercase">
                                    Personal information
                                </h3>
                                <dl className="grid grid-cols-2 gap-3">
                                    {detail('First name', profile.first_name)}
                                    {detail('Middle name', profile.middle_name)}
                                    {detail('Last name', profile.last_name)}
                                    {detail('Suffix', profile.suffix)}
                                    {detail('Email', profile.email)}
                                    {detail('Birthdate', profile.date_of_birth)}
                                </dl>
                            </section>

                            <section className="rounded-2xl border border-[#e9ebe5] p-4">
                                <h3 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[#495a4f] uppercase">
                                    Academic records
                                </h3>
                                {profile.education_records?.length ? (
                                    <ul className="space-y-2.5">
                                        {profile.education_records.map((record) => (
                                            <li
                                                key={record.id}
                                                className="rounded-xl bg-[#fafbf9] p-3 text-xs text-[#4f5c50]"
                                            >
                                                <p className="font-semibold text-[#344436]">
                                                    {record.program ?? 'Program not set'}
                                                    {record.degree ? ` — ${record.degree}` : ''}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-[#7a8278]">
                                                    Student no. {record.student_number}
                                                    {record.graduation_year
                                                        ? ` · Class of ${record.graduation_year}`
                                                        : ''}
                                                    {record.honors ? ` · ${record.honors}` : ''}
                                                    {record.gwa ? ` · GWA ${record.gwa}` : ''}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-[#7a8278]">
                                        No academic records visible.
                                    </p>
                                )}
                            </section>

                            <section className="rounded-2xl border border-[#e9ebe5] p-4">
                                <h3 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[#495a4f] uppercase">
                                    Employment history
                                </h3>
                                {profile.employment_records?.length ? (
                                    <ol className="space-y-3">
                                        {profile.employment_records.map((record) => (
                                            <li
                                                key={record.id}
                                                className="border-l-2 border-[#dfe7dc] pl-3 text-xs"
                                            >
                                                <p className="text-[10px] font-medium text-[#8a9088]">
                                                    {record.started_on ?? 'Start not recorded'}
                                                    {record.ended_on ? ` – ${record.ended_on}` : ' – Present'}
                                                </p>
                                                <p className="mt-0.5 font-semibold text-[#3d4a3f]">
                                                    {record.job_title ?? record.status ?? 'Status update'}
                                                </p>
                                                <p className="text-[11px] text-[#6f786d]">
                                                    {[record.status, record.employer_name, record.work_location]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                                {record.is_related_to_degree !== undefined && (
                                                    <span
                                                        className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold ${record.is_related_to_degree ? 'bg-[#edf2eb] text-[#33583b]' : 'bg-[#f5f5f3] text-[#788077]'}`}
                                                    >
                                                        {record.is_related_to_degree
                                                            ? 'Degree-related'
                                                            : 'Not degree-related'}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-xs text-[#7a8278]">
                                        No employment updates reported yet.
                                    </p>
                                )}
                            </section>
                        </>
                    ) : null}
                </div>
            </aside>
        </div>
    );
}

export function AlumniDirectory({
    createOpen,
    onCloseCreate,
    query,
    onQueryChange,
}: {
    createOpen: boolean;
    onCloseCreate: () => void;
    query: string;
    onQueryChange: (value: string) => void;
}) {
    const [page, setPage] = useState(1);
    const [creating, setCreating] = useState(false);
    const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importStats, setImportStats] = useState<{
        total: number;
        successful: number;
        failed: number;
        profiles_created: number;
        education_records_created: number;
        errors: string[];
    } | null>(null);
    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        date_of_birth: '',
        sex: '',
        civil_status: '',
        contact_number: '',
        email: '',
        current_address: '',
        permanent_address: '',
        student_number: '',
        program: '',
        batch_year: '',
        latin_honors: '',
        gwa: '',
    });
    const params = new URLSearchParams({ page: String(page) });

    if (query.trim()) {
        params.set('search', query.trim());
    }

    const { data, loading, error, reload } = useApiResource<
        PaginatedApiResponse<AlumniProfile>
    >(`/api/alumni?${params.toString()}`);

    async function createAlumnus(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);

        try {
            const fullName = [
                form.first_name,
                form.middle_name,
                form.last_name,
                form.suffix,
            ]
                .filter(Boolean)
                .join(' ')
                .trim();

            await apiRequest<ApiEnvelope<AlumniProfile>>('/api/alumni', {
                method: 'POST',
                body: {
                    first_name: form.first_name,
                    middle_name: form.middle_name || null,
                    last_name: form.last_name,
                    suffix: form.suffix || null,
                    name: fullName,
                    email: form.email,
                    date_of_birth: form.date_of_birth,
                },
            });
            setForm({
                first_name: '',
                middle_name: '',
                last_name: '',
                suffix: '',
                date_of_birth: '',
                sex: '',
                civil_status: '',
                contact_number: '',
                email: '',
                current_address: '',
                permanent_address: '',
                student_number: '',
                program: '',
                batch_year: '',
                latin_honors: '',
                gwa: '',
            });
            onCloseCreate();
            toast.success('Alumni record created.');
            reload();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Alumni record could not be created.',
            );
        } finally {
            setCreating(false);
        }
    }

    function updateField(name: string, value: string) {
        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleImportSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!importFile) {
            toast.error('Please select a CSV file to import.');
            return;
        }

        setImporting(true);
        setImportStats(null);

        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const res = await apiRequest<{
                message: string;
                data: {
                    total: number;
                    successful: number;
                    failed: number;
                    profiles_created: number;
                    education_records_created: number;
                    errors: string[];
                };
            }>('/api/alumni/import', {
                method: 'POST',
                body: formData,
            });

            setImportStats(res.data);
            if (res.data.successful > 0) {
                toast.success(res.message);
                reload();
            } else {
                toast.error('Import completed with errors.');
            }
        } catch (err) {
            toast.error(
                err instanceof ApiError ? err.message : 'Import failed.',
            );
        } finally {
            setImporting(false);
        }
    }

    return (
        <div className="space-y-4">
            {createOpen && (
                <form
                    onSubmit={createAlumnus}
                    className="rounded-2xl border border-[#e9ebe5] bg-white p-4 shadow-[0_1px_2px_rgba(27,39,30,0.03)] sm:p-5"
                >
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="space-y-5">
                            <section className="rounded-2xl border border-[#e9ebe5] bg-[#fafbf9] p-4">
                                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#495a4f]">
                                    Personal Information
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {[
                                        ['first_name', 'First name', 'text'],
                                        ['middle_name', 'Middle name', 'text'],
                                        ['last_name', 'Last name', 'text'],
                                        ['suffix', 'Suffix', 'text'],
                                        ['date_of_birth', 'Birthdate', 'date'],
                                        ['sex', 'Sex', 'select'],
                                        ['civil_status', 'Civil status', 'select'],
                                        ['contact_number', 'Contact number', 'tel'],
                                        ['email', 'Email address', 'email'],
                                    ].map(([name, label, type]) => {
                                        const sharedClasses =
                                            'mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]';

                                        if (type === 'select') {
                                            const selectName =
                                                name === 'sex'
                                                    ? 'sex'
                                                    : 'civil_status';
                                            const options =
                                                selectName === 'sex'
                                                    ? [
                                                        ['', 'Select'],
                                                        ['male', 'Male'],
                                                        ['female', 'Female'],
                                                        ['other', 'Other'],
                                                    ]
                                                    : [
                                                        ['', 'Select'],
                                                        ['single', 'Single'],
                                                        ['married', 'Married'],
                                                        ['widowed', 'Widowed'],
                                                    ];

                                            return (
                                                <label
                                                    key={name}
                                                    className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#687267]"
                                                >
                                                    {label}
                                                    <select
                                                        value={
                                                            selectName === 'sex'
                                                                ? form.sex
                                                                : form.civil_status
                                                        }
                                                        onChange={(event) =>
                                                            updateField(
                                                                selectName,
                                                                event.target.value,
                                                            )
                                                        }
                                                        className={sharedClasses}
                                                    >
                                                        {options.map(([value, text]) => (
                                                            <option key={value || 'empty'} value={value}>
                                                                {text}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            );
                                        }

                                        return (
                                            <label
                                                key={name}
                                                className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#687267]"
                                            >
                                                {label}
                                                <input
                                                    type={type}
                                                    required={name === 'first_name' || name === 'last_name' || name === 'email'}
                                                    value={
                                                        form[
                                                        name as keyof typeof form
                                                        ] as string
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            name,
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={sharedClasses}
                                                />
                                            </label>
                                        );
                                    })}
                                    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#687267] md:col-span-2">
                                        Current address
                                        <input
                                            value={form.current_address}
                                            onChange={(event) =>
                                                updateField(
                                                    'current_address',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                                        />
                                    </label>
                                    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#687267] md:col-span-2">
                                        Permanent address
                                        <input
                                            value={form.permanent_address}
                                            onChange={(event) =>
                                                updateField(
                                                    'permanent_address',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                                        />
                                    </label>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-[#e9ebe5] bg-[#fafbf9] p-4">
                                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#495a4f]">
                                    Academic Information
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#687267]">
                                        Student number
                                        <input
                                            value={form.student_number}
                                            onChange={(event) =>
                                                updateField(
                                                    'student_number',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                                        />
                                    </label>
                                    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#687267]">
                                        Program
                                        <select
                                            value={form.program}
                                            onChange={(event) =>
                                                updateField(
                                                    'program',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                                        >
                                            <option value="">Select program</option>
                                            <option value="computer-science">Computer Science</option>
                                            <option value="information-technology">Information Technology</option>
                                            <option value="marketing">Marketing</option>
                                        </select>
                                    </label>
                                    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#687267]">
                                        Batch year
                                        <input
                                            type="number"
                                            value={form.batch_year}
                                            onChange={(event) =>
                                                updateField(
                                                    'batch_year',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                                        />
                                    </label>
                                    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#687267]">
                                        Latin honors
                                        <select
                                            value={form.latin_honors}
                                            onChange={(event) =>
                                                updateField(
                                                    'latin_honors',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                                        >
                                            <option value="">None</option>
                                            <option value="summa-cum-laude">Summa Cum Laude</option>
                                            <option value="magna-cum-laude">Magna Cum Laude</option>
                                            <option value="cum-laude">Cum Laude</option>
                                        </select>
                                    </label>
                                    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#687267]">
                                        GWA
                                        <input
                                            value={form.gwa}
                                            onChange={(event) =>
                                                updateField('gwa', event.target.value)
                                            }
                                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                                        />
                                    </label>
                                </div>
                            </section>
                        </div>

                        <aside className="space-y-4">
                            <div className="rounded-2xl border border-[#e9ebe5] bg-[#fafbf9] p-4 text-center">
                                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#495a4f]">
                                    Profile Photo
                                </h3>
                                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#e9eee5] text-2xl font-semibold text-[#45634a]">
                                    {form.first_name ? form.first_name[0]?.toUpperCase() : 'A'}
                                </div>
                                <button
                                    type="button"
                                    className="mt-4 w-full rounded-lg border border-[#dfe4dc] bg-white px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#4d5a4f] transition hover:border-[#b9c5b5]"
                                >
                                    Choose file
                                </button>
                                <p className="mt-2 text-[10px] text-[#7a8278]">
                                    JPG, PNG, GIF, max 5MB
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[#e9ebe5] bg-[#fafbf9] p-4 text-center">
                                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#495a4f]">
                                    Documents
                                </h3>
                                <button
                                    type="button"
                                    className="w-full rounded-lg border border-dashed border-[#dfe4dc] bg-white px-3 py-4 text-[10px] font-medium uppercase tracking-[0.12em] text-[#4d5a4f] transition hover:border-[#b9c5b5]"
                                >
                                    Choose file
                                </button>
                                <p className="mt-2 text-[10px] text-[#7a8278]">
                                    PDF, DOC, DOCX, max 5MB
                                </p>
                            </div>

                            <div className="space-y-2 rounded-2xl border border-[#e9ebe5] bg-[#fafbf9] p-3">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full rounded-lg bg-[#2b5139] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#21442d] disabled:opacity-70"
                                >
                                    {creating ? 'Saving…' : 'Create record'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onCloseCreate}
                                    className="w-full rounded-lg border border-[#dfe4dc] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4d5a4f] transition hover:border-[#b9c5b5]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </aside>
                    </div>
                </form>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-[#e7e9e3] bg-white px-3">
                    <span aria-hidden="true" className="text-sm text-[#899087]">
                        ⌕
                    </span>
                    <input
                        aria-label="Search alumni"
                        value={query}
                        onChange={(event) => {
                            onQueryChange(event.target.value);
                            setPage(1);
                        }}
                        placeholder="Search by name, student number, or program"
                        className="w-full bg-transparent text-xs outline-none placeholder:text-[#9ca198]"
                    />
                </label>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setImportModalOpen(true);
                            setImportStats(null);
                            setImportFile(null);
                        }}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#d2ddd0] bg-white px-3.5 text-xs font-semibold text-[#2c5339] shadow-xs transition hover:bg-[#edf2ea]"
                    >
                        <span>Import CSV</span>
                    </button>
                    <a
                        href="/api/alumni/import-template"
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-[#e2e7df] bg-[#f8faf7] px-3 text-xs font-medium text-[#5c685b] transition hover:bg-[#edf2ea]"
                        title="Download sample import template"
                    >
                        <span>Template</span>
                    </a>
                </div>
            </div>

            {viewingProfileId !== null && (
                <AlumniProfileDialog
                    profileId={viewingProfileId}
                    onClose={() => setViewingProfileId(null)}
                />
            )}

            {importModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-[#e3e7df] bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-[#2a382e]">
                                    Batch Import Alumni Records
                                </h3>
                                <p className="mt-1 text-xs text-[#737c71]">
                                    Upload a CSV file containing historical graduate records. Multiple student numbers belonging to the same individual will automatically be consolidated into a single profile.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setImportModalOpen(false)}
                                className="rounded-lg p-1 text-[#838c81] hover:bg-[#f2f4f0]"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleImportSubmit} className="mt-5 space-y-4">
                            <div className="rounded-xl border border-dashed border-[#c7d4c4] bg-[#f9fbf8] p-5 text-center">
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="block w-full text-xs text-[#526051] file:mr-3 file:rounded-lg file:border-0 file:bg-[#2b5139] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#234530]"
                                />
                                {importFile && (
                                    <p className="mt-2 text-[11px] font-medium text-[#3b593e]">
                                        Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>

                            {importStats && (
                                <div className="rounded-xl border border-[#d8e3d6] bg-[#f4f7f2] p-3 text-xs text-[#394d3c]">
                                    <p className="font-semibold">
                                        Import Summary: {importStats.successful} / {importStats.total} successful
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-[#556453]">
                                        • Profiles created: {importStats.profiles_created} | Education records: {importStats.education_records_created}
                                    </p>
                                    {importStats.failed > 0 && (
                                        <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-[#e8cecb] bg-[#fdf5f4] p-2 text-[10px] text-[#8e453c]">
                                            <p className="font-bold">Errors ({importStats.failed}):</p>
                                            {importStats.errors.map((err, i) => (
                                                <p key={i}>• {err}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setImportModalOpen(false)}
                                    className="rounded-xl border border-[#e2e7df] px-3.5 py-2 text-xs font-medium text-[#5c685b] hover:bg-[#f4f6f2]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!importFile || importing}
                                    className="rounded-xl bg-[#2b5139] px-4 py-2 text-xs font-semibold text-white hover:bg-[#234530] disabled:opacity-50"
                                >
                                    {importing ? 'Processing Import…' : 'Start Import'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : (
                <section className="overflow-hidden rounded-2xl border border-[#e9ebe5] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[690px] text-left">
                            <thead>
                                <tr className="border-b border-[#eff0ec] bg-[#fafbf9] text-[10px] font-semibold tracking-wide text-[#848a81] uppercase">
                                    <th className="px-4 py-3 sm:px-5">
                                        Alumnus
                                    </th>
                                    <th className="px-4 py-3">Program</th>
                                    <th className="px-4 py-3">Class</th>
                                    <th className="px-4 py-3">Employment</th>
                                    <th className="px-4 py-3">
                                        Current employer
                                    </th>
                                    <th className="px-4 py-3">Account</th>
                                    <th className="px-4 py-3 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f1ed]">
                                {data?.data.length ? (
                                    data.data.map((alumnus) => {
                                        const education =
                                            alumnus.education_records?.[0];
                                        const employment =
                                            alumnus.employment_records?.[0];
                                        const status = employment?.status;

                                        return (
                                            <tr
                                                key={alumnus.id}
                                                className="text-xs text-[#5f685f] hover:bg-[#fcfcfa]"
                                            >
                                                <td className="px-4 py-3.5 sm:px-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e9eee5] text-[10px] font-bold text-[#45634a]">
                                                            {initials(
                                                                alumnus.name,
                                                            )}
                                                        </span>
                                                        <span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setViewingProfileId(
                                                                        alumnus.id,
                                                                    )
                                                                }
                                                                className="block text-left font-semibold text-[#39463b] hover:text-[#2b5139] hover:underline"
                                                            >
                                                                {alumnus.name}
                                                            </button>
                                                            <span className="mt-0.5 block text-[10px] text-[#92978f]">
                                                                {education?.student_number ??
                                                                    '—'}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {education?.program ?? '—'}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {education?.graduation_year ??
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {status ? (
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass[status] ?? 'bg-[#f0f1ed] text-[#6d746a]'}`}
                                                        >
                                                            {status}
                                                        </span>
                                                    ) : (
                                                        'Not reported'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {employment?.employer_name ??
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {alumnus.is_claimed ? (
                                                        <span
                                                            title={
                                                                alumnus.claimed_at
                                                                    ? `Claimed on ${new Date(alumnus.claimed_at).toLocaleDateString()}`
                                                                    : 'Claimed'
                                                            }
                                                            className="rounded-full bg-[#e3eee0] px-2.5 py-1 text-[10px] font-medium text-[#2f5a37]"
                                                        >
                                                            Claimed
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-[#f3efe6] px-2.5 py-1 text-[10px] font-medium text-[#8a6a35]">
                                                            Unclaimed
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewingProfileId(
                                                                alumnus.id,
                                                            )
                                                        }
                                                        className="rounded-lg border border-[#d2ddd0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2c5339] hover:bg-[#edf2ea]"
                                                    >
                                                        View profile
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center text-sm text-[#858b82]"
                                        >
                                            No alumni records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#eff0ec] px-4 py-3 text-[11px] text-[#838980] sm:px-5">
                        <span>
                            Showing {data?.data.length ?? 0} of{' '}
                            {data?.meta?.total ?? 0} alumni
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={!data?.links?.prev}
                                onClick={() =>
                                    setPage((current) => current - 1)
                                }
                                className="rounded-lg border border-[#e8eae4] px-2 py-1 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span>
                                {data?.meta?.current_page ?? 0} of{' '}
                                {data?.meta?.last_page ?? 0}
                            </span>
                            <button
                                type="button"
                                disabled={!data?.links?.next}
                                onClick={() =>
                                    setPage((current) => current + 1)
                                }
                                className="rounded-lg border border-[#e8eae4] px-2 py-1 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export function AcademicRecords() {
    const { data, loading, error } =
        useApiResource<ApiEnvelope<AlumniProfile>>('/api/me/alumni');
    const profile = data?.data;

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    if (!profile) {
        return (
            <EmptyState>
                No academic profile is linked to this account.
            </EmptyState>
        );
    }

    return (
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-2xl border border-[#e9ebe5] bg-white p-6">
                <h2 className="font-semibold text-[#2e3c31]">{profile.name}</h2>
                <p className="mt-1 text-xs text-[#7a8278]">{profile.email}</p>
                <p className="mt-5 border-t border-[#eff0ec] pt-4 text-xs text-[#737b71]">
                    Alumni profile: {profile.profile_status}
                </p>
            </section>
            <section className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-sm font-semibold tracking-tight text-[#29382e]">
                    Academic history
                </h2>
                {profile.education_records?.length ? (
                    <div className="space-y-3">
                        {profile.education_records.map((record) => (
                            <article
                                key={record.id}
                                className="rounded-xl bg-[#f8f9f6] p-4"
                            >
                                <p className="text-xs font-semibold text-[#3e4e41]">
                                    {record.degree ?? 'Academic record'}
                                </p>
                                <p className="mt-1 text-xs text-[#778075]">
                                    {record.program ?? 'Program not recorded'}
                                </p>
                                <p className="mt-3 text-[10px] text-[#8b9189]">
                                    Student number {record.student_number}
                                    {record.graduation_year
                                        ? ` · Class of ${record.graduation_year}`
                                        : ''}
                                    {record.honors ? ` · ${record.honors}` : ''}
                                </p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState>
                        No academic records are linked to this profile.
                    </EmptyState>
                )}
            </section>
        </div>
    );
}

export function AlumniProfileSummary({
    editOpen,
    onCloseEdit,
}: {
    editOpen: boolean;
    onCloseEdit: () => void;
}) {
    const { data, loading, error, reload } =
        useApiResource<ApiEnvelope<AlumniProfile>>('/api/me/alumni');
    const profile = data?.data;
    const [preferredName, setPreferredName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setPreferredName(profile?.preferred_name ?? '');
    }, [profile?.preferred_name]);

    async function savePreferredName(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!profile) {
            return;
        }

        setSaving(true);
        try {
            await apiRequest<ApiEnvelope<AlumniProfile>>(
                `/api/alumni/${profile.id}`,
                {
                    method: 'PATCH',
                    body: { preferred_name: preferredName || null },
                },
            );
            reload();
            onCloseEdit();
            toast.success('Preferred name updated.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Profile could not be updated.',
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    if (!profile) {
        return (
            <EmptyState>
                No alumni profile is linked to this account.
            </EmptyState>
        );
    }

    return (
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-2xl border border-[#e9ebe5] bg-white p-6">
                <div className="flex items-center gap-4">
                    <span className="grid size-14 place-items-center rounded-2xl bg-[#e9eee5] text-sm font-bold text-[#45634a]">
                        {initials(profile.name)}
                    </span>
                    <div className="min-w-0">
                        <h2 className="font-semibold text-[#2e3c31]">
                            {profile.preferred_name ?? profile.name}
                        </h2>
                        <p className="mt-1 text-xs text-[#7a8278]">
                            {profile.email}
                        </p>
                    </div>
                </div>
                <dl className="mt-6 space-y-3 border-t border-[#eff0ec] pt-5 text-xs">
                    {[
                        ['Profile status', profile.profile_status],
                        ['Date of birth', profile.date_of_birth],
                        [
                            'Student number',
                            profile.education_records?.[0]?.student_number ??
                            'Not recorded',
                        ],
                        [
                            'Program',
                            profile.education_records?.[0]?.program ??
                            'Not recorded',
                        ],
                        [
                            'Graduation year',
                            profile.education_records?.[0]?.graduation_year ??
                            'Not recorded',
                        ],
                    ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-3">
                            <dt className="text-[#848a81]">{label}</dt>
                            <dd className="text-right font-medium text-[#4b574c]">
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>
            <section className="rounded-2xl border border-[#e9ebe5] bg-white p-6">
                {editOpen ? (
                    <form onSubmit={savePreferredName} className="space-y-3">
                        <label className="block text-xs font-medium text-[#4d5a4f]">
                            Preferred name
                            <input
                                value={preferredName}
                                onChange={(event) =>
                                    setPreferredName(event.target.value)
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onCloseEdit}
                                className="h-9 rounded-lg border border-[#e8eae4] px-3 text-xs font-medium text-[#687267]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                            >
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <h2 className="text-sm font-semibold tracking-tight text-[#29382e]">
                            About your profile
                        </h2>
                        <p className="mt-3 text-xs leading-5 text-[#747c72]">
                            Profile information is retrieved from your verified
                            alumni record. Contact the alumni office if any
                            other details need correction.
                        </p>
                    </>
                )}
            </section>
        </div>
    );
}

type EmploymentForm = {
    employment_status_id: string;
    employer_name: string;
    job_title: string;
    industry: string;
    employment_type: string;
    work_location: string;
    started_on: string;
    is_related_to_degree: boolean;
};

const emptyEmploymentForm: EmploymentForm = {
    employment_status_id: '',
    employer_name: '',
    job_title: '',
    industry: '',
    employment_type: '',
    work_location: '',
    started_on: '',
    is_related_to_degree: true,
};

export function EmploymentTracer() {
    const profileResource =
        useApiResource<ApiEnvelope<AlumniProfile>>('/api/me/alumni');
    const statusesResource = useApiResource<ApiEnvelope<EmploymentStatus[]>>(
        '/api/employment-statuses',
    );
    const profileId = profileResource.data?.data.id;
    const historyResource = useApiResource<ApiEnvelope<EmploymentRecord[]>>(
        profileId ? `/api/alumni/${profileId}/employment` : null,
    );
    const [form, setForm] = useState(emptyEmploymentForm);
    const [saving, setSaving] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!profileId) {
            toast.error('An alumni profile is required to report employment.');
            return;
        }

        setSaving(true);
        try {
            await apiRequest<ApiEnvelope<EmploymentRecord>>(
                `/api/alumni/${profileId}/employment`,
                {
                    method: 'POST',
                    body: {
                        ...form,
                        employment_status_id: Number(form.employment_status_id),
                        employer_name: form.employer_name || null,
                        job_title: form.job_title || null,
                        industry: form.industry || null,
                        employment_type: form.employment_type || null,
                        work_location: form.work_location || null,
                        started_on: form.started_on || null,
                        is_related_to_degree: form.is_related_to_degree,
                    },
                },
            );
            setForm(emptyEmploymentForm);
            historyResource.reload();
            toast.success('Employment update saved.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Employment update could not be saved.',
            );
        } finally {
            setSaving(false);
        }
    }

    if (profileResource.loading || statusesResource.loading) {
        return <LoadingState />;
    }

    if (profileResource.error) {
        return <ErrorState message={profileResource.error} />;
    }

    if (statusesResource.error) {
        return <ErrorState message={statusesResource.error} />;
    }

    if (!profileResource.data?.data.id) {
        return (
            <EmptyState>
                No alumni profile is linked to this account.
            </EmptyState>
        );
    }

    const records = historyResource.data?.data ?? [];

    return (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                <h2 className="text-sm font-semibold tracking-tight text-[#29382e]">
                    Current employment status
                </h2>
                <form
                    onSubmit={submit}
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                >
                    <label className="text-xs font-medium text-[#4d5a4f]">
                        Employment status
                        <select
                            required
                            value={form.employment_status_id}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    employment_status_id: event.target.value,
                                })
                            }
                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs outline-none focus:border-[#819981]"
                        >
                            <option value="">Select a status</option>
                            {statusesResource.data?.data.map((status) => (
                                <option key={status.id} value={status.id}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    {(
                        [
                            ['employment_type', 'Employment type'],
                            ['employer_name', 'Employer name'],
                            ['job_title', 'Job position'],
                            ['industry', 'Industry'],
                            ['work_location', 'Work location'],
                            ['started_on', 'Start date'],
                        ] as const
                    ).map(([name, label]) => (
                        <label
                            key={name}
                            className="text-xs font-medium text-[#4d5a4f]"
                        >
                            {label}
                            <input
                                type={name === 'started_on' ? 'date' : 'text'}
                                value={form[name]}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        [name]: event.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs outline-none focus:border-[#819981]"
                            />
                        </label>
                    ))}
                    <label className="flex items-center gap-2.5 text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                        <input
                            type="checkbox"
                            checked={form.is_related_to_degree}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    is_related_to_degree: event.target.checked,
                                })
                            }
                            className="size-4 rounded border-[#e3e7df] text-[#2b5139] focus:ring-[#819981]"
                        />
                        <span>This employment is related to my college degree / field of study</span>
                    </label>
                    <div className="flex items-end sm:justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#2b5139] px-4 text-xs font-semibold text-white hover:bg-[#234530] disabled:opacity-60 sm:w-auto"
                        >
                            {saving ? 'Saving…' : 'Save update'}
                        </button>
                    </div>
                </form>
                <p className="mt-4 rounded-xl bg-[#f7f8f5] px-3 py-2.5 text-[10px] leading-4 text-[#7b8379]">
                    Each update is added to your employment history.
                </p>
            </section>
            <section className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                <h2 className="text-sm font-semibold tracking-tight text-[#29382e]">
                    Employment history
                </h2>
                {historyResource.loading ? (
                    <p className="mt-4 text-xs text-[#7a8278]">
                        Loading employment history…
                    </p>
                ) : historyResource.error ? (
                    <p role="alert" className="mt-4 text-xs text-[#8b4e43]">
                        {historyResource.error}
                    </p>
                ) : records.length ? (
                    <div className="mt-5 space-y-4">
                        {records.map((record) => (
                            <article
                                key={record.id}
                                className="border-l-2 border-[#dfe7dc] pl-4"
                            >
                                <p className="flex items-center gap-2 text-[10px] font-medium text-[#8a9088]">
                                    <span>
                                        {record.started_on ??
                                            'Start date not recorded'}
                                        {record.ended_on
                                            ? ` – ${record.ended_on}`
                                            : ' – Present'}
                                    </span>
                                    {record.is_related_to_degree !== undefined && (
                                        <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold ${record.is_related_to_degree ? 'bg-[#edf2eb] text-[#33583b]' : 'bg-[#f5f5f3] text-[#788077]'}`}>
                                            {record.is_related_to_degree ? 'Degree-Related' : 'Non-Degree Related'}
                                        </span>
                                    )}
                                </p>
                                <h3 className="mt-1 text-xs font-semibold text-[#3d4a3f]">
                                    {record.job_title ?? record.status.label}
                                </h3>
                                <p className="mt-1 text-[11px] text-[#7d857b]">
                                    {[record.employer_name, record.industry]
                                        .filter(Boolean)
                                        .join(' · ') || record.status.label}
                                </p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4">
                        <EmptyState>
                            No employment updates have been submitted.
                        </EmptyState>
                    </div>
                )}
            </section>
        </div>
    );
}

type OutcomeRow = {
    graduation_year: number;
    status: string;
    alumni_count: number;
    related_count?: number;
};

    type InstitutionalReportDefinition = {
        key: string;
        number: number;
        title: string;
        category: string;
        description: string;
    };

    type InstitutionalReportCard = {
        label: string;
        value: string | number;
        hint?: string;
    };

    type InstitutionalReportChartItem = {
        label: string;
        value: number;
        percentage?: number;
    };

    type InstitutionalReportColumn = {
        key: string;
        label: string;
        align?: 'left' | 'right' | 'center';
    };

    type InstitutionalReportPayload = {
        report_type: string;
        number: number;
        title: string;
        category: string;
        description: string;
        generated_at: string;
        filters: {
            department_id: number | null;
            program_id: number | null;
            graduation_year: number | null;
            employment_status: string | null;
            date_from: string | null;
            date_to: string | null;
        };
        filter_options: {
            departments: Array<{ id: number; code: string; name: string }>;
            programs: Array<{ id: number; department_id: number; code: string; name: string }>;
            graduation_years: number[];
            employment_statuses: Array<{ id: number; code: string; label: string }>;
        };
        available_reports: InstitutionalReportDefinition[];
        cards: InstitutionalReportCard[];
        chart: {
            title: string;
            type: 'bar' | 'horizontal-bar' | 'distribution';
            unit?: string;
            series: InstitutionalReportChartItem[];
        };
        columns: InstitutionalReportColumn[];
        rows: Array<Record<string, string | number | null>>;
    };

    let currentReportExportParams = 'report_type=graduate_tracer_summary';

    export async function downloadInstitutionalReport(
        format: 'excel' | 'pdf',
        queryString: string = currentReportExportParams,
    ) {
        try {
            const endpoint =
                format === 'pdf'
                    ? `/api/reports/export/pdf?${queryString}`
                    : `/api/reports/export/excel?${queryString}`;

            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept:
                        format === 'pdf'
                            ? 'application/pdf'
                            : 'application/vnd.ms-excel',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`Export failed (${response.status})`);
            }

            const blob = await response.blob();
            const disposition = response.headers.get('Content-Disposition') ?? '';
            const match = disposition.match(/filename="?([^"]+)"?/i);
            const fallbackName =
                format === 'pdf'
                    ? 'institutional-report.pdf'
                    : 'institutional-report.xls';
            const filename = match?.[1] ?? fallbackName;

            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);

            toast.success(
                format === 'pdf'
                    ? 'PDF report downloaded.'
                    : 'Excel report downloaded.',
            );
        } catch (error) {
            toast.error(
            error instanceof Error
                    ? error.message
                : 'Report could not be exported.',
            );
        }
    }

    export async function exportEmploymentOutcomes() {
        await downloadInstitutionalReport('excel', currentReportExportParams);
    }

    export function EmploymentReports() {
    const [reportType, setReportType] = useState('graduate_tracer_summary');
        const [departmentId, setDepartmentId] = useState('');
        const [programId, setProgramId] = useState('');
        const [graduationYear, setGraduationYear] = useState('');
        const [employmentStatus, setEmploymentStatus] = useState('');
        const [dateFrom, setDateFrom] = useState('');
        const [dateTo, setDateTo] = useState('');
        const [tableSearch, setTableSearch] = useState('');
        const [chartMode, setChartMode] = useState<'bars' | 'distribution'>('bars');
        const [exportingFormat, setExportingFormat] = useState<
            'excel' | 'pdf' | null
        >(null);

        const params = new URLSearchParams();
        params.set('report_type', reportType);
        if (departmentId) params.set('department_id', departmentId);
        if (programId) params.set('program_id', programId);
        if (graduationYear) params.set('graduation_year', graduationYear);
        if (employmentStatus) params.set('employment_status', employmentStatus);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);

        const queryString = params.toString();
        currentReportExportParams = queryString;

        const { data, loading, error } = useApiResource<
            ApiEnvelope<InstitutionalReportPayload>
        >(`/api/reports?${queryString}`);

        const report = data?.data;
        const availableReports = report?.available_reports ?? [];
        const departments = report?.filter_options.departments ?? [];
        const allPrograms = report?.filter_options.programs ?? [];
        const programs = departmentId
            ? allPrograms.filter((p) => String(p.department_id) === departmentId)
            : allPrograms;
        const graduationYears = report?.filter_options.graduation_years ?? [];
        const statuses = report?.filter_options.employment_statuses ?? [];

        const hasActiveFilters = Boolean(
            departmentId ||
            programId ||
            graduationYear ||
            employmentStatus ||
            dateFrom ||
            dateTo,
        );

            function resetFilters() {
                setDepartmentId('');
                setProgramId('');
                setGraduationYear('');
                setEmploymentStatus('');
                setDateFrom('');
                setDateTo('');
                setTableSearch('');
            }

            async function handleExport(format: 'excel' | 'pdf') {
                setExportingFormat(format);
                try {
                    await downloadInstitutionalReport(format, queryString);
                } finally {
                    setExportingFormat(null);
                }
            }

            if (loading && !report) {
                return <LoadingState />;
            }

                if (error && !report) {
                    return <ErrorState message={error} />;
                }

                if (!report) {
                    return <EmptyState>No institutional report data available.</EmptyState>;
                }

                const categories = Array.from(
                    new Set(availableReports.map((item) => item.category)),
                );

                const chartSeries = report.chart?.series ?? [];
                const maxChartVal = Math.max(
                    1,
                    ...chartSeries.map((item) => Number(item.value) || 0),
                );
                const totalChartVal = chartSeries.reduce(
                    (sum, item) => sum + (Number(item.value) || 0),
                    0,
                );

                const filteredRows = tableSearch.trim()
                    ? report.rows.filter((row) =>
                        Object.values(row).some((cell) =>
                            String(cell ?? '')
                                .toLowerCase()
                                .includes(tableSearch.trim().toLowerCase()),
                        ),
                    )
                    : report.rows;

                return (
                        <div className="space-y-5">
                            {/* Report Catalog Selector & Export Actions */}
                            <section className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 border-b border-[#eff0ec] pb-4 lg:flex-row lg:items-center">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#edf2eb] px-2.5 py-0.5 text-[10px] font-bold text-[#2b5139] uppercase tracking-wider">
                                Report #{report.number} of 18
                            </span>
                            <span className="rounded-full bg-[#f4f5f2] px-2.5 py-0.5 text-[10px] font-semibold text-[#667166]">
                                {report.category}
                            </span>
                        </div>
                        <h2 className="mt-2 text-base font-semibold tracking-tight text-[#29382e]">
                            {report.title}
                        </h2>
                        <p className="mt-1 text-xs text-[#747c72]">
                            {report.description}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={exportingFormat !== null}
                            onClick={() => void handleExport('excel')}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#dce5d8] bg-[#f4f8f3] px-3.5 text-xs font-semibold text-[#2b5139] transition hover:bg-[#e8f0e6] disabled:opacity-60"
                        >
                            {exportingFormat === 'excel'
                                ? 'Exporting Excel…'
                                : 'Export Excel (.xls)'}
                        </button>
                        <button
                            type="button"
                            disabled={exportingFormat !== null}
                            onClick={() => void handleExport('pdf')}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2b5139] px-3.5 text-xs font-semibold text-white transition hover:bg-[#234530] disabled:opacity-60"
                        >
                            {exportingFormat === 'pdf'
                                ? 'Generating PDF…'
                                : 'Export PDF (.pdf)'}
                        </button>
                    </div>
                </div>

                {/* 18 Reports Picker + 5 Filter Controls */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <label className="text-[11px] font-medium text-[#4d5a4f] lg:col-span-2">
                        Institutional Report (18 Tracer Reports)
                        <select
                            aria-label="Institutional Report"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-2.5 text-xs font-semibold text-[#2c3c30] outline-none focus:border-[#819981]"
                        >
                            {categories.map((cat) => (
                                <optgroup key={cat} label={cat}>
                                    {availableReports
                                        .filter((item) => item.category === cat)
                                        .map((item) => (
                                            <option
                                                key={item.key}
                                                value={item.key}
                                            >
                                                {item.number}. {item.title}
                                            </option>
                                        ))}
                                </optgroup>
                            ))}
                        </select>
                    </label>

                    <label className="text-[11px] font-medium text-[#4d5a4f]">
                        Department
                        <select
                            aria-label="Filter by Department"
                            value={departmentId}
                            onChange={(e) => {
                                setDepartmentId(e.target.value);
                                setProgramId('');
                            }}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                        >
                            <option value="">All departments</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.code} — {dept.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-[11px] font-medium text-[#4d5a4f]">
                        Academic Program
                        <select
                            aria-label="Filter by Academic Program"
                            value={programId}
                            onChange={(e) => setProgramId(e.target.value)}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                        >
                            <option value="">All programs</option>
                            {programs.map((prog) => (
                                <option key={prog.id} value={prog.id}>
                                    {prog.code} — {prog.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-[11px] font-medium text-[#4d5a4f]">
                        Graduation Year
                        <select
                            aria-label="Filter by Graduation Year"
                            value={graduationYear}
                            onChange={(e) => setGraduationYear(e.target.value)}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                        >
                            <option value="">All cohorts</option>
                            {graduationYears.map((yr) => (
                                <option key={yr} value={yr}>
                                    Class of {yr}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-[11px] font-medium text-[#4d5a4f]">
                        Employment Status
                        <select
                            aria-label="Filter by Employment Status"
                            value={employmentStatus}
                            onChange={(e) =>
                                setEmploymentStatus(e.target.value)
                            }
                            className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                        >
                            <option value="">All statuses</option>
                            {statuses.map((st) => (
                                <option key={st.id} value={st.code}>
                                    {st.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Date Range & Quick Report Pills */}
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-[#f3f4f0] pt-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-[11px] font-medium text-[#667166]">
                            <span>Date from</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-8 rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                            />
                        </label>
                        <label className="flex items-center gap-2 text-[11px] font-medium text-[#667166]">
                            <span>Date to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-8 rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                            />
                        </label>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="h-8 rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-3 text-[11px] font-semibold text-[#5b695d] hover:bg-[#eff2ed]"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                    {loading && (
                        <span className="text-[11px] font-medium text-[#69866c]">
                            Refreshing report…
                        </span>
                    )}
                </div>
            </section>

            {/* Statistical KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {report.cards.map((card) => (
                    <article
                        key={card.label}
                        className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5"
                    >
                        <p className="text-[11px] font-semibold tracking-wide text-[#7c847a] uppercase">
                            {card.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-[#28382c]">
                            {card.value}
                        </p>
                        {card.hint && (
                            <p className="mt-1 text-[11px] text-[#838b81]">
                                {card.hint}
                            </p>
                        )}
                    </article>
                ))}
            </div>

            {/* Interactive Chart & Quick Catalog Navigator */}
            <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-semibold tracking-tight text-[#29382e]">
                                {report.chart.title}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-[#7c847a]">
                                Interactive visual breakdown ({report.chart.unit ?? 'count'})
                            </p>
                        </div>
                        <div className="inline-flex rounded-lg border border-[#e6e9e2] bg-[#f8f9f6] p-0.5 text-[11px]">
                            <button
                                type="button"
                                onClick={() => setChartMode('bars')}
                                className={`rounded-md px-2.5 py-1 font-medium transition ${chartMode === 'bars' ? 'bg-white text-[#2b5139] shadow-xs' : 'text-[#737b71]'}`}
                            >
                                Comparative Bars
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode('distribution')}
                                className={`rounded-md px-2.5 py-1 font-medium transition ${chartMode === 'distribution' ? 'bg-white text-[#2b5139] shadow-xs' : 'text-[#737b71]'}`}
                            >
                                Share Breakdown
                            </button>
                        </div>
                    </div>

                    {chartSeries.length ? (
                        chartMode === 'bars' ? (
                            <div className="space-y-3.5">
                                {chartSeries.map((item) => {
                                    const widthPct =
                                        report.chart.unit === '%'
                                            ? Math.min(
                                                  100,
                                                  Math.max(
                                                      0,
                                                      Number(item.value) || 0,
                                                  ),
                                              )
                                            : Math.min(
                                                  100,
                                                  Math.round(
                                                      ((Number(item.value) ||
                                                          0) /
                                                          maxChartVal) *
                                                          100,
                                                  ),
                                              );

                                    return (
                                        <div
                                            key={item.label}
                                            className="grid grid-cols-[130px_1fr_68px] items-center gap-3 text-xs sm:grid-cols-[160px_1fr_80px]"
                                        >
                                            <span
                                                className="truncate font-medium text-[#536055]"
                                                title={item.label}
                                            >
                                                {item.label}
                                            </span>
                                            <div className="h-3 overflow-hidden rounded-full bg-[#f0f2ed]">
                                                <div
                                                    className="h-full rounded-full bg-[#4b7254] transition-all duration-300"
                                                    style={{
                                                        width: `${widthPct}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-right font-semibold text-[#314736]">
                                                {item.value}
                                                {report.chart.unit === '%'
                                                    ? '%'
                                                    : report.chart.unit ===
                                                        'mos'
                                                      ? ' mos'
                                                      : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {chartSeries.map((item) => {
                                    const share =
                                        item.percentage !== undefined
                                            ? item.percentage
                                            : totalChartVal > 0
                                              ? Math.round(
                                                    ((Number(item.value) || 0) /
                                                        totalChartVal) *
                                                        100,
                                                )
                                              : 0;
                                    return (
                                        <div key={item.label}>
                                            <div className="mb-1 flex justify-between text-[11px]">
                                                <span className="font-medium text-[#536055]">
                                                    {item.label}
                                                </span>
                                                <span className="font-semibold text-[#314736]">
                                                    {item.value} ({share}%)
                                                </span>
                                            </div>
                                            <div className="h-2.5 overflow-hidden rounded-full bg-[#f0f2ed]">
                                                <div
                                                    className="h-full rounded-full bg-[#69866c] transition-all duration-300"
                                                    style={{
                                                        width: `${Math.min(100, Math.max(0, share))}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <EmptyState>
                            No chart data points match the current report filters.
                        </EmptyState>
                    )}
                </section>

                {/* All 18 Institutional Reports Quick Directory */}
                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                    <h3 className="mb-3 text-sm font-semibold tracking-tight text-[#29382e]">
                        18 Institutional Tracer Reports
                    </h3>
                    <div className="max-h-[290px] space-y-1 overflow-y-auto pr-1">
                        {availableReports.map((item) => {
                            const active = item.key === reportType;
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setReportType(item.key)}
                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                                        active
                                            ? 'bg-[#edf2eb] font-semibold text-[#2b5139]'
                                            : 'text-[#626c61] hover:bg-[#f6f7f4]'
                                    }`}
                                >
                                    <span className="truncate">
                                        {item.number}. {item.title}
                                    </span>
                                    <span className="ml-2 shrink-0 text-[10px] text-[#8a9289]">
                                        {item.category.split(' ')[0]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Report Data Table */}
            <section className="overflow-hidden rounded-2xl border border-[#e9ebe5] bg-white">
                <div className="flex flex-col justify-between gap-3 border-b border-[#eff0ec] p-4 sm:flex-row sm:items-center sm:px-6">
                    <div>
                        <h3 className="text-sm font-semibold text-[#29382e]">
                            {report.title} — Tabular Data
                        </h3>
                        <p className="mt-0.5 text-[11px] text-[#7c847a]">
                            Showing {filteredRows.length} of {report.rows.length}{' '}
                            records
                        </p>
                    </div>
                    <input
                        type="search"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder="Filter table rows…"
                        className="h-8 w-full rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-3 text-xs outline-none focus:border-[#819981] sm:w-56"
                    />
                </div>

                {filteredRows.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-[#eff0ec] bg-[#fafbf9] text-[10px] font-bold tracking-wider text-[#7d867c] uppercase">
                                <tr>
                                    {report.columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={`px-4 py-3 ${
                                                col.align === 'right'
                                                    ? 'text-right'
                                                    : col.align === 'center'
                                                      ? 'text-center'
                                                      : 'text-left'
                                            }`}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eff0ec]">
                                {filteredRows.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="transition hover:bg-[#fafbf9]"
                                    >
                                        {report.columns.map((col) => {
                                            const cellVal = row[col.key] ?? '—';
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`px-4 py-3 text-[#414e43] ${
                                                        col.align === 'right'
                                                            ? 'text-right font-medium'
                                                            : col.align ===
                                                                'center'
                                                              ? 'text-center'
                                                              : 'text-left'
                                                    }`}
                                                >
                                                    {cellVal}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6">
                        <EmptyState>
                            No records match the current report and filter criteria.
                        </EmptyState>
                    </div>
                )}
            </section>
        </div>
    );
}

type NotificationPage = {
    data: UserNotification[];
    current_page: number;
    last_page: number;
    total: number;
};

export function UnreadNotificationIndicator() {
    const { data } =
        useApiResource<ApiEnvelope<NotificationPage>>('/api/notifications');
    const unreadCount =
        data?.data.data.filter((notification) => !notification.read_at)
            .length ?? 0;

    return unreadCount ? (
        <span className="absolute -top-1 -right-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#c57657] px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
        </span>
    ) : null;
}

export function Notifications({ onUpdated }: { onUpdated?: () => void } = {}) {
    const { data, loading, error, reload } =
        useApiResource<ApiEnvelope<NotificationPage>>('/api/notifications');
    const notifications = data?.data.data ?? [];
    const [updating, setUpdating] = useState<string | null>(null);

    async function markAsRead(id: string) {
        setUpdating(id);
        try {
            await apiRequest<ApiEnvelope<{ id: string; read_at: string }>>(
                `/api/notifications/${encodeURIComponent(id)}/read`,
                { method: 'PATCH' },
            );
            reload();
            onUpdated?.();
            toast.success('Notification marked as read.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Notification could not be updated.',
            );
        } finally {
            setUpdating(null);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    return notifications.length ? (
        <div className="grid gap-3">
            {notifications.map((notification) => {
                const title =
                    typeof notification.data.title === 'string'
                        ? notification.data.title
                        : (notification.type.split('\\').pop() ??
                          'Notification');
                const message =
                    typeof notification.data.message === 'string'
                        ? notification.data.message
                        : 'You have a new update.';

                return (
                    <article
                        key={notification.id}
                        className="flex flex-col gap-4 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:flex-row sm:items-center"
                    >
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold text-[#39463b]">
                                {title}
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-[#7a8278]">
                                {message}
                            </p>
                            <p className="mt-2 text-[10px] text-[#858b82]">
                                {new Date(
                                    notification.created_at,
                                ).toLocaleString()}
                            </p>
                        </div>
                        {notification.read_at ? (
                            <span className="text-[10px] font-medium text-[#687267]">
                                Read
                            </span>
                        ) : (
                            <button
                                type="button"
                                disabled={updating === notification.id}
                                onClick={() => void markAsRead(notification.id)}
                                className="rounded-lg border border-[#e8eae4] px-3 py-2 text-[11px] font-semibold text-[#526754] disabled:opacity-60"
                            >
                                {updating === notification.id
                                    ? 'Updating…'
                                    : 'Mark as read'}
                            </button>
                        )}
                    </article>
                );
            })}
        </div>
    ) : (
        <EmptyState>You do not have any notifications yet.</EmptyState>
    );
}

export function ActivityLog() {
    const { data, loading, error } =
        useApiResource<ApiEnvelope<RawPagination<ActivityLogEntry>>>(
            '/api/activity-logs',
        );

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const entries = data?.data.data ?? [];
    return entries.length ? (
        <div className="overflow-hidden rounded-2xl border border-[#e9ebe5] bg-white">
            {entries.map((entry) => (
                <article
                    key={entry.id}
                    className="flex flex-col gap-2 border-b border-[#eff0ec] p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                    <div>
                        <h2 className="text-xs font-semibold text-[#39463b]">
                            {entry.action.replaceAll('.', ' ')}
                        </h2>
                        <p className="mt-1 text-[10px] text-[#858b82]">
                            {entry.actor?.name ?? 'System'}
                            {entry.subject_type
                                ? ` · ${entry.subject_type.split('\\').pop()}`
                                : ''}
                            {entry.subject_id ? ` #${entry.subject_id}` : ''}
                        </p>
                    </div>
                    <time className="text-[10px] text-[#858b82]">
                        {new Date(entry.created_at).toLocaleString()}
                    </time>
                </article>
            ))}
        </div>
    ) : (
        <EmptyState>No activity has been recorded yet.</EmptyState>
    );
}

type UserRoleAssignment = {
    id: number;
    name: string;
    email: string;
    roles: string[];
    is_suspended: boolean;
};

export function AssignedRoles({
    roleCodes,
    currentUserId,
}: {
    roleCodes: string[];
    currentUserId: number;
}) {
    const roleLabels: Record<string, string> = {
        'system-administrator': 'System administrator',
        'alumni-coordinator': 'Alumni coordinator',
        'department-coordinator': 'Department coordinator',
        alumni: 'Alumni',
        employer: 'Employer',
    };
    const isSystemAdmin = roleCodes.includes('system-administrator');
    const { data, loading, error, reload } = useApiResource<
        ApiEnvelope<UserRoleAssignment[]>
    >(isSystemAdmin ? '/api/admin/users' : null);
    const [selectedRoles, setSelectedRoles] = useState<
        Record<number, string[]>
    >({});
    const [saving, setSaving] = useState<Record<number, boolean>>({});
    const [managing, setManaging] = useState<Record<number, boolean>>({});
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
        roles: [] as string[],
    });
    const roleOptions = [
        'alumni-coordinator',
        'department-coordinator',
        'alumni',
        'employer',
    ];

    useEffect(() => {
        if (!data?.data) {
            return;
        }

        const nextSelectedRoles = Object.fromEntries(
            data.data.map((user) => [user.id, [...user.roles]]),
        );
        setSelectedRoles(nextSelectedRoles);
    }, [data]);

    async function updateUserRoles(userId: number, nextRoles: string[]) {
        setSaving((current) => ({ ...current, [userId]: true }));

        try {
            await apiRequest<ApiEnvelope<UserRoleAssignment>>(
                `/api/admin/users/${userId}/roles`,
                {
                    method: 'PATCH',
                    body: { roles: nextRoles },
                },
            );
            setSelectedRoles((current) => ({
                ...current,
                [userId]: nextRoles,
            }));
            reload();
            toast.success('User roles updated.');
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'User roles could not be updated.',
            );
            if (data?.data) {
                const fallback =
                    data.data.find((user) => user.id === userId)?.roles ?? [];
                setSelectedRoles((current) => ({
                    ...current,
                    [userId]: fallback,
                }));
            }
        } finally {
            setSaving((current) => ({ ...current, [userId]: false }));
        }
    }

    async function inviteUser(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setInviting(true);

        try {
            await apiRequest<ApiEnvelope<UserRoleAssignment>>(
                '/api/admin/users',
                {
                    method: 'POST',
                    body: inviteForm,
                },
            );
            setInviteForm({ name: '', email: '', roles: [] });
            setInviteOpen(false);
            reload();
            toast.success('Invitation sent.');
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'The invitation could not be sent.',
            );
        } finally {
            setInviting(false);
        }
    }

    async function updateUserSuspension(
        user: UserRoleAssignment,
    ): Promise<boolean> {
        setManaging((current) => ({ ...current, [user.id]: true }));

        try {
            await apiRequest<
                ApiEnvelope<{ id: number; is_suspended: boolean }>
            >(`/api/admin/users/${user.id}/suspension`, {
                method: 'PATCH',
                body: { suspended: !user.is_suspended },
            });
            reload();
            toast.success(
                user.is_suspended ? 'User reactivated.' : 'User suspended.',
            );
            return true;
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'The user status could not be updated.',
            );
            return false;
        } finally {
            setManaging((current) => ({ ...current, [user.id]: false }));
        }
    }

    async function deleteUser(user: UserRoleAssignment): Promise<boolean> {
        setManaging((current) => ({ ...current, [user.id]: true }));

        try {
            await apiRequest<ApiEnvelope<never>>(
                `/api/admin/users/${user.id}`,
                { method: 'DELETE' },
            );
            reload();
            toast.success('User deleted.');
            return true;
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'The user could not be deleted.',
            );
            return false;
        } finally {
            setManaging((current) => ({ ...current, [user.id]: false }));
        }
    }

    const users = data?.data ?? [];

    return (
        <section className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold tracking-tight text-[#29382e]">
                Roles assigned to your account
            </h2>
            {roleCodes.length ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                    {roleCodes.map((code) => (
                        <li
                            key={code}
                            className="rounded-full bg-[#edf2eb] px-3 py-1.5 text-xs font-medium text-[#45664a]"
                        >
                            {roleLabels[code] ?? code}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-xs text-[#7a8278]">
                    No roles are currently assigned.
                </p>
            )}

            {isSystemAdmin && (
                <div className="mt-6 border-t border-[#eff0ec] pt-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold tracking-tight text-[#29382e]">
                            User access management
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[#edf2eb] px-2.5 py-1 text-[10px] font-medium text-[#45664a]">
                                {users.length} users
                            </span>
                            <button
                                type="button"
                                onClick={() => setInviteOpen((open) => !open)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#2f4f3e] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#263f32]"
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                                Invite user
                            </button>
                        </div>
                    </div>

                    {inviteOpen && (
                        <form
                            onSubmit={inviteUser}
                            className="mb-5 space-y-3 rounded-2xl border border-[#dfe5dd] bg-[#f9faf7] p-4"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="space-y-1.5 text-xs font-medium text-[#4d5a4f]">
                                    Name
                                    <input
                                        required
                                        maxLength={255}
                                        value={inviteForm.name}
                                        onChange={(event) =>
                                            setInviteForm((form) => ({
                                                ...form,
                                                name: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-[#dfe5dd] bg-white px-3 py-2 text-sm font-normal text-[#29382e] outline-none focus:border-[#6d8b72]"
                                        autoComplete="name"
                                    />
                                </label>
                                <label className="space-y-1.5 text-xs font-medium text-[#4d5a4f]">
                                    Email
                                    <input
                                        required
                                        type="email"
                                        maxLength={255}
                                        value={inviteForm.email}
                                        onChange={(event) =>
                                            setInviteForm((form) => ({
                                                ...form,
                                                email: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-[#dfe5dd] bg-white px-3 py-2 text-sm font-normal text-[#29382e] outline-none focus:border-[#6d8b72]"
                                        autoComplete="email"
                                    />
                                </label>
                            </div>
                            <fieldset>
                                <legend className="mb-2 text-xs font-medium text-[#4d5a4f]">
                                    Assign roles
                                </legend>
                                <div className="flex flex-wrap gap-2">
                                    {roleOptions.map((code) => (
                                        <label
                                            key={`invite-${code}`}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#dfe5dd] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#4d5a4f]"
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-3.5 w-3.5 accent-[#2f4f3e]"
                                                checked={inviteForm.roles.includes(
                                                    code,
                                                )}
                                                onChange={() =>
                                                    setInviteForm((form) => ({
                                                        ...form,
                                                        roles: form.roles.includes(
                                                            code,
                                                        )
                                                            ? form.roles.filter(
                                                                  (role) =>
                                                                      role !==
                                                                      code,
                                                              )
                                                            : [
                                                                  ...form.roles,
                                                                  code,
                                                              ],
                                                    }))
                                                }
                                            />
                                            {roleLabels[code] ?? code}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setInviteOpen(false)}
                                    className="rounded-full border border-[#dfe5dd] bg-white px-3 py-2 text-[11px] font-semibold text-[#4d5a4f]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        inviting || !inviteForm.roles.length
                                    }
                                    className="rounded-full bg-[#2f4f3e] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#263f32] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {inviting ? 'Sending…' : 'Send invitation'}
                                </button>
                            </div>
                        </form>
                    )}

                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <ErrorState message={error} />
                    ) : users.length ? (
                        <div className="space-y-4">
                            {users.map((user) => {
                                const currentRoles =
                                    selectedRoles[user.id] ?? user.roles;
                                const isProtected = user.roles.includes(
                                    'system-administrator',
                                );
                                const canManage =
                                    !isProtected && user.id !== currentUserId;

                                return (
                                    <div
                                        key={user.id}
                                        className="rounded-2xl border border-[#e9ebe5] bg-[#f9faf7] p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-[#39463b]">
                                                    {user.name}
                                                </p>
                                                <p className="mt-1 text-[11px] text-[#7a8278]">
                                                    {user.email}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-medium tracking-[0.14em] text-[#6d7d6a] uppercase">
                                                {currentRoles.length
                                                    ? currentRoles.length
                                                    : 0}{' '}
                                                roles
                                            </span>
                                        </div>

                                        {user.is_suspended && (
                                            <p className="mt-3 inline-flex rounded-full bg-[#f7e9e5] px-2.5 py-1 text-[10px] font-semibold text-[#8b4e43]">
                                                Suspended
                                            </p>
                                        )}

                                        {isProtected ? (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {currentRoles.map((code) => (
                                                    <label
                                                        key={`${user.id}-${code}`}
                                                        className="inline-flex items-center gap-2 rounded-full border border-[#dfe5dd] bg-[#f1f3ef] px-2.5 py-1.5 text-[11px] font-medium text-[#4d5a4f]"
                                                    >
                                                        {roleLabels[code] ??
                                                            code}
                                                    </label>
                                                ))}
                                                <span className="self-center text-[10px] text-[#7a8278]">
                                                    Protected system
                                                    administrator
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {roleOptions.map((code) => {
                                                    const checked =
                                                        currentRoles.includes(
                                                            code,
                                                        );
                                                    return (
                                                        <label
                                                            key={`${user.id}-${code}`}
                                                            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#dfe5dd] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#4d5a4f]"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="h-3.5 w-3.5 accent-[#2f4f3e]"
                                                                checked={
                                                                    checked
                                                                }
                                                                disabled={
                                                                    saving[
                                                                        user.id
                                                                    ] ||
                                                                    !canManage
                                                                }
                                                                onChange={() => {
                                                                    const nextRoles =
                                                                        checked
                                                                            ? currentRoles.filter(
                                                                                  (
                                                                                      role,
                                                                                  ) =>
                                                                                      role !==
                                                                                      code,
                                                                              )
                                                                            : [
                                                                                  ...new Set(
                                                                                      [
                                                                                          ...currentRoles,
                                                                                          code,
                                                                                      ],
                                                                                  ),
                                                                              ];
                                                                    void updateUserRoles(
                                                                        user.id,
                                                                        nextRoles,
                                                                    );
                                                                }}
                                                            />
                                                            {roleLabels[code] ??
                                                                code}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {!isProtected && (
                                            <div className="mt-4 flex justify-end gap-2">
                                                <ConfirmationDialog
                                                    title={
                                                        user.is_suspended
                                                            ? 'Reactivate user?'
                                                            : 'Suspend user?'
                                                    }
                                                    description={
                                                        user.is_suspended
                                                            ? `Reactivate ${user.name}'s account? They will be able to sign in and use the application again.`
                                                            : `Suspend ${user.name}'s account? They will be signed out and unable to sign in or use the application until reactivated.`
                                                    }
                                                    confirmLabel={
                                                        user.is_suspended
                                                            ? 'Reactivate user'
                                                            : 'Suspend user'
                                                    }
                                                    pendingLabel={
                                                        user.is_suspended
                                                            ? 'Reactivating…'
                                                            : 'Suspending…'
                                                    }
                                                    variant={
                                                        user.is_suspended
                                                            ? 'default'
                                                            : 'destructive'
                                                    }
                                                    onConfirm={() =>
                                                        updateUserSuspension(
                                                            user,
                                                        )
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            !canManage ||
                                                            managing[user.id]
                                                        }
                                                        className="rounded-full border border-[#dfe5dd] bg-white px-3 py-2 text-[10px] font-semibold text-[#4d5a4f] disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {user.is_suspended
                                                            ? 'Reactivate'
                                                            : 'Suspend'}
                                                    </button>
                                                </ConfirmationDialog>
                                                <ConfirmationDialog
                                                    title="Delete user?"
                                                    description={`Delete ${user.name}'s account? They will lose access, and their account will be archived.`}
                                                    onConfirm={() =>
                                                        deleteUser(user)
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            !canManage ||
                                                            managing[user.id]
                                                        }
                                                        className="rounded-full border border-[#ecd8d2] bg-white px-3 py-2 text-[10px] font-semibold text-[#8b4e43] disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </ConfirmationDialog>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState>
                            No users are available to manage.
                        </EmptyState>
                    )}
                </div>
            )}

            <p className="mt-4 text-xs leading-5 text-[#7a8278]">
                Role and permission changes are managed by an administrator.
            </p>
        </section>
    );
}

export function AcademicCatalog({
    createOpen,
    onCloseCreate,
}: {
    createOpen: boolean;
    onCloseCreate: () => void;
}) {
    const { data, loading, error, reload } =
        useApiResource<ApiEnvelope<AcademicProgram[]>>('/api/programs');
    const departments = useApiResource<ApiEnvelope<AcademicDepartment[]>>(
        createOpen ? '/api/departments' : null,
    );
    const [form, setForm] = useState({
        department_id: '',
        code: '',
        name: '',
        description: '',
    });
    const [creating, setCreating] = useState(false);

    async function createProgram(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);
        try {
            await apiRequest<ApiEnvelope<AcademicProgram>>(
                `/api/departments/${form.department_id}/programs`,
                {
                    method: 'POST',
                    body: {
                        code: form.code,
                        name: form.name,
                        description: form.description || null,
                    },
                },
            );
            setForm({
                department_id: '',
                code: '',
                name: '',
                description: '',
            });
            onCloseCreate();
            reload();
            toast.success('Academic program created.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Academic program could not be created.',
            );
        } finally {
            setCreating(false);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    return (
        <div className="space-y-4">
            {createOpen && (
                <form
                    onSubmit={createProgram}
                    className="grid gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:grid-cols-2 sm:p-5"
                >
                    <label className="text-xs font-medium text-[#4d5a4f]">
                        Department
                        <select
                            required
                            value={form.department_id}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    department_id: event.target.value,
                                })
                            }
                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                        >
                            <option value="">Select a department</option>
                            {departments.data?.data.map((department) => (
                                <option
                                    key={department.id}
                                    value={department.id}
                                >
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    {(
                        [
                            ['code', 'Program code'],
                            ['name', 'Program name'],
                        ] as const
                    ).map(([name, label]) => (
                        <label
                            key={name}
                            className="text-xs font-medium text-[#4d5a4f]"
                        >
                            {label}
                            <input
                                required
                                value={form[name]}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        [name]: event.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    ))}
                    <div className="flex items-center justify-end gap-2 sm:col-span-2">
                        <button
                            type="button"
                            onClick={onCloseCreate}
                            className="h-9 rounded-lg border border-[#e8eae4] px-3 text-xs font-medium text-[#687267]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                        >
                            {creating ? 'Saving…' : 'Add program'}
                        </button>
                    </div>
                    {departments.error ? (
                        <p role="alert" className="text-xs text-[#8b4e43]">
                            {departments.error}
                        </p>
                    ) : null}
                </form>
            )}
            {data?.data.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {data.data.map((program) => (
                        <article
                            key={program.id}
                            className="rounded-2xl border border-[#e9ebe5] bg-white p-5"
                        >
                            <p className="text-[10px] font-semibold tracking-wide text-[#829080] uppercase">
                                {program.code}
                            </p>
                            <h2 className="mt-2 text-sm font-semibold text-[#39463b]">
                                {program.name}
                            </h2>
                            <p className="mt-1 text-xs text-[#7a8278]">
                                {program.department?.name ??
                                    'Department not assigned'}
                            </p>
                            {program.program_degrees?.length ? (
                                <ul className="mt-4 space-y-1 border-t border-[#eff0ec] pt-3">
                                    {program.program_degrees.map((offering) => (
                                        <li
                                            key={offering.id}
                                            className="text-[11px] text-[#6f786e]"
                                        >
                                            {offering.degree.title}
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyState>
                    No academic programs have been configured.
                </EmptyState>
            )}
        </div>
    );
}

type RawPagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
};

function SurveyResponseForm({
    survey,
    onSubmitted,
}: {
    survey: Survey;
    onSubmitted: () => void;
}) {
    const [answers, setAnswers] = useState<Record<number, unknown>>({});
    const [saving, setSaving] = useState(false);

    function updateAnswer(id: number, value: unknown) {
        setAnswers((current) => ({ ...current, [id]: value }));
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        try {
            await apiRequest<ApiEnvelope<{ id: number }>>(
                `/api/surveys/${survey.id}/responses`,
                { method: 'POST', body: { answers } },
            );
            onSubmitted();
            toast.success('Survey response submitted.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey response could not be submitted.',
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <form
            onSubmit={submit}
            className="mt-4 space-y-4 rounded-xl bg-[#f8f9f6] p-4"
        >
            {survey.questions.map((question) => {
                const value = answers[question.id];
                const fieldClass =
                    'mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs outline-none focus:border-[#819981]';

                if (question.type === 'textarea') {
                    return (
                        <label
                            key={question.id}
                            className="block text-xs font-medium text-[#4d5a4f]"
                        >
                            {question.prompt}
                            {question.is_required ? ' *' : ''}
                            <textarea
                                required={question.is_required}
                                value={typeof value === 'string' ? value : ''}
                                onChange={(event) =>
                                    updateAnswer(
                                        question.id,
                                        event.target.value,
                                    )
                                }
                                className="mt-1.5 min-h-24 w-full rounded-lg border border-[#e3e7df] bg-white p-3 text-xs outline-none focus:border-[#819981]"
                            />
                        </label>
                    );
                }

                if (question.type === 'select' || question.type === 'rating') {
                    const options =
                        question.type === 'rating'
                            ? ['1', '2', '3', '4', '5']
                            : (question.options ?? []);
                    return (
                        <label
                            key={question.id}
                            className="block text-xs font-medium text-[#4d5a4f]"
                        >
                            {question.prompt}
                            {question.is_required ? ' *' : ''}
                            <select
                                required={question.is_required}
                                value={typeof value === 'string' ? value : ''}
                                onChange={(event) =>
                                    updateAnswer(
                                        question.id,
                                        question.type === 'rating'
                                            ? Number(event.target.value)
                                            : event.target.value,
                                    )
                                }
                                className={fieldClass}
                            >
                                <option value="">Select an answer</option>
                                {options.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>
                    );
                }

                if (question.type === 'multiselect') {
                    const selected = Array.isArray(value)
                        ? (value as string[])
                        : [];
                    return (
                        <fieldset
                            key={question.id}
                            className="space-y-2 text-xs text-[#4d5a4f]"
                        >
                            <legend className="mb-2 font-medium">
                                {question.prompt}
                                {question.is_required ? ' *' : ''}
                            </legend>
                            {(question.options ?? []).map((option) => (
                                <label
                                    key={option}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(option)}
                                        onChange={(event) =>
                                            updateAnswer(
                                                question.id,
                                                event.target.checked
                                                    ? [...selected, option]
                                                    : selected.filter(
                                                          (item) =>
                                                              item !== option,
                                                      ),
                                            )
                                        }
                                    />
                                    {option}
                                </label>
                            ))}
                        </fieldset>
                    );
                }

                if (question.type === 'boolean') {
                    return (
                        <label
                            key={question.id}
                            className="block text-xs font-medium text-[#4d5a4f]"
                        >
                            {question.prompt}
                            {question.is_required ? ' *' : ''}
                            <select
                                required={question.is_required}
                                value={
                                    typeof value === 'boolean'
                                        ? String(value)
                                        : ''
                                }
                                onChange={(event) =>
                                    updateAnswer(
                                        question.id,
                                        event.target.value === 'true',
                                    )
                                }
                                className={fieldClass}
                            >
                                <option value="">Select an answer</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </label>
                    );
                }

                return (
                    <label
                        key={question.id}
                        className="block text-xs font-medium text-[#4d5a4f]"
                    >
                        {question.prompt}
                        {question.is_required ? ' *' : ''}
                        <input
                            type={
                                question.type === 'number' ? 'number' : 'text'
                            }
                            required={question.is_required}
                            value={
                                typeof value === 'string' ||
                                typeof value === 'number'
                                    ? value
                                    : ''
                            }
                            onChange={(event) =>
                                updateAnswer(
                                    question.id,
                                    question.type === 'number'
                                        ? event.target.value === ''
                                            ? ''
                                            : Number(event.target.value)
                                        : event.target.value,
                                )
                            }
                            className={fieldClass}
                        />
                    </label>
                );
            })}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                >
                    {saving ? 'Submitting…' : 'Submit response'}
                </button>
            </div>
        </form>
    );
}

export function SurveyCenter({
    role,
    createOpen,
    onCloseCreate,
}: {
    role: WorkspaceRole;
    createOpen: boolean;
    onCloseCreate: () => void;
}) {
    const canManage = role === 'Administrator' || role === 'Alumni coordinator';
    const canRespond = role === 'Alumni';
    const { data, loading, error, reload } =
        useApiResource<ApiEnvelope<RawPagination<Survey>>>('/api/surveys');
    const [form, setForm] = useState({
        title: '',
        description: '',
        closes_at: '',
        prompt: '',
        question_type: 'text',
        options: '',
    });
    const [creating, setCreating] = useState(false);
    const [publishing, setPublishing] = useState<number | null>(null);

    async function createSurvey(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);
        const options = form.options
            .split(',')
            .map((option) => option.trim())
            .filter(Boolean);

        try {
            await apiRequest<ApiEnvelope<Survey>>('/api/surveys', {
                method: 'POST',
                body: {
                    title: form.title,
                    description: form.description || null,
                    closes_at: form.closes_at || null,
                    questions: [
                        {
                            prompt: form.prompt,
                            type: form.question_type,
                            options: ['select', 'multiselect'].includes(
                                form.question_type,
                            )
                                ? options
                                : null,
                            is_required: true,
                        },
                    ],
                },
            });
            setForm({
                title: '',
                description: '',
                closes_at: '',
                prompt: '',
                question_type: 'text',
                options: '',
            });
            onCloseCreate();
            reload();
            toast.success('Survey created as a draft.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey could not be created.',
            );
        } finally {
            setCreating(false);
        }
    }

    async function publishSurvey(id: number) {
        setPublishing(id);
        try {
            await apiRequest<ApiEnvelope<Survey>>(
                `/api/surveys/${id}/publish`,
                { method: 'POST' },
            );
            reload();
            toast.success('Survey published.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey could not be published.',
            );
        } finally {
            setPublishing(null);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const surveys = data?.data.data ?? [];
    return (
        <div className="space-y-3">
            {canManage && createOpen ? (
                <form
                    onSubmit={createSurvey}
                    className="grid gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:grid-cols-2 sm:p-5"
                >
                    {(
                        [
                            ['title', 'Survey title'],
                            ['description', 'Description'],
                            ['closes_at', 'Closes on'],
                            ['prompt', 'First question'],
                        ] as const
                    ).map(([name, label]) => (
                        <label
                            key={name}
                            className="text-xs font-medium text-[#4d5a4f]"
                        >
                            {label}
                            {name === 'description' ? (
                                <textarea
                                    value={form[name]}
                                    required={false}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            [name]: event.target.value,
                                        })
                                    }
                                    className="mt-1.5 min-h-20 w-full rounded-lg border border-[#e3e7df] p-3 text-xs"
                                />
                            ) : (
                                <input
                                    type={
                                        name === 'closes_at' ? 'date' : 'text'
                                    }
                                    required={
                                        name === 'title' || name === 'prompt'
                                    }
                                    value={form[name]}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            [name]: event.target.value,
                                        })
                                    }
                                    className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                                />
                            )}
                        </label>
                    ))}
                    <label className="text-xs font-medium text-[#4d5a4f]">
                        Question type
                        <select
                            value={form.question_type}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    question_type: event.target.value,
                                })
                            }
                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                        >
                            {[
                                'text',
                                'textarea',
                                'number',
                                'boolean',
                                'select',
                                'multiselect',
                                'rating',
                            ].map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </label>
                    {['select', 'multiselect'].includes(form.question_type) ? (
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Answer choices (comma separated)
                            <input
                                required
                                value={form.options}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        options: event.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    ) : null}
                    <div className="flex items-center justify-end gap-2 sm:col-span-2">
                        <button
                            type="button"
                            onClick={onCloseCreate}
                            className="h-9 rounded-lg border border-[#e8eae4] px-3 text-xs font-medium text-[#687267]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                        >
                            {creating ? 'Saving…' : 'Create survey'}
                        </button>
                    </div>
                </form>
            ) : null}
            {surveys.length ? (
                surveys.map((survey) => (
                    <article
                        key={survey.id}
                        className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-sm font-semibold text-[#39463b]">
                                        {survey.title}
                                    </h2>
                                    <span className="rounded-full bg-[#f2f3ef] px-2.5 py-1 text-[10px] font-medium text-[#697367] capitalize">
                                        {survey.status}
                                    </span>
                                </div>
                                {survey.description ? (
                                    <p className="mt-1 text-xs leading-5 text-[#7a8278]">
                                        {survey.description}
                                    </p>
                                ) : null}
                                {survey.closes_at ? (
                                    <p className="mt-2 text-[10px] text-[#858b82]">
                                        Closes{' '}
                                        {new Date(
                                            survey.closes_at,
                                        ).toLocaleDateString()}
                                    </p>
                                ) : null}
                            </div>
                            {canManage && survey.status === 'draft' ? (
                                <button
                                    type="button"
                                    disabled={publishing === survey.id}
                                    onClick={() =>
                                        void publishSurvey(survey.id)
                                    }
                                    className="rounded-lg bg-[#2b5139] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
                                >
                                    {publishing === survey.id
                                        ? 'Publishing…'
                                        : 'Publish'}
                                </button>
                            ) : null}
                        </div>
                        {canManage ? (
                            <ul className="mt-3 space-y-1 border-t border-[#eff0ec] pt-3">
                                {survey.questions.map((question) => (
                                    <li
                                        key={question.id}
                                        className="text-[11px] text-[#6f786e]"
                                    >
                                        {question.prompt}{' '}
                                        <span className="text-[#969c94] capitalize">
                                            · {question.type}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : canRespond && survey.has_responded ? (
                            <p className="mt-3 border-t border-[#eff0ec] pt-3 text-xs font-medium text-[#587057]">
                                Your response has been submitted.
                            </p>
                        ) : canRespond ? (
                            <SurveyResponseForm
                                survey={survey}
                                onSubmitted={reload}
                            />
                        ) : (
                            <ul className="mt-3 space-y-1 border-t border-[#eff0ec] pt-3">
                                {survey.questions.map((question) => (
                                    <li
                                        key={question.id}
                                        className="text-[11px] text-[#6f786e]"
                                    >
                                        {question.prompt}{' '}
                                        <span className="text-[#969c94] capitalize">
                                            · {question.type}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                ))
            ) : (
                <EmptyState>
                    {canManage
                        ? 'No surveys have been created yet.'
                        : 'There are no open surveys right now.'}
                </EmptyState>
            )}
        </div>
    );
}

export function AnnouncementCenter({
    role,
    createOpen,
    onCloseCreate,
}: {
    role: WorkspaceRole;
    createOpen: boolean;
    onCloseCreate: () => void;
}) {
    const canManage = role === 'Administrator' || role === 'Alumni coordinator';
    const { data, loading, error, reload } = useApiResource<
        ApiEnvelope<RawPagination<Announcement>>
    >(canManage ? '/api/announcements/manage' : '/api/announcements');
    const [form, setForm] = useState({
        title: '',
        body: '',
        audience_roles: [] as string[],
    });
    const [creating, setCreating] = useState(false);
    const [publishing, setPublishing] = useState<number | null>(null);

    async function createAnnouncement(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);
        try {
            await apiRequest<ApiEnvelope<Announcement>>('/api/announcements', {
                method: 'POST',
                body: {
                    title: form.title,
                    body: form.body,
                    audience_roles: form.audience_roles.length
                        ? form.audience_roles
                        : null,
                },
            });
            setForm({ title: '', body: '', audience_roles: [] });
            onCloseCreate();
            reload();
            toast.success('Announcement created as a draft.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Announcement could not be created.',
            );
        } finally {
            setCreating(false);
        }
    }

    async function publishAnnouncement(id: number) {
        setPublishing(id);
        try {
            await apiRequest<ApiEnvelope<Announcement>>(
                `/api/announcements/${id}/publish`,
                { method: 'POST' },
            );
            reload();
            toast.success('Announcement published.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Announcement could not be published.',
            );
        } finally {
            setPublishing(null);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const announcements = data?.data.data ?? [];
    return (
        <div className="space-y-3">
            {canManage && createOpen ? (
                <form
                    onSubmit={createAnnouncement}
                    className="grid gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5"
                >
                    <label className="text-xs font-medium text-[#4d5a4f]">
                        Title
                        <input
                            required
                            value={form.title}
                            onChange={(event) =>
                                setForm({ ...form, title: event.target.value })
                            }
                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                        />
                    </label>
                    <label className="text-xs font-medium text-[#4d5a4f]">
                        Announcement
                        <textarea
                            required
                            value={form.body}
                            onChange={(event) =>
                                setForm({ ...form, body: event.target.value })
                            }
                            className="mt-1.5 min-h-28 w-full rounded-lg border border-[#e3e7df] p-3 text-xs"
                        />
                    </label>
                    <fieldset className="flex flex-wrap gap-4 text-xs text-[#687267]">
                        <legend className="mb-2 font-medium text-[#4d5a4f]">
                            Audience (leave blank for all authenticated users)
                        </legend>
                        {[
                            ['alumni', 'Alumni'],
                            ['employer', 'Employers'],
                            ['alumni-coordinator', 'Alumni coordinators'],
                            [
                                'department-coordinator',
                                'Department coordinators',
                            ],
                        ].map(([value, label]) => (
                            <label
                                key={value}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={form.audience_roles.includes(
                                        value,
                                    )}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            audience_roles: event.target.checked
                                                ? [
                                                      ...form.audience_roles,
                                                      value,
                                                  ]
                                                : form.audience_roles.filter(
                                                      (item) => item !== value,
                                                  ),
                                        })
                                    }
                                />
                                {label}
                            </label>
                        ))}
                    </fieldset>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCloseCreate}
                            className="h-9 rounded-lg border border-[#e8eae4] px-3 text-xs font-medium text-[#687267]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                        >
                            {creating ? 'Saving…' : 'Create announcement'}
                        </button>
                    </div>
                </form>
            ) : null}
            {announcements.length ? (
                announcements.map((announcement) => (
                    <article
                        key={announcement.id}
                        className="flex flex-col gap-4 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:flex-row sm:items-start sm:p-5"
                    >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eef2eb] text-[#5e795f]">
                            <MessageSquareText className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-sm font-semibold text-[#39463b]">
                                    {announcement.title}
                                </h2>
                                <span className="rounded-full bg-[#f2f3ef] px-2.5 py-1 text-[10px] font-medium text-[#697367] capitalize">
                                    {announcement.status}
                                </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 whitespace-pre-line text-[#7a8278]">
                                {announcement.body}
                            </p>
                            <p className="mt-2 text-[10px] text-[#858b82]">
                                {announcement.published_at
                                    ? `Published ${new Date(announcement.published_at).toLocaleDateString()}`
                                    : `Created ${new Date(announcement.created_at).toLocaleDateString()}`}
                            </p>
                        </div>
                        {canManage && announcement.status === 'draft' ? (
                            <button
                                type="button"
                                disabled={publishing === announcement.id}
                                onClick={() =>
                                    void publishAnnouncement(announcement.id)
                                }
                                className="rounded-lg bg-[#2b5139] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
                            >
                                {publishing === announcement.id
                                    ? 'Publishing…'
                                    : 'Publish'}
                            </button>
                        ) : null}
                    </article>
                ))
            ) : (
                <EmptyState>
                    {canManage
                        ? 'No announcements have been created yet.'
                        : 'No announcements are available for your audience.'}
                </EmptyState>
            )}
        </div>
    );
}

export function EmployerDirectory() {
    const { data, loading, error, reload } =
        useApiResource<ApiEnvelope<RawPagination<Employer>>>('/api/employers');
    const [reviewing, setReviewing] = useState<number | null>(null);

    async function reviewEmployer(
        employerId: number,
        verificationStatus: 'verified' | 'rejected',
    ) {
        setReviewing(employerId);
        try {
            await apiRequest<ApiEnvelope<Employer>>(
                `/api/employers/${employerId}/verification`,
                {
                    method: 'PATCH',
                    body: { verification_status: verificationStatus },
                },
            );
            reload();
            toast.success(`Employer ${verificationStatus}.`);
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Employer review could not be saved.',
            );
        } finally {
            setReviewing(null);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const employers = data?.data.data ?? [];
    return employers.length ? (
        <div className="grid gap-3 md:grid-cols-2">
            {employers.map((employer) => (
                <article
                    key={employer.id}
                    className="rounded-2xl border border-[#e9ebe5] bg-white p-5"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-[#39463b]">
                                {employer.company_name}
                            </h2>
                            <p className="mt-1 text-xs text-[#7a8278]">
                                {employer.industry ?? 'Industry not listed'}
                            </p>
                        </div>
                        <span className="rounded-full bg-[#f2f3ef] px-2.5 py-1 text-[10px] font-medium text-[#697367] capitalize">
                            {employer.verification_status}
                        </span>
                    </div>
                    <p className="mt-4 text-xs text-[#7a8278]">
                        {employer.contact_email}
                    </p>
                    {employer.verification_status === 'pending' ? (
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={reviewing === employer.id}
                                onClick={() =>
                                    void reviewEmployer(employer.id, 'rejected')
                                }
                                className="rounded-lg border border-[#e8eae4] px-3 py-2 text-[11px] font-semibold text-[#7e564e] disabled:opacity-60"
                            >
                                Reject
                            </button>
                            <button
                                type="button"
                                disabled={reviewing === employer.id}
                                onClick={() =>
                                    void reviewEmployer(employer.id, 'verified')
                                }
                                className="rounded-lg bg-[#2b5139] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
                            >
                                Verify
                            </button>
                        </div>
                    ) : null}
                </article>
            ))}
        </div>
    ) : (
        <EmptyState>No employer records were found.</EmptyState>
    );
}

type EmployerForm = {
    company_name: string;
    website: string;
    description: string;
    industry: string;
    registration_number: string;
    contact_email: string;
    contact_phone: string;
    address: string;
};

const emptyEmployerForm: EmployerForm = {
    company_name: '',
    website: '',
    description: '',
    industry: '',
    registration_number: '',
    contact_email: '',
    contact_phone: '',
    address: '',
};

export function CompanyProfileCenter({
    editOpen,
    onCloseEdit,
}: {
    editOpen: boolean;
    onCloseEdit: () => void;
}) {
    const employers = useApiResource<ApiEnvelope<Employer[]>>(
        '/api/employers/mine',
    );
    const employerId = employers.data?.data[0]?.id;
    const profile = useApiResource<ApiEnvelope<Employer>>(
        employerId ? `/api/employers/${employerId}` : null,
    );
    const employer = profile.data?.data;
    const showForm = editOpen || !employerId;
    const [form, setForm] = useState(emptyEmployerForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (employer) {
            setForm({
                company_name: employer.company_name,
                website: employer.website ?? '',
                description: employer.description ?? '',
                industry: employer.industry ?? '',
                registration_number: employer.registration_number ?? '',
                contact_email: employer.contact_email,
                contact_phone: employer.contact_phone ?? '',
                address: employer.address ?? '',
            });
        }
    }, [employer]);

    async function saveCompany(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        const body = Object.fromEntries(
            Object.entries(form).map(([key, value]) => [key, value || null]),
        );

        try {
            if (employerId) {
                await apiRequest<ApiEnvelope<Employer>>(
                    `/api/employers/${employerId}`,
                    { method: 'PATCH', body },
                );
                profile.reload();
                toast.success('Company profile updated.');
            } else {
                await apiRequest<ApiEnvelope<Employer>>('/api/employers', {
                    method: 'POST',
                    body,
                });
                employers.reload();
                toast.success('Company submitted for verification.');
            }
            onCloseEdit();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Company profile could not be saved.',
            );
        } finally {
            setSaving(false);
        }
    }

    if (employers.loading || (employerId !== undefined && profile.loading)) {
        return <LoadingState />;
    }

    if (employers.error) {
        return <ErrorState message={employers.error} />;
    }

    if (profile.error) {
        return <ErrorState message={profile.error} />;
    }

    return (
        <div className="space-y-4">
            {showForm ? (
                <form
                    onSubmit={saveCompany}
                    className="grid gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:grid-cols-2 sm:p-5"
                >
                    {(
                        [
                            ['company_name', 'Company name', 'text'],
                            ['contact_email', 'Contact email', 'email'],
                            ['website', 'Website', 'url'],
                            ['industry', 'Industry', 'text'],
                            [
                                'registration_number',
                                'Registration number',
                                'text',
                            ],
                            ['contact_phone', 'Contact phone', 'tel'],
                        ] as const
                    ).map(([name, label, type]) => (
                        <label
                            key={name}
                            className="text-xs font-medium text-[#4d5a4f]"
                        >
                            {label}
                            <input
                                type={type}
                                required={[
                                    'company_name',
                                    'contact_email',
                                ].includes(name)}
                                value={form[name]}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        [name]: event.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    ))}
                    <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                        Description
                        <textarea
                            value={form.description}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    description: event.target.value,
                                })
                            }
                            className="mt-1.5 min-h-20 w-full rounded-lg border border-[#e3e7df] p-3 text-xs"
                        />
                    </label>
                    <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                        Address
                        <textarea
                            value={form.address}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    address: event.target.value,
                                })
                            }
                            className="mt-1.5 min-h-16 w-full rounded-lg border border-[#e3e7df] p-3 text-xs"
                        />
                    </label>
                    <div className="flex items-center justify-end gap-2 sm:col-span-2">
                        {employerId ? (
                            <button
                                type="button"
                                onClick={onCloseEdit}
                                className="h-9 rounded-lg border border-[#e8eae4] px-3 text-xs font-medium text-[#687267]"
                            >
                                Cancel
                            </button>
                        ) : null}
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                        >
                            {saving ? 'Saving…' : 'Save company profile'}
                        </button>
                    </div>
                </form>
            ) : employer ? (
                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-[#2e3c31]">
                                {employer.company_name}
                            </h2>
                            <p className="mt-1 text-xs text-[#7a8278]">
                                {employer.industry ?? 'Industry not listed'}
                            </p>
                        </div>
                        <span className="rounded-full bg-[#f2f3ef] px-2.5 py-1 text-[10px] font-medium text-[#697367] capitalize">
                            {employer.verification_status}
                        </span>
                    </div>
                    <p className="mt-4 text-xs leading-5 text-[#747c72]">
                        {employer.description ??
                            'Add a company description to introduce your organization to alumni.'}
                    </p>
                    <div className="mt-5 grid gap-2 border-t border-[#eff0ec] pt-4 text-xs text-[#737b71] sm:grid-cols-2">
                        <span>{employer.contact_email}</span>
                        <span>{employer.website ?? 'Website not listed'}</span>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

export function PublicJobs() {
    const jobs =
        useApiResource<ApiEnvelope<RawPagination<JobPosting>>>('/api/jobs');
    const applications = useApiResource<
        ApiEnvelope<RawPagination<JobApplication>>
    >('/api/applications/me');
    const [coverLetters, setCoverLetters] = useState<Record<number, string>>(
        {},
    );
    const [applying, setApplying] = useState<number | null>(null);

    async function apply(jobId: number) {
        setApplying(jobId);
        try {
            await apiRequest<ApiEnvelope<JobApplication>>(
                `/api/jobs/${jobId}/applications`,
                {
                    method: 'POST',
                    body: {
                        cover_letter: coverLetters[jobId] || null,
                    },
                },
            );
            applications.reload();
            toast.success('Application submitted.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Application could not be submitted.',
            );
        } finally {
            setApplying(null);
        }
    }

    if (jobs.loading || applications.loading) {
        return <LoadingState />;
    }

    if (jobs.error) {
        return <ErrorState message={jobs.error} />;
    }

    if (applications.error) {
        return <ErrorState message={applications.error} />;
    }

    const appliedIds = new Set(
        applications.data?.data.data.map((application) =>
            Number(application.job_posting_id),
        ),
    );
    const postings = jobs.data?.data.data ?? [];

    return postings.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
            {postings.map((job) => (
                <article
                    key={job.id}
                    className="rounded-2xl border border-[#e9ebe5] bg-white p-5 transition hover:border-[#dce3d8] hover:shadow-sm"
                >
                    <div className="flex items-start justify-between gap-3">
                        <span className="grid size-11 place-items-center rounded-xl bg-[#e7eee6] text-base font-bold text-[#426147]">
                            {initials(job.employer?.company_name ?? 'Company')}
                        </span>
                        <span className="rounded-full bg-[#f3f5f0] px-2.5 py-1 text-[10px] font-medium text-[#687667]">
                            {job.employment_type ??
                                'Employment type not listed'}
                        </span>
                    </div>
                    <h2 className="mt-4 font-semibold text-[#2e3c31]">
                        {job.title}
                    </h2>
                    <p className="mt-1 text-sm text-[#687267]">
                        {job.employer?.company_name ?? 'Employer'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#778075]">
                        <span className="rounded-full border border-[#e9ebe5] px-2.5 py-1">
                            {job.location ?? 'Location not listed'}
                        </span>
                        {job.workplace_type ? (
                            <span className="rounded-full border border-[#e9ebe5] px-2.5 py-1 capitalize">
                                {job.workplace_type}
                            </span>
                        ) : null}
                        {job.closes_at ? (
                            <span className="rounded-full border border-[#e9ebe5] px-2.5 py-1">
                                Closes{' '}
                                {new Date(job.closes_at).toLocaleDateString()}
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-4 line-clamp-4 text-xs leading-5 whitespace-pre-line text-[#737b71]">
                        {job.description}
                    </p>
                    {appliedIds.has(job.id) ? (
                        <p className="mt-5 rounded-xl bg-[#edf2eb] px-3 py-2.5 text-xs font-medium text-[#4c654f]">
                            Application submitted
                        </p>
                    ) : (
                        <div className="mt-5 space-y-2 border-t border-[#eff0ec] pt-4">
                            <label className="block text-[11px] font-medium text-[#4d5a4f]">
                                Cover letter (optional)
                                <textarea
                                    value={coverLetters[job.id] ?? ''}
                                    onChange={(event) =>
                                        setCoverLetters({
                                            ...coverLetters,
                                            [job.id]: event.target.value,
                                        })
                                    }
                                    maxLength={10000}
                                    className="mt-1.5 min-h-20 w-full rounded-lg border border-[#e3e7df] p-3 text-xs"
                                />
                            </label>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    disabled={applying === job.id}
                                    onClick={() => void apply(job.id)}
                                    className="rounded-lg bg-[#2b5139] px-4 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
                                >
                                    {applying === job.id
                                        ? 'Applying…'
                                        : 'Apply now'}
                                </button>
                            </div>
                        </div>
                    )}
                </article>
            ))}
        </div>
    ) : (
        <EmptyState>
            There are no published jobs available right now.
        </EmptyState>
    );
}

type JobForm = {
    employer_id: string;
    title: string;
    description: string;
    location: string;
    employment_type: string;
    workplace_type: string;
    salary_min: string;
    salary_max: string;
    closes_at: string;
};

const emptyJobForm: JobForm = {
    employer_id: '',
    title: '',
    description: '',
    location: '',
    employment_type: 'full-time',
    workplace_type: 'onsite',
    salary_min: '',
    salary_max: '',
    closes_at: '',
};

export function EmployerJobs({
    createOpen,
    onCloseCreate,
    onNavigate,
}: {
    createOpen: boolean;
    onCloseCreate: () => void;
    onNavigate: (page: string) => void;
}) {
    const employers = useApiResource<ApiEnvelope<Employer[]>>(
        '/api/employers/mine',
    );
    const jobs =
        useApiResource<ApiEnvelope<RawPagination<JobPosting>>>(
            '/api/employer/jobs',
        );
    const [form, setForm] = useState(emptyJobForm);
    const [creating, setCreating] = useState(false);
    const [publishing, setPublishing] = useState<number | null>(null);

    useEffect(() => {
        const firstEmployer = employers.data?.data[0];
        if (firstEmployer && !form.employer_id) {
            setForm((current) => ({
                ...current,
                employer_id: String(firstEmployer.id),
            }));
        }
    }, [employers.data, form.employer_id]);

    async function createJob(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);
        try {
            await apiRequest<ApiEnvelope<JobPosting>>('/api/employer/jobs', {
                method: 'POST',
                body: {
                    ...form,
                    employer_id: Number(form.employer_id),
                    salary_min: form.salary_min
                        ? Number(form.salary_min)
                        : null,
                    salary_max: form.salary_max
                        ? Number(form.salary_max)
                        : null,
                    closes_at: form.closes_at || null,
                },
            });
            setForm({
                ...emptyJobForm,
                employer_id: form.employer_id,
            });
            onCloseCreate();
            jobs.reload();
            toast.success('Job posting saved as a draft.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Job posting could not be created.',
            );
        } finally {
            setCreating(false);
        }
    }

    async function publishJob(jobId: number) {
        setPublishing(jobId);
        try {
            await apiRequest<ApiEnvelope<JobPosting>>(
                `/api/employer/jobs/${jobId}/publish`,
                { method: 'POST' },
            );
            jobs.reload();
            toast.success('Job posting published.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Job posting could not be published.',
            );
        } finally {
            setPublishing(null);
        }
    }

    if (employers.loading || jobs.loading) {
        return <LoadingState />;
    }

    if (employers.error) {
        return <ErrorState message={employers.error} />;
    }

    if (jobs.error) {
        return <ErrorState message={jobs.error} />;
    }

    const companies = employers.data?.data ?? [];
    const postings = jobs.data?.data.data ?? [];
    return (
        <div className="space-y-4">
            {!companies.length ? (
                <section className="rounded-2xl border border-[#e9ebe5] bg-white p-6">
                    <h2 className="text-sm font-semibold text-[#39463b]">
                        Company profile required
                    </h2>
                    <p className="mt-2 text-xs text-[#7a8278]">
                        Register your company before creating job postings.
                    </p>
                    <button
                        type="button"
                        onClick={() => onNavigate('Company profile')}
                        className="mt-4 rounded-lg bg-[#2b5139] px-4 py-2 text-xs font-semibold text-white"
                    >
                        Set up company profile
                    </button>
                </section>
            ) : null}
            {createOpen && companies.length ? (
                <form
                    onSubmit={createJob}
                    className="grid gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:grid-cols-2 sm:p-5"
                >
                    <label className="text-xs font-medium text-[#4d5a4f]">
                        Company
                        <select
                            required
                            value={form.employer_id}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    employer_id: event.target.value,
                                })
                            }
                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                        >
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.company_name} ·{' '}
                                    {company.verification_status}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs font-medium text-[#4d5a4f]">
                        Job title
                        <input
                            required
                            value={form.title}
                            onChange={(event) =>
                                setForm({ ...form, title: event.target.value })
                            }
                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                        />
                    </label>
                    <label className="text-xs font-medium text-[#4d5a4f]">
                        Employment type
                        <select
                            value={form.employment_type}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    employment_type: event.target.value,
                                })
                            }
                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                        >
                            {[
                                ['full-time', 'Full-time'],
                                ['part-time', 'Part-time'],
                                ['contract', 'Contract'],
                                ['internship', 'Internship'],
                                ['temporary', 'Temporary'],
                            ].map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs font-medium text-[#4d5a4f]">
                        Workplace
                        <select
                            value={form.workplace_type}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    workplace_type: event.target.value,
                                })
                            }
                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                        >
                            {[
                                ['onsite', 'On-site'],
                                ['hybrid', 'Hybrid'],
                                ['remote', 'Remote'],
                            ].map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    {(
                        [
                            ['location', 'Location', 'text'],
                            ['salary_min', 'Salary minimum', 'number'],
                            ['salary_max', 'Salary maximum', 'number'],
                            ['closes_at', 'Closing date', 'date'],
                        ] as const
                    ).map(([name, label, type]) => (
                        <label
                            key={name}
                            className="text-xs font-medium text-[#4d5a4f]"
                        >
                            {label}
                            <input
                                type={type}
                                min={type === 'number' ? '0' : undefined}
                                value={form[name]}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        [name]: event.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    ))}
                    <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                        Description
                        <textarea
                            required
                            value={form.description}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    description: event.target.value,
                                })
                            }
                            className="mt-1.5 min-h-28 w-full rounded-lg border border-[#e3e7df] p-3 text-xs"
                        />
                    </label>
                    <div className="flex items-center justify-end gap-2 sm:col-span-2">
                        <button
                            type="button"
                            onClick={onCloseCreate}
                            className="h-9 rounded-lg border border-[#e8eae4] px-3 text-xs font-medium text-[#687267]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                        >
                            {creating ? 'Saving…' : 'Save draft'}
                        </button>
                    </div>
                </form>
            ) : null}
            {postings.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                    {postings.map((job) => {
                        const employer = companies.find(
                            (company) => company.id === job.employer_id,
                        );
                        const canPublish =
                            employer?.verification_status === 'verified';
                        return (
                            <article
                                key={job.id}
                                className="rounded-2xl border border-[#e9ebe5] bg-white p-5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-sm font-semibold text-[#39463b]">
                                            {job.title}
                                        </h2>
                                        <p className="mt-1 text-xs text-[#7a8278]">
                                            {job.employer?.company_name ??
                                                employer?.company_name}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-[#f2f3ef] px-2.5 py-1 text-[10px] font-medium text-[#697367] capitalize">
                                        {job.status}
                                    </span>
                                </div>
                                <p className="mt-3 line-clamp-3 text-xs leading-5 text-[#737b71]">
                                    {job.description}
                                </p>
                                <p className="mt-3 text-[10px] text-[#858b82]">
                                    {job.applications_count ?? 0} applications
                                    {job.location ? ` · ${job.location}` : ''}
                                </p>
                                <div className="mt-4 flex flex-wrap justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onNavigate('Applicants')}
                                        className="rounded-lg border border-[#e8eae4] px-3 py-2 text-[11px] font-semibold text-[#526754]"
                                    >
                                        View applicants
                                    </button>
                                    {job.status === 'draft' ? (
                                        <button
                                            type="button"
                                            disabled={
                                                !canPublish ||
                                                publishing === job.id
                                            }
                                            onClick={() =>
                                                void publishJob(job.id)
                                            }
                                            title={
                                                canPublish
                                                    ? undefined
                                                    : 'Company verification is required to publish jobs.'
                                            }
                                            className="rounded-lg bg-[#2b5139] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-40"
                                        >
                                            {publishing === job.id
                                                ? 'Publishing…'
                                                : canPublish
                                                  ? 'Publish'
                                                  : 'Verification required'}
                                        </button>
                                    ) : null}
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <EmptyState>No job postings have been created.</EmptyState>
            )}
        </div>
    );
}

export function AlumniApplications() {
    const { data, loading, error } = useApiResource<
        ApiEnvelope<RawPagination<JobApplication>>
    >('/api/applications/me');

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const applications = data?.data.data ?? [];
    return applications.length ? (
        <div className="grid gap-3">
            {applications.map((application) => (
                <article
                    key={application.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:flex-row sm:items-center sm:p-5"
                >
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-[#39463b]">
                            {application.job_posting?.title ??
                                'Job posting no longer available'}
                        </h2>
                        <p className="mt-1 text-xs text-[#7a8278]">
                            {application.job_posting?.employer?.company_name ??
                                'Employer'}
                            {application.job_posting?.location
                                ? ` · ${application.job_posting.location}`
                                : ''}
                        </p>
                        <p className="mt-2 text-[10px] text-[#858b82]">
                            Submitted{' '}
                            {new Date(
                                application.created_at,
                            ).toLocaleDateString()}
                        </p>
                    </div>
                    <span className="rounded-full bg-[#f2f3ef] px-2.5 py-1 text-[10px] font-medium text-[#697367] capitalize">
                        {application.status.replaceAll('_', ' ')}
                    </span>
                </article>
            ))}
        </div>
    ) : (
        <EmptyState>
            You have not submitted any job applications yet.
        </EmptyState>
    );
}

export function EmployerApplicants() {
    const jobs =
        useApiResource<ApiEnvelope<RawPagination<JobPosting>>>(
            '/api/employer/jobs',
        );
    const [selectedJobId, setSelectedJobId] = useState('');
    const postings = jobs.data?.data.data ?? [];
    const selectedJob =
        selectedJobId || (postings[0] ? String(postings[0].id) : '');
    const applications = useApiResource<
        ApiEnvelope<RawPagination<JobApplication>>
    >(selectedJob ? `/api/employer/jobs/${selectedJob}/applications` : null);
    const [updating, setUpdating] = useState<number | null>(null);

    async function updateStatus(applicationId: number, status: string) {
        setUpdating(applicationId);
        try {
            await apiRequest<ApiEnvelope<JobApplication>>(
                `/api/applications/${applicationId}/status`,
                { method: 'PATCH', body: { status } },
            );
            applications.reload();
            toast.success('Application status updated.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Application status could not be updated.',
            );
        } finally {
            setUpdating(null);
        }
    }

    if (jobs.loading) {
        return <LoadingState />;
    }

    if (jobs.error) {
        return <ErrorState message={jobs.error} />;
    }

    if (!postings.length) {
        return (
            <EmptyState>No job postings are available to review.</EmptyState>
        );
    }

    return (
        <div className="space-y-4">
            <label className="block text-xs font-medium text-[#4d5a4f]">
                Job posting
                <select
                    value={selectedJob}
                    onChange={(event) => setSelectedJobId(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs sm:max-w-md"
                >
                    {postings.map((job) => (
                        <option key={job.id} value={job.id}>
                            {job.title}
                        </option>
                    ))}
                </select>
            </label>
            {applications.loading ? (
                <LoadingState />
            ) : applications.error ? (
                <ErrorState message={applications.error} />
            ) : applications.data?.data.data.length ? (
                <div className="grid gap-3">
                    {applications.data.data.data.map((application) => (
                        <article
                            key={application.id}
                            className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5"
                        >
                            <div className="flex flex-col justify-between gap-3 sm:flex-row">
                                <div>
                                    <h2 className="text-sm font-semibold text-[#39463b]">
                                        {application.alumni_profile?.name ??
                                            'Alumni applicant'}
                                    </h2>
                                    <p className="mt-1 text-xs text-[#7a8278]">
                                        {application.alumni_profile?.email}
                                    </p>
                                    {application.cover_letter ? (
                                        <p className="mt-3 text-xs leading-5 whitespace-pre-line text-[#737b71]">
                                            {application.cover_letter}
                                        </p>
                                    ) : null}
                                    {application.profile_snapshot?.education?.length ? (
                                        <div className="mt-3 space-y-1 rounded-xl bg-[#fafbf9] p-2.5 text-[11px] text-[#556153]">
                                            <p className="font-semibold text-[#344436]">Academic Qualifications (Snapshot):</p>
                                            {application.profile_snapshot.education.map((edu: any, i: number) => (
                                                <p key={i}>
                                                    • {edu.program ?? 'Degree'} ({edu.graduation_year ?? 'N/A'})
                                                    {edu.honors ? ` — ${edu.honors}` : ''}
                                                    {edu.gwa ? ` (GWA: ${edu.gwa})` : ''}
                                                </p>
                                            ))}
                                        </div>
                                    ) : null}
                                    {application.resume_snapshot_path ? (
                                        <a
                                            href={`/api/applications/${application.id}/resume`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#d2ddd0] bg-[#f8faf7] px-3 py-1.5 text-xs font-semibold text-[#2c5339] hover:bg-[#edf2ea]"
                                        >
                                            Download Resume Snapshot
                                        </a>
                                    ) : null}
                                </div>
                                <label className="text-[11px] font-medium text-[#4d5a4f]">
                                    Application status
                                    <select
                                        value={application.status}
                                        disabled={updating === application.id}
                                        onChange={(event) =>
                                            void updateStatus(
                                                application.id,
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1.5 h-9 rounded-lg border border-[#e3e7df] bg-white px-2 text-xs"
                                    >
                                        {[
                                            'submitted',
                                            'reviewing',
                                            'shortlisted',
                                            'rejected',
                                            'hired',
                                        ].map((status) => (
                                            <option key={status} value={status}>
                                                {status.replaceAll('_', ' ')}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyState>
                    No applicants have applied to this posting.
                </EmptyState>
            )}
        </div>
    );
}

export function RegistrationAssistanceQueue() {
    const resource = useApiResource<PaginatedApiResponse<RegistrationAssistanceRequest>>(
        '/api/registration-assistance',
    );
    const [selectedRequest, setSelectedRequest] = useState<RegistrationAssistanceRequest | null>(null);
    const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'needs_more_information' | 'rejected'>('reviewed');
    const [reviewNote, setReviewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleReviewSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedRequest) return;

        setSubmitting(true);
        try {
            await apiRequest(`/api/registration-assistance/${selectedRequest.id}`, {
                method: 'PATCH',
                body: {
                    status: reviewStatus,
                    review_note: reviewNote || null,
                },
            });
            toast.success('Registration claim assistance request updated.');
            setSelectedRequest(null);
            setReviewNote('');
            resource.reload();
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Failed to update request.');
        } finally {
            setSubmitting(false);
        }
    }

    if (resource.loading) {
        return <LoadingState />;
    }

    if (resource.error) {
        return <ErrorState message={resource.error} />;
    }

    const items = resource.data?.data ?? [];

    if (!items.length) {
        return (
            <EmptyState>
                No pending registration assistance requests for your academic programs.
            </EmptyState>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3">
                {items.map((request) => (
                    <article
                        key={request.id}
                        className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5"
                    >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-[#29382e]">
                                        {request.name}
                                    </h3>
                                    <span className="rounded bg-[#edf2eb] px-2 py-0.5 text-[10px] font-semibold text-[#305338]">
                                        {request.student_number}
                                    </span>
                                    {request.program && (
                                        <span className="rounded bg-[#f0f4ee] px-2 py-0.5 text-[10px] font-medium text-[#465a49]">
                                            {request.program.code}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-[#70796e]">
                                    <p>Email: <span className="text-[#3b473d]">{request.email}</span></p>
                                    <p>Birthdate: <span className="text-[#3b473d]">{request.date_of_birth}</span></p>
                                    <p>Requested: <span className="text-[#3b473d]">{new Date(request.created_at).toLocaleDateString()}</span></p>
                                </div>
                                {request.message && (
                                    <p className="mt-3 rounded-xl bg-[#fafbf9] p-3 text-xs leading-5 text-[#526051]">
                                        "{request.message}"
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedRequest(request);
                                        setReviewStatus('reviewed');
                                        setReviewNote('Verified with official registrar records. Account approved.');
                                    }}
                                    className="rounded-xl bg-[#2b5139] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#22442e]"
                                >
                                    Approve claim
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedRequest(request);
                                        setReviewStatus('needs_more_information');
                                        setReviewNote('');
                                    }}
                                    className="rounded-xl border border-[#d2ddd0] bg-white px-3 py-1.5 text-xs font-medium text-[#435245] hover:bg-[#f4f6f2]"
                                >
                                    Review
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-[#29382e]">
                                    Review Registration Claim
                                </h3>
                                <p className="mt-0.5 text-xs text-[#70796e]">
                                    {selectedRequest.name} ({selectedRequest.student_number})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRequest(null)}
                                className="rounded-lg p-1 text-[#838c81] hover:bg-[#f2f4f0]"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3">
                            <label className="block text-xs font-medium text-[#4d5a4f]">
                                Decision outcome
                                <select
                                    value={reviewStatus}
                                    onChange={(e) => setReviewStatus(e.target.value as any)}
                                    className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                                >
                                    <option value="reviewed">Approve & verify (Reviewed)</option>
                                    <option value="needs_more_information">Request more info</option>
                                    <option value="rejected">Reject claim</option>
                                </select>
                            </label>

                            <label className="block text-xs font-medium text-[#4d5a4f]">
                                Review note
                                <textarea
                                    rows={3}
                                    value={reviewNote}
                                    onChange={(e) => setReviewNote(e.target.value)}
                                    placeholder="Enter review explanation or instructions for applicant..."
                                    className="mt-1 w-full rounded-lg border border-[#e3e7df] p-2.5 text-xs outline-none focus:border-[#819981]"
                                />
                            </label>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRequest(null)}
                                    className="rounded-xl border border-[#e2e7df] px-3 py-1.5 text-xs text-[#5c685b] hover:bg-[#f4f6f2]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-[#2b5139] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#22442e] disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting…' : 'Confirm decision'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
