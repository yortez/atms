import { useEffect, useState, type FormEvent } from 'react';
import { Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Award,
    Briefcase,
    BriefcaseBusiness,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    Coins,
    Download,
    ExternalLink,
    Eye,
    FileCheck,
    FileText,
    Filter,
    GraduationCap,
    Info,
    Lock,
    MapPin,
    MessageSquareText,
    Pencil,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    Trash2,
    TrendingUp,
    UploadCloud,
    UserPlus,
    UsersRound,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/confirmation-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    AlumniDocumentItem,
    AlumniEvent,
    AlumniEventAttendee,
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

function DemoQuickLoginToggleCard() {
    const { data, loading, reload } = useApiResource<
        ApiEnvelope<{ demo_quick_login_enabled: boolean }>
    >('/api/admin/settings/demo-quick-login');
    const [saving, setSaving] = useState(false);

    const enabled = data?.data?.demo_quick_login_enabled ?? true;

    async function toggleDemoLogin() {
        const nextValue = !enabled;
        setSaving(true);
        try {
            const response = await apiRequest<{
                data: { demo_quick_login_enabled: boolean };
                message?: string;
            }>('/api/admin/settings/demo-quick-login', {
                method: 'PATCH',
                body: { enabled: nextValue },
            });
            reload();
            toast.success(
                response.message ??
                (nextValue
                    ? 'Demo quick-fill login enabled.'
                    : 'Demo quick-fill login disabled.'),
            );
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'Could not update demo quick-login setting.',
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            data-test="admin-demo-quick-login-card"
            className="flex flex-col justify-between gap-3 rounded-2xl border border-[#dfe5dd] bg-[#f9faf7] p-4 sm:flex-row sm:items-center"
        >
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold tracking-wider text-[#29382e] uppercase">
                        Quick-Fill Demo Accounts on Login Page
                    </h3>
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${enabled
                                ? 'bg-[#e3eee0] text-[#2b5139]'
                                : 'bg-[#eff0ec] text-[#6d746a]'
                            }`}
                    >
                        {loading ? 'Checking…' : enabled ? 'Shown' : 'Hidden'}
                    </span>
                </div>
                <p className="mt-0.5 text-xs text-[#6b7669]">
                    Show or hide the collapsible Quick-Fill Demo Accounts card on
                    the public sign-in page (<code>/login</code>).
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={loading || saving}
                    onClick={toggleDemoLogin}
                    data-test="toggle-demo-quick-login-button"
                    className="inline-flex items-center gap-2.5 rounded-full border border-[#d6dfd3] bg-white px-3 py-1.5 text-xs font-semibold text-[#29382e] shadow-2xs transition hover:border-[#2b5139] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${enabled ? 'bg-[#2b5139]' : 'bg-[#cbd2c9]'
                            }`}
                    >
                        <span
                            className={`inline-block size-3.5 transform rounded-full bg-white shadow-xs transition-transform ${enabled ? 'translate-x-4' : 'translate-x-1'
                                }`}
                        />
                    </span>
                    <span>
                        {saving
                            ? 'Saving…'
                            : enabled
                                ? 'Shown on /login'
                                : 'Hidden on /login'}
                    </span>
                </button>
            </div>
        </div>
    );
}

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
    const { data, loading, error, reload } = useApiResource<ApiEnvelope<AlumniProfile>>(
        `/api/alumni/${profileId}`,
    );
    const profile = data?.data;
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        email: '',
        date_of_birth: '',
        preferred_name: '',
        gender: '',
        civil_status: '',
        contact_number: '',
        current_address: '',
        permanent_address: '',
        profile_status: 'active' as 'active' | 'archived',
    });

    useEffect(() => {
        if (profile) {
            setEditForm({
                first_name: profile.first_name ?? '',
                middle_name: profile.middle_name ?? '',
                last_name: profile.last_name ?? '',
                suffix: profile.suffix ?? '',
                email: profile.email ?? '',
                date_of_birth: profile.date_of_birth ?? '',
                preferred_name: profile.preferred_name ?? '',
                gender: profile.gender ?? '',
                civil_status: profile.civil_status ?? '',
                contact_number: profile.contact_number ?? '',
                current_address: profile.current_address ?? '',
                permanent_address: profile.permanent_address ?? '',
                profile_status: profile.profile_status ?? 'active',
            });
        }
    }, [profile]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        try {
            await apiRequest<ApiEnvelope<AlumniProfile>>(
                `/api/alumni/${profileId}`,
                {
                    method: 'PATCH',
                    body: {
                        first_name: editForm.first_name,
                        middle_name: editForm.middle_name || null,
                        last_name: editForm.last_name,
                        suffix: editForm.suffix || null,
                        email: editForm.email,
                        date_of_birth: editForm.date_of_birth,
                        preferred_name: editForm.preferred_name || null,
                        gender: editForm.gender || null,
                        civil_status: editForm.civil_status || null,
                        contact_number: editForm.contact_number || null,
                        current_address: editForm.current_address || null,
                        permanent_address: editForm.permanent_address || null,
                        profile_status: editForm.profile_status,
                    },
                },
            );
            toast.success('Alumni record updated successfully.');
            setIsEditing(false);
            reload();
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Could not update alumni record.',
            );
        } finally {
            setSaving(false);
        }
    }

    const detail = (label: string, value: string | null | undefined) => (
        <div className="min-w-0">
            <dt className="text-[10px] font-semibold tracking-wide text-[#8a9088] uppercase">
                {label}
            </dt>
            <dd className="mt-0.5 text-xs break-words text-[#36443a]">
                {value || '—'}
            </dd>
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
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eff0ec] bg-white px-5 py-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-[#29382e]">
                            {isEditing ? 'Edit alumni record' : 'Alumni profile'}
                        </h2>
                        {profile?.profile_status && !isEditing && (
                            <span className="rounded-full bg-[#f0f1ed] px-2 py-0.5 text-[10px] font-medium text-[#6d746a] capitalize">
                                {profile.profile_status}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {profile && !isEditing && (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#e4e7e0] bg-white px-2.5 py-1 text-xs font-medium text-[#29382e] hover:bg-[#f6f8f4] cursor-pointer"
                            >
                                <Pencil className="size-3" />
                                Edit
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close profile"
                            className="rounded-lg p-1 text-[#838c81] hover:bg-[#f2f4f0] cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="space-y-5 p-5">
                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <ErrorState message={error} />
                    ) : isEditing ? (
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs text-amber-900">
                                Editing official institutional record for <strong>{profile?.name}</strong>.
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        First name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.first_name}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, first_name: e.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        Middle name
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.middle_name}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, middle_name: e.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        Last name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.last_name}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, last_name: e.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        Suffix
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Jr., III"
                                        value={editForm.suffix}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, suffix: e.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={editForm.email}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, email: e.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        Date of birth <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={editForm.date_of_birth}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, date_of_birth: e.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        Preferred name / Nickname
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Alex"
                                        value={editForm.preferred_name}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, preferred_name: e.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    />
                                </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        Gender
                                    </label>
                                    <select
                                        value={editForm.gender}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, gender: e.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        Civil status
                                    </label>
                                    <select
                                        value={editForm.civil_status}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, civil_status: e.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    >
                                        <option value="">Select Civil Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Separated">Separated</option>
                                        <option value="Divorced">Divorced</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        Contact number
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. +63 912 345 6789"
                                        value={editForm.contact_number}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, contact_number: e.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#495a4f]">
                                        Profile status
                                    </label>
                                    <select
                                        value={editForm.profile_status}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                profile_status: e.target.value as 'active' | 'archived',
                                            })
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                    >
                                        <option value="active">Active</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#495a4f]">
                                    Current address
                                </label>
                                <input
                                    type="text"
                                    placeholder="Street, Barangay, City/Municipality, Province"
                                    value={editForm.current_address}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, current_address: e.target.value })
                                    }
                                    className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#495a4f]">
                                    Permanent address
                                </label>
                                <input
                                    type="text"
                                    placeholder="Street, Barangay, City/Municipality, Province"
                                    value={editForm.permanent_address}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, permanent_address: e.target.value })
                                    }
                                    className="mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs"
                                />
                            </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-[#eff0ec]">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="h-9 rounded-lg border border-[#e8eae4] px-4 text-xs font-medium text-[#687267] hover:bg-[#f6f8f4] cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white hover:bg-[#203e2c] disabled:opacity-60 cursor-pointer"
                                >
                                    {saving ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    ) : profile ? (
                        <>
                            <section className="flex items-center gap-3">
                                <Avatar className="size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[#001c17]/10">
                                    <AvatarImage
                                        src={profile.avatar ?? undefined}
                                        alt={profile.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-full bg-[#e9eee5] text-sm font-bold text-[#45634a]">
                                        {initials(profile.name)}
                                    </AvatarFallback>
                                </Avatar>
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
                                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {detail('First name', profile.first_name)}
                                    {detail('Middle name', profile.middle_name)}
                                    {detail('Last name', profile.last_name)}
                                    {detail('Suffix', profile.suffix)}
                                    {detail('Email', profile.email)}
                                    {detail('Birthdate', profile.date_of_birth)}
                                    {detail('Gender', profile.gender)}
                                    {detail('Civil status', profile.civil_status)}
                                    {detail('Contact number', profile.contact_number)}
                                    {detail('Current address', profile.current_address)}
                                    {detail('Permanent address', profile.permanent_address)}
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
                    gender: form.sex || null,
                    civil_status: form.civil_status || null,
                    contact_number: form.contact_number || null,
                    current_address: form.current_address || null,
                    permanent_address: form.permanent_address || null,
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
                <div className="flex w-full items-center gap-2 sm:w-auto">
                    <button
                        type="button"
                        onClick={() => {
                            setImportModalOpen(true);
                            setImportStats(null);
                            setImportFile(null);
                        }}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d2ddd0] bg-white px-3.5 text-xs font-semibold text-[#2c5339] shadow-xs transition hover:bg-[#edf2ea] sm:flex-initial"
                    >
                        <span>Import CSV</span>
                    </button>
                    <a
                        href="/api/alumni/import-template"
                        className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-[#e2e7df] bg-[#f8faf7] px-3 text-xs font-medium text-[#5c685b] transition hover:bg-[#edf2ea] sm:flex-initial"
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
                                                        <Avatar className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-[#001c17]/10">
                                                            <AvatarImage
                                                                src={
                                                                    alumnus.avatar ??
                                                                    undefined
                                                                }
                                                                alt={
                                                                    alumnus.name
                                                                }
                                                                className="object-cover"
                                                            />
                                                            <AvatarFallback className="rounded-full bg-[#e9eee5] text-[10px] font-bold text-[#45634a]">
                                                                {initials(
                                                                    alumnus.name,
                                                                )}
                                                            </AvatarFallback>
                                                        </Avatar>
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
                    <div className="flex flex-col gap-2.5 border-t border-[#eff0ec] px-4 py-3 text-[11px] text-[#838980] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <span>
                            Showing {data?.data.length ?? 0} of{' '}
                            {data?.meta?.total ?? 0} alumni
                        </span>
                        <div className="flex items-center justify-between gap-2 sm:justify-end">
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

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AcademicRecords() {
    const { data, loading, error } =
        useApiResource<ApiEnvelope<AlumniProfile>>('/api/me/alumni');
    const profile = data?.data;

    const documentsResource = useApiResource<ApiEnvelope<AlumniDocumentItem[]>>(
        profile?.id ? `/api/alumni/${profile.id}/documents` : null,
    );

    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [docType, setDocType] = useState<'supporting' | 'resume'>('supporting');
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    async function handleUpload(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!profile || !uploadFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('document_type', docType);
        formData.append('file', uploadFile);

        try {
            await apiRequest<ApiEnvelope<AlumniDocumentItem>>(
                `/api/alumni/${profile.id}/documents`,
                {
                    method: 'POST',
                    body: formData,
                },
            );
            toast.success('Document uploaded successfully.');
            setUploadFile(null);
            documentsResource.reload();
        } catch (err) {
            toast.error(
                err instanceof ApiError ? err.message : 'Could not upload document.',
            );
        } finally {
            setUploading(false);
        }
    }

    async function handleDeleteDocument(documentId: number) {
        setDeletingId(documentId);
        try {
            await apiRequest(`/api/alumni-documents/${documentId}`, {
                method: 'DELETE',
            });
            toast.success('Document removed.');
            documentsResource.reload();
        } catch (err) {
            toast.error(
                err instanceof ApiError ? err.message : 'Could not remove document.',
            );
        } finally {
            setDeletingId(null);
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
                No academic profile is linked to this account.
            </EmptyState>
        );
    }

    const records = profile.education_records ?? [];
    const documents = documentsResource.data?.data ?? [];

    return (
        <div className="space-y-6">
            {/* Academic Hero Header */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001c17] via-[#052d26] to-[#0b382f] p-6 text-white shadow-lg sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[#E47818]/15 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/20 text-[#E47818]">
                            <GraduationCap className="size-8" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                    Academic Credentials
                                </h1>
                                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-500/30">
                                    Official Archive
                                </span>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-emerald-100/80">
                                South East Asian Institute of Technology, Inc. · CHED Conferred Degrees
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-white/90 border border-white/15">
                            {records.length} {records.length === 1 ? 'Degree' : 'Degrees'} Conferred
                        </span>
                        <span className="rounded-full bg-amber-400/20 px-3 py-1 font-medium text-amber-200 border border-amber-400/30">
                            CHED Accredited
                        </span>
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Conferred Degrees Section */}
                <div className="space-y-6">
                    <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#001c17]">
                                    <GraduationCap className="size-4.5" />
                                </span>
                                <div>
                                    <h2 className="text-sm font-bold text-[#001c17]">
                                        Conferred Degree Programs
                                    </h2>
                                    <p className="text-xs text-zinc-500">
                                        Verified records archived in the SEAIT Registrar
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-zinc-500">
                                {records.length} {records.length === 1 ? 'Record' : 'Records'}
                            </span>
                        </div>

                        <div className="mt-4 space-y-4">
                            {records.length > 0 ? (
                                records.map((record) => (
                                    <article
                                        key={record.id}
                                        className="relative rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-5 transition hover:border-[#E47818]/40"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-base font-bold text-zinc-900">
                                                    {record.program ?? 'Degree Program'}
                                                </h3>
                                                {record.degree && (
                                                    <p className="text-xs font-semibold text-zinc-600">
                                                        {record.degree}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {record.graduation_year && (
                                                    <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-[11px] font-bold text-zinc-800">
                                                        Class of {record.graduation_year}
                                                    </span>
                                                )}
                                                {record.honors && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300">
                                                        <Award className="size-3 text-amber-700" />
                                                        {record.honors}
                                                    </span>
                                                )}
                                                {record.gwa && (
                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 border border-emerald-300">
                                                        GWA {record.gwa}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-zinc-200/60 pt-3">
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                                                    Student Number
                                                </span>
                                                <span className="font-mono font-semibold text-zinc-800">
                                                    {record.student_number}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                                                    Accreditation
                                                </span>
                                                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                                    <CheckCircle2 className="size-3" /> CHED Verified
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-500">
                                    No academic credentials registered to this account.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Official Document Request Notice */}
                    <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
                        <div className="flex items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#E47818]">
                                <FileText className="size-4.5" />
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-[#001c17]">
                                    Request Official Transcript (TOR) & CAV
                                </h3>
                                <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                                    Official physical transcripts bearing the SEAIT dry seal, Certificates of Graduation, and CHED/DFA authentication (CAV) require registrar clearance.
                                </p>
                                <Link
                                    href="/alumni/registration-assistance"
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#E47818] hover:underline"
                                >
                                    Submit Registrar Assistance Request <ArrowRight className="size-3" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Supporting Documents & Uploads Section */}
                <div className="space-y-6">
                    <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#001c17]">
                                    <UploadCloud className="size-4.5" />
                                </span>
                                <div>
                                    <h2 className="text-sm font-bold text-[#001c17]">
                                        Document Archive
                                    </h2>
                                    <p className="text-xs text-zinc-500">
                                        Diplomas, board exam ratings, licenses & CVs
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                                {documents.length} {documents.length === 1 ? 'File' : 'Files'}
                            </span>
                        </div>

                        {/* Upload Form */}
                        <form onSubmit={handleUpload} className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4">
                            <h3 className="text-xs font-bold text-zinc-800">
                                Upload Academic Document or Credential
                            </h3>
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                                Supports PDF, DOC, or DOCX files up to 10MB.
                            </p>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-[11px] font-semibold text-zinc-700">
                                        Document Category
                                    </label>
                                    <select
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value as 'supporting' | 'resume')}
                                        className="mt-1 h-9 w-full rounded-xl border border-zinc-300 bg-white px-3 text-xs text-zinc-800 focus:border-[#E47818] focus:outline-hidden"
                                    >
                                        <option value="supporting">Supporting Academic Document (Diploma, Certificate)</option>
                                        <option value="resume">Resume / Curriculum Vitae (CV)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-zinc-700">
                                        Select File
                                    </label>
                                    <input
                                        type="file"
                                        required
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                                        className="mt-1 block h-9 w-full text-xs text-zinc-600 file:mr-2 file:h-7 file:rounded-lg file:border-0 file:bg-[#001c17] file:px-2.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#0b382f] cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="mt-3 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={uploading || !uploadFile}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#E47818] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#c96611] disabled:opacity-50 cursor-pointer"
                                >
                                    <UploadCloud className="size-3.5" />
                                    {uploading ? 'Uploading…' : 'Upload Document'}
                                </button>
                            </div>
                        </form>

                        {/* Uploaded Documents List */}
                        <div className="mt-5 space-y-3">
                            <h3 className="text-xs font-bold text-zinc-700">
                                Uploaded Credentials & Records
                            </h3>
                            {documentsResource.loading ? (
                                <p className="text-xs text-zinc-500 py-3">Loading documents…</p>
                            ) : documents.length > 0 ? (
                                documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white p-3 text-xs transition hover:border-zinc-300"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                                                <FileText className="size-4" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-zinc-900 truncate">
                                                    {doc.original_name}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                                    <span className="capitalize font-medium text-zinc-600">
                                                        {doc.document_type}
                                                    </span>
                                                    <span>·</span>
                                                    <span>{formatBytes(doc.size_bytes)}</span>
                                                    <span>·</span>
                                                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <a
                                                href={`/api/alumni-documents/${doc.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                                title="Download file"
                                            >
                                                <Download className="size-3" />
                                                Download
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                disabled={deletingId === doc.id}
                                                className="rounded-lg p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50"
                                                title="Delete file"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-zinc-500 py-3 text-center rounded-xl border border-dashed border-zinc-200">
                                    No documents uploaded yet. Upload a copy of your diploma or credentials above.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* RA 10173 Accreditation Notice */}
                    <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-xs text-zinc-600">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck className="size-4 shrink-0 text-[#001c17] mt-0.5" />
                            <div>
                                <p className="font-semibold text-zinc-900">
                                    Official Credentials Safeguard
                                </p>
                                <p className="mt-0.5 text-[11px] text-zinc-500 leading-relaxed">
                                    All uploaded documents and academic records are stored in private encrypted storage adhering to the Data Privacy Act of 2012 (RA 10173) and CHED accreditation reporting guidelines.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AlumniProfileCompletionModal({
    isOpen,
    onClose,
    profile,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    profile?: AlumniProfile | null;
    onSuccess?: () => void;
}) {
    const [preferredName, setPreferredName] = useState('');
    const [gender, setGender] = useState('');
    const [civilStatus, setCivilStatus] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');
    const [permanentAddress, setPermanentAddress] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setPreferredName(profile.preferred_name ?? '');
            setGender(profile.gender ?? '');
            setCivilStatus(profile.civil_status ?? '');
            setContactNumber(profile.contact_number ?? '');
            setCurrentAddress(profile.current_address ?? '');
            setPermanentAddress(profile.permanent_address ?? '');
        }
    }, [profile, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const copyAddress = () => {
        setPermanentAddress(currentAddress);
        toast.info('Permanent address set to match current address.');
    };

    async function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!profile?.id) {
            toast.error('No linked alumni profile found.');
            return;
        }

        if (!gender.trim() || !civilStatus.trim() || !contactNumber.trim() || !currentAddress.trim() || !permanentAddress.trim()) {
            toast.error('All profile completion fields (gender, civil status, contact number, current address, and permanent address) are required.');
            return;
        }

        setSaving(true);
        try {
            await apiRequest<ApiEnvelope<AlumniProfile>>(`/api/alumni/${profile.id}`, {
                method: 'PATCH',
                body: {
                    preferred_name: preferredName.trim() || null,
                    gender: gender.trim(),
                    civil_status: civilStatus.trim(),
                    contact_number: contactNumber.trim(),
                    current_address: currentAddress.trim(),
                    permanent_address: permanentAddress.trim(),
                },
            });

            toast.success('Alumni profile updated successfully! All alumni services are now unlocked.');
            onSuccess?.();
            onClose();
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Complete Alumni Profile"
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-[#E47818]">
                            <Pencil className="size-5" />
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-zinc-900">
                                Complete Alumni Profile
                            </h2>
                            <p className="text-xs text-zinc-500">
                                Required information to participate in surveys, apply for jobs, and access portal features
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-xs text-amber-950">
                        <p className="font-semibold flex items-center gap-1.5">
                            <ShieldCheck className="size-4 text-[#E47818]" />
                            Institutional Profile Completion
                        </p>
                        <p className="mt-1 text-[11px] text-amber-900/80 leading-relaxed">
                            To ensure CHED GTS accuracy and maintain verified employer job applications, alumni must complete their gender, civil status, contact number, current address, and permanent address.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Gender */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-800">
                                Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="mt-1.5 h-10 w-full rounded-xl border border-zinc-300 px-3 text-xs text-zinc-900 bg-white focus:border-[#E47818] focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/20"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>

                        {/* Civil Status */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-800">
                                Civil Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={civilStatus}
                                onChange={(e) => setCivilStatus(e.target.value)}
                                className="mt-1.5 h-10 w-full rounded-xl border border-zinc-300 px-3 text-xs text-zinc-900 bg-white focus:border-[#E47818] focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/20"
                            >
                                <option value="">Select Civil Status</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Widowed">Widowed</option>
                                <option value="Separated">Separated</option>
                                <option value="Divorced">Divorced</option>
                            </select>
                        </div>
                    </div>

                    {/* Contact Number */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-800">
                            Contact Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            required
                            placeholder="e.g. +63 912 345 6789 or 09123456789"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            className="mt-1.5 h-10 w-full rounded-xl border border-zinc-300 px-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#E47818] focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/20"
                        />
                    </div>

                    {/* Current Address */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-800">
                            Current Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={2}
                            placeholder="Street, Barangay, City/Municipality, Province"
                            value={currentAddress}
                            onChange={(e) => setCurrentAddress(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#E47818] focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/20"
                        />
                    </div>

                    {/* Permanent Address */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-zinc-800">
                                Permanent Address <span className="text-red-500">*</span>
                            </label>
                            {currentAddress.trim() && (
                                <button
                                    type="button"
                                    onClick={copyAddress}
                                    className="text-[11px] font-semibold text-[#E47818] hover:underline cursor-pointer"
                                >
                                    Same as Current Address
                                </button>
                            )}
                        </div>
                        <textarea
                            required
                            rows={2}
                            placeholder="Street, Barangay, City/Municipality, Province"
                            value={permanentAddress}
                            onChange={(e) => setPermanentAddress(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#E47818] focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/20"
                        />
                    </div>

                    {/* Preferred Display Name */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-800">
                            Preferred Display Name / Community Handle (Optional)
                        </label>
                        <input
                            type="text"
                            maxLength={100}
                            placeholder={`e.g. ${profile?.first_name || 'Nickname'}`}
                            value={preferredName}
                            onChange={(e) => setPreferredName(e.target.value)}
                            className="mt-1.5 h-10 w-full rounded-xl border border-zinc-300 px-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#E47818] focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/20"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-9 rounded-xl bg-[#E47818] px-5 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] transition disabled:opacity-60 cursor-pointer"
                        >
                            {saving ? 'Saving…' : 'Save Profile Information'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function AlumniProfileSummary({
    editOpen,
    onCloseEdit,
    userAvatar,
    onNavigate,
}: {
    editOpen: boolean;
    onCloseEdit: () => void;
    userAvatar?: string | null;
    onNavigate?: (page: string) => void;
}) {
    const { data, loading, error, reload } =
        useApiResource<ApiEnvelope<AlumniProfile>>('/api/me/alumni');
    const profile = data?.data;
    const [preferredName, setPreferredName] = useState('');
    const [saving, setSaving] = useState(false);
    const [isLocalEditOpen, setIsLocalEditOpen] = useState(false);

    const isModalOpen = editOpen || isLocalEditOpen;

    const handleCloseModal = () => {
        setIsLocalEditOpen(false);
        onCloseEdit();
    };

    useEffect(() => {
        setPreferredName(profile?.preferred_name ?? '');
    }, [profile?.preferred_name]);

    useEffect(() => {
        if (!isModalOpen) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handleCloseModal();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isModalOpen]);

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
                    body: { preferred_name: preferredName.trim() || null },
                },
            );
            reload();
            handleCloseModal();
            toast.success('Preferred display name updated successfully.');
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

    const primaryEducation = profile.education_records?.[0];
    const latestEmployment = profile.employment_records?.[0];
    const fullName = profile.first_name
        ? `${profile.first_name} ${profile.middle_name ? `${profile.middle_name} ` : ''}${profile.last_name}${profile.suffix ? ` ${profile.suffix}` : ''}`
        : profile.name;

    return (
        <div className="space-y-6">
            {/* Hero Header Card */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001c17] via-[#052d26] to-[#0b382f] p-6 text-white shadow-lg sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[#E47818]/15 blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative size-20 shrink-0">
                            <Avatar className="size-20 overflow-hidden rounded-2xl ring-4 ring-white/20 shadow-md">
                                <AvatarImage
                                    src={profile.avatar ?? userAvatar ?? undefined}
                                    alt={fullName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="rounded-2xl bg-[#001c17] text-xl font-bold text-white border border-white/20">
                                    {initials(fullName)}
                                </AvatarFallback>
                            </Avatar>
                            <span
                                title="Verified Graduate"
                                className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#E47818] text-white shadow-sm ring-2 ring-[#001c17]"
                            >
                                <CheckCircle2 className="size-3.5" />
                            </span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                    {fullName}
                                </h1>
                                {profile.preferred_name && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-200 border border-amber-400/30">
                                        <Sparkles className="size-3" />
                                        Prefers: &quot;{profile.preferred_name}&quot;
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-emerald-100/80">
                                {[
                                    primaryEducation?.program,
                                    primaryEducation?.graduation_year
                                        ? `Batch ${primaryEducation.graduation_year}`
                                        : null,
                                    primaryEducation?.student_number
                                        ? `SN: ${primaryEducation.student_number}`
                                        : null,
                                ]
                                    .filter(Boolean)
                                    .join(' · ') || 'Verified SEAIT Graduate'}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-medium text-emerald-200 border border-emerald-500/30">
                                    <ShieldCheck className="size-3" />
                                    Verified Alumni
                                </span>
                                {profile.is_claimed && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-white/90 border border-white/10">
                                        Claimed{' '}
                                        {profile.claimed_at
                                            ? `· ${new Date(profile.claimed_at).toLocaleDateString()}`
                                            : ''}
                                    </span>
                                )}
                                {profile.is_complete ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-medium text-emerald-200 border border-emerald-500/30">
                                        <CheckCircle2 className="size-3" />
                                        Profile Complete
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/30 px-2.5 py-0.5 font-semibold text-amber-200 border border-amber-400/40">
                                        <AlertCircle className="size-3" />
                                        Profile Incomplete
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 font-medium text-amber-200 border border-amber-500/30">
                                    CHED GTS Tracer
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
                        <button
                            type="button"
                            onClick={() => setIsLocalEditOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#E47818] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#c96611] focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/60 cursor-pointer"
                        >
                            <Pencil className="size-3.5" />
                            Edit Profile
                        </button>
                        {onNavigate && (
                            <button
                                type="button"
                                onClick={() => onNavigate('Employment tracer')}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 focus:outline-hidden focus:ring-2 focus:ring-white/40 cursor-pointer"
                            >
                                <Briefcase className="size-3.5" />
                                Update Tracer Status
                            </button>
                        )}
                        <Link
                            href="/settings/profile"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-medium text-white/90 backdrop-blur-xs transition hover:bg-white/20 focus:outline-hidden focus:ring-2 focus:ring-white/40"
                            title="Account settings & photo"
                        >
                            <Settings className="size-3.5" />
                            Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Profile Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Academic Credentials Card */}
                <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#001c17]">
                                <GraduationCap className="size-4.5" />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-[#001c17]">
                                    Academic Qualifications
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Degrees conferred by South East Asian Institute of Technology, Inc.
                                </p>
                            </div>
                        </div>
                        {onNavigate && (
                            <button
                                type="button"
                                onClick={() => onNavigate('Academic records')}
                                className="text-xs font-medium text-[#E47818] hover:text-[#c96611] inline-flex items-center gap-1 cursor-pointer"
                            >
                                View all records <ArrowRight className="size-3" />
                            </button>
                        )}
                    </div>

                    <div className="mt-4 space-y-3">
                        {profile.education_records && profile.education_records.length > 0 ? (
                            profile.education_records.map((record) => (
                                <div
                                    key={record.id}
                                    className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 transition hover:border-zinc-200"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-semibold text-zinc-900">
                                                {record.program ?? 'Degree Program'}
                                            </h3>
                                            {record.degree && (
                                                <p className="text-xs text-zinc-600 font-medium">
                                                    {record.degree}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {record.graduation_year && (
                                                <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-800">
                                                    Class of {record.graduation_year}
                                                </span>
                                            )}
                                            {record.honors && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 border border-amber-200">
                                                    <Award className="size-3" />
                                                    {record.honors}
                                                </span>
                                            )}
                                            {record.gwa && (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 border border-emerald-200">
                                                    GWA {record.gwa}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-zinc-500 font-mono">
                                        Student ID:{' '}
                                        <span className="font-semibold text-zinc-700">
                                            {record.student_number}
                                        </span>
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-500">
                                No academic records linked to this verified profile.
                            </div>
                        )}
                    </div>
                </section>

                {/* CHED GTS Tracer Career Status Card */}
                <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-[#E47818]">
                                <Briefcase className="size-4.5" />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-[#001c17]">
                                    CHED Graduate Tracer Study
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Current career outcome & curriculum alignment
                                </p>
                            </div>
                        </div>
                        {onNavigate && (
                            <button
                                type="button"
                                onClick={() => onNavigate('Employment tracer')}
                                className="text-xs font-medium text-[#E47818] hover:text-[#c96611] inline-flex items-center gap-1 cursor-pointer"
                            >
                                Report update <ArrowRight className="size-3" />
                            </button>
                        )}
                    </div>

                    <div className="mt-4">
                        {latestEmployment ? (
                            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                                            {latestEmployment.status ?? 'Employed'}
                                        </span>
                                        <h3 className="mt-1.5 text-sm font-bold text-zinc-900">
                                            {latestEmployment.job_title ?? 'Professional Role'}
                                        </h3>
                                        <p className="text-xs text-zinc-600 font-medium">
                                            {[latestEmployment.employer_name, latestEmployment.industry]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                        {latestEmployment.work_location && (
                                            <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
                                                <MapPin className="size-3" />{' '}
                                                {latestEmployment.work_location}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        {latestEmployment.is_related_to_degree !== undefined && (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${latestEmployment.is_related_to_degree
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                                    }`}
                                            >
                                                <CheckCircle2 className="size-3" />
                                                {latestEmployment.is_related_to_degree
                                                    ? 'Degree-aligned'
                                                    : 'Non-aligned'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-3 text-[11px] text-zinc-400">
                                    Reported on{' '}
                                    {new Date(latestEmployment.reported_at).toLocaleDateString()}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-amber-200/80 bg-amber-50/40 p-5 text-center">
                                <p className="text-xs font-medium text-amber-900">
                                    No employment update reported yet.
                                </p>
                                <p className="mt-1 text-[11px] text-amber-700/80">
                                    Participating in the CHED Graduate Tracer Study helps SEAIT maintain institutional accreditation and curriculum excellence.
                                </p>
                                {onNavigate && (
                                    <button
                                        type="button"
                                        onClick={() => onNavigate('Employment tracer')}
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#E47818] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] cursor-pointer"
                                    >
                                        <Briefcase className="size-3" />
                                        Submit Employment Update
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Verified Institutional Identity Details Card */}
                <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
                                <Lock className="size-4.5" />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-[#001c17]">
                                    Registrar-Verified Credentials
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Civil identity and institutional records
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsLocalEditOpen(true)}
                            className="text-xs font-semibold text-[#E47818] hover:text-[#c96611] inline-flex items-center gap-1 cursor-pointer"
                        >
                            <Pencil className="size-3" /> Edit preferred name
                        </button>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {[
                            ['Full Legal Name', fullName],
                            [
                                'Preferred Display Name',
                                profile.preferred_name || '— (Using legal name)',
                            ],
                            ['Registered Email', profile.email],
                            ['Date of Birth', profile.date_of_birth],
                            [
                                'Gender',
                                profile.gender || 'Not specified (Required)',
                            ],
                            [
                                'Civil Status',
                                profile.civil_status || 'Not specified (Required)',
                            ],
                            [
                                'Contact Number',
                                profile.contact_number || 'Not specified (Required)',
                            ],
                            [
                                'Current Address',
                                profile.current_address || 'Not specified (Required)',
                            ],
                            [
                                'Permanent Address',
                                profile.permanent_address || 'Not specified (Required)',
                            ],
                            [
                                'Primary Student Number',
                                primaryEducation?.student_number ?? 'Not recorded',
                            ],
                            ['Record Status', profile.profile_status],
                            [
                                'Profile Completion',
                                profile.is_complete ? 'Complete (All Services Unlocked)' : 'Incomplete (Interaction Restricted)',
                            ],
                        ].map(([label, val]) => (
                            <div
                                key={label}
                                className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3"
                            >
                                <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                    {label}
                                </dt>
                                <dd className="mt-1 font-semibold text-zinc-800 break-words">
                                    {val}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    <div className="mt-4 rounded-2xl border border-zinc-200/60 bg-zinc-50 p-4 text-xs text-zinc-600">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck className="size-4 shrink-0 text-[#001c17] mt-0.5" />
                            <div>
                                <p className="font-semibold text-zinc-900">
                                    Official Registrar Data Protection
                                </p>
                                <p className="mt-0.5 text-[11px] text-zinc-500 leading-relaxed">
                                    To ensure compliance with CHED Memo Orders and institutional graduation registries, legal names and birthdates are verified by the Registrar and cannot be directly overwritten.
                                </p>
                                <Link
                                    href="/alumni/registration-assistance"
                                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#E47818] hover:underline"
                                >
                                    Request Registrar Record Correction{' '}
                                    <ArrowRight className="size-2.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Privacy & Account Management Card */}
                <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#001c17]">
                                <ShieldCheck className="size-4.5" />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-[#001c17]">
                                    Privacy & Account Management
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Data protection under RA 10173 and portal security
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3 text-xs text-zinc-600">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                                <p className="font-semibold text-emerald-950 flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                                    Data Privacy Act of 2012 (RA 10173) Compliant
                                </p>
                                <p className="mt-1 text-[11px] text-emerald-900/80 leading-relaxed">
                                    Your tracer survey responses and career outcomes are securely processed, encrypted at rest, and aggregated for CHED institutional quality assurance.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                                <p className="font-semibold text-zinc-900">
                                    Profile Photo & Credentials
                                </p>
                                <p className="mt-0.5 text-[11px] text-zinc-500 leading-relaxed">
                                    Your profile avatar, password, and two-factor authentication can be updated in your Account Settings.
                                </p>
                                <Link
                                    href="/settings/profile"
                                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[#001c17] hover:text-[#0b382f] underline underline-offset-2"
                                >
                                    Go to Account & Security Settings{' '}
                                    <ExternalLink className="size-3" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                        <span>SEAIT Alumni Tracer Management System</span>
                        <span>CHED GTS Ready</span>
                    </div>
                </section>
            </div>

            {/* Complete / Edit Profile Modal Dialog */}
            <AlumniProfileCompletionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                profile={profile}
                onSuccess={reload}
            />
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
    ended_on: string;
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
    ended_on: '',
    is_related_to_degree: true,
};

const standardEmploymentTypes = [
    'Regular / Permanent',
    'Probationary',
    'Contractual / Project-Based',
    'Part-Time',
    'Self-Employed / Business Owner',
    'Freelance / Consultant',
    'Government / Plantilla',
    'Internship / OJT',
];

const standardIndustries = [
    'Information Technology & Software',
    'Education, Training & Academia',
    'Healthcare & Allied Medicine',
    'Government & Civil Service',
    'Banking, Finance & Insurance',
    'Business Process Outsourcing (BPO)',
    'Engineering, Construction & Architecture',
    'Agriculture, Farming & Agribusiness',
    'Hospitality, Tourism & Food Service',
    'Media, Creative Arts & Entertainment',
    'Manufacturing & Heavy Industry',
    'Retail, Trade & Logistics',
    'Non-Profit & Community Development',
    'Other Industry',
];

export function EmploymentTracer({
    createOpen,
    onCloseCreate,
}: {
    createOpen?: boolean;
    onCloseCreate?: () => void;
} = {}) {
    const profileResource =
        useApiResource<ApiEnvelope<AlumniProfile>>('/api/me/alumni');
    const alumniProfile = profileResource.data?.data;
    const isProfileComplete = Boolean(alumniProfile?.is_complete);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const statusesResource = useApiResource<ApiEnvelope<EmploymentStatus[]>>(
        '/api/employment-statuses',
    );
    const profileId = profileResource.data?.data.id;
    const historyResource = useApiResource<ApiEnvelope<EmploymentRecord[]>>(
        profileId ? `/api/alumni/${profileId}/employment` : null,
    );
    const [form, setForm] = useState(emptyEmploymentForm);
    const [isCurrentRole, setIsCurrentRole] = useState(true);
    const [saving, setSaving] = useState(false);
    const [localFormOpen, setLocalFormOpen] = useState(false);

    const isModalOpen = Boolean(createOpen || localFormOpen);

    const handleCloseModal = () => {
        setLocalFormOpen(false);
        onCloseCreate?.();
    };

    useEffect(() => {
        if (!isModalOpen) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handleCloseModal();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isModalOpen]);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!profileId) {
            toast.error('An alumni profile is required to report employment.');
            return;
        }

        if (!isProfileComplete) {
            toast.error(
                'Please complete your profile (gender, civil status, contact number, current address, and permanent address) before reporting employment tracer updates.',
            );
            handleCloseModal();
            setProfileModalOpen(true);
            return;
        }

        setSaving(true);
        try {
            await apiRequest<ApiEnvelope<EmploymentRecord>>(
                `/api/alumni/${profileId}/employment`,
                {
                    method: 'POST',
                    body: {
                        employment_status_id: Number(form.employment_status_id),
                        employer_name: form.employer_name || null,
                        job_title: form.job_title || null,
                        industry: form.industry || null,
                        employment_type: form.employment_type || null,
                        work_location: form.work_location || null,
                        started_on: form.started_on || null,
                        ended_on: isCurrentRole ? null : (form.ended_on || null),
                        is_related_to_degree: form.is_related_to_degree,
                    },
                },
            );
            setForm(emptyEmploymentForm);
            setIsCurrentRole(true);
            historyResource.reload();
            profileResource.reload();
            handleCloseModal();
            toast.success('CHED Graduate Tracer milestone submitted successfully.');
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
    const latestRecord = records[0];
    const degreeRelatedCount = records.filter((r) => r.is_related_to_degree).length;
    const degreeRelatedPercent =
        records.length > 0
            ? Math.round((degreeRelatedCount / records.length) * 100)
            : null;

    return (
        <div className="space-y-6">
            {/* Tracer Hero Header */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001c17] via-[#052d26] to-[#0b382f] p-6 text-white shadow-lg sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[#E47818]/15 blur-3xl" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/20 text-[#E47818]">
                            <Briefcase className="size-8" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                    Graduate Tracer Study (GTS)
                                </h1>
                                <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-200 border border-amber-400/30">
                                    CHED CMO Monitoring
                                </span>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-emerald-100/80">
                                Report career milestones, industry alignment, and employment outcomes for institutional accreditation.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setLocalFormOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#E47818] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#c96611] focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/60 cursor-pointer self-start lg:self-center"
                    >
                        <Plus className="size-4" />
                        Report Career Milestone
                    </button>
                </div>
            </section>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                        <Briefcase className="size-3.5 text-[#E47818]" />
                        Current Status
                    </div>
                    <p className="mt-2 text-base font-bold text-zinc-900 truncate">
                        {latestRecord?.status.label ?? 'Not reported'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                        Active tracer state
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                        <Building2 className="size-3.5 text-emerald-600" />
                        Current Employer
                    </div>
                    <p className="mt-2 text-base font-bold text-zinc-900 truncate">
                        {latestRecord?.employer_name ?? '—'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500 truncate">
                        {latestRecord?.job_title ?? 'Position not set'}
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Degree Alignment
                    </div>
                    <p className="mt-2 text-base font-bold text-zinc-900">
                        {degreeRelatedPercent !== null
                            ? `${degreeRelatedPercent}% Aligned`
                            : 'Pending Report'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                        Curriculum relevance
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                        <TrendingUp className="size-3.5 text-[#E47818]" />
                        Career History
                    </div>
                    <p className="mt-2 text-base font-bold text-zinc-900">
                        {records.length} {records.length === 1 ? 'Milestone' : 'Milestones'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                        Reported updates
                    </p>
                </div>
            </div>

            {/* Employment History & Career Timeline */}
            <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#001c17]">
                            <Briefcase className="size-4.5" />
                        </span>
                        <div>
                            <h2 className="text-sm font-bold text-[#001c17]">
                                Career Progression Timeline
                            </h2>
                            <p className="text-xs text-zinc-500">
                                History of employment updates reported for the CHED Graduate Tracer Study
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setLocalFormOpen(true)}
                        className="text-xs font-semibold text-[#E47818] hover:text-[#c96611] inline-flex items-center gap-1 cursor-pointer"
                    >
                        <Plus className="size-3" /> Add milestone
                    </button>
                </div>

                {historyResource.loading ? (
                    <p className="py-8 text-center text-xs text-zinc-500">
                        Loading employment history…
                    </p>
                ) : historyResource.error ? (
                    <p role="alert" className="py-6 text-xs text-red-600">
                        {historyResource.error}
                    </p>
                ) : records.length > 0 ? (
                    <div className="mt-6 space-y-4">
                        {records.map((record, index) => {
                            const isCurrent = !record.ended_on && index === 0;
                            return (
                                <article
                                    key={record.id}
                                    className="relative rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-5 transition hover:border-[#E47818]/40"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#001c17] text-white">
                                                <Building2 className="size-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-bold text-zinc-900">
                                                        {record.job_title ?? record.status.label}
                                                    </h3>
                                                    {isCurrent && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            Current Position
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-semibold text-zinc-700 mt-0.5">
                                                    {[record.employer_name, record.industry]
                                                        .filter(Boolean)
                                                        .join(' · ') || record.status.label}
                                                </p>
                                                {record.work_location && (
                                                    <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                                                        <MapPin className="size-3" />
                                                        {record.work_location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <span className="rounded-full bg-zinc-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-800">
                                                {record.status.label}
                                            </span>
                                            {record.is_related_to_degree !== undefined && (
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${record.is_related_to_degree
                                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                                        }`}
                                                >
                                                    <CheckCircle2 className="size-3" />
                                                    {record.is_related_to_degree
                                                        ? 'Degree-Aligned'
                                                        : 'Non-Aligned'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200/60 pt-3 text-[11px] text-zinc-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-3.5 text-zinc-400" />
                                            <span>
                                                {record.started_on ?? 'Start date not recorded'}{' '}
                                                — {record.ended_on ? record.ended_on : 'Present'}
                                            </span>
                                            {record.employment_type && (
                                                <>
                                                    <span>·</span>
                                                    <span className="font-medium text-zinc-700">
                                                        {record.employment_type}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-zinc-400">
                                            Reported on {new Date(record.reported_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 p-8 text-center">
                        <Briefcase className="size-8 mx-auto text-zinc-300" />
                        <p className="mt-2 text-xs font-semibold text-zinc-700">
                            No employment updates reported yet.
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500 max-w-md mx-auto">
                            Sharing your career status helps SEAIT track alumni employability, benchmark curricula with CHED guidelines, and assist younger batches.
                        </p>
                        <button
                            type="button"
                            onClick={() => setLocalFormOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#E47818] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            Submit First Career Update
                        </button>
                    </div>
                )}
            </section>

            {/* Career Update Form Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={handleCloseModal}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Report Career Milestone"
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
                            <div className="flex items-center gap-3">
                                <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-[#E47818]">
                                    <Briefcase className="size-5" />
                                </span>
                                <div>
                                    <h2 className="text-base font-bold text-zinc-900">
                                        Report Career Milestone
                                    </h2>
                                    <p className="text-xs text-zinc-500">
                                        CHED Graduate Tracer Study Submission
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                aria-label="Close dialog"
                                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="mt-5 space-y-4">
                            {/* Employment Status */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800">
                                    Employment Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={form.employment_status_id}
                                    onChange={(e) =>
                                        setForm({ ...form, employment_status_id: e.target.value })
                                    }
                                    className="mt-1 h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-xs text-zinc-800 focus:border-[#E47818] focus:outline-hidden"
                                >
                                    <option value="">Select current employment status</option>
                                    {statusesResource.data?.data.map((status) => (
                                        <option key={status.id} value={status.id}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Job Title & Employer */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800">
                                        Job Position / Title
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Software Engineer, Teacher"
                                        value={form.job_title}
                                        onChange={(e) =>
                                            setForm({ ...form, job_title: e.target.value })
                                        }
                                        className="mt-1 h-10 w-full rounded-xl border border-zinc-300 px-3 text-xs text-zinc-800 focus:border-[#E47818] focus:outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800">
                                        Employer / Company Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. SEAIT, Tech Solutions, DepEd"
                                        value={form.employer_name}
                                        onChange={(e) =>
                                            setForm({ ...form, employer_name: e.target.value })
                                        }
                                        className="mt-1 h-10 w-full rounded-xl border border-zinc-300 px-3 text-xs text-zinc-800 focus:border-[#E47818] focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Employment Type & Industry */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800">
                                        Employment Type
                                    </label>
                                    <select
                                        value={form.employment_type}
                                        onChange={(e) =>
                                            setForm({ ...form, employment_type: e.target.value })
                                        }
                                        className="mt-1 h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-xs text-zinc-800 focus:border-[#E47818] focus:outline-hidden"
                                    >
                                        <option value="">Select employment type</option>
                                        {standardEmploymentTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800">
                                        Industry Sector
                                    </label>
                                    <select
                                        value={form.industry}
                                        onChange={(e) =>
                                            setForm({ ...form, industry: e.target.value })
                                        }
                                        className="mt-1 h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-xs text-zinc-800 focus:border-[#E47818] focus:outline-hidden"
                                    >
                                        <option value="">Select industry category</option>
                                        {standardIndustries.map((ind) => (
                                            <option key={ind} value={ind}>
                                                {ind}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Work Location */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800">
                                    Work Location (City, Province, or Country)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Koronadal City, South Cotabato / Remote / Dubai"
                                    value={form.work_location}
                                    onChange={(e) =>
                                        setForm({ ...form, work_location: e.target.value })
                                    }
                                    className="mt-1 h-10 w-full rounded-xl border border-zinc-300 px-3 text-xs text-zinc-800 focus:border-[#E47818] focus:outline-hidden"
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.started_on}
                                        onChange={(e) =>
                                            setForm({ ...form, started_on: e.target.value })
                                        }
                                        className="mt-1 h-10 w-full rounded-xl border border-zinc-300 px-3 text-xs text-zinc-800 focus:border-[#E47818] focus:outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        disabled={isCurrentRole}
                                        value={isCurrentRole ? '' : form.ended_on}
                                        onChange={(e) =>
                                            setForm({ ...form, ended_on: e.target.value })
                                        }
                                        placeholder={isCurrentRole ? 'Present' : ''}
                                        className="mt-1 h-10 w-full rounded-xl border border-zinc-300 px-3 text-xs text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 focus:border-[#E47818] focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Current Role Toggle */}
                            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isCurrentRole}
                                    onChange={(e) => {
                                        setIsCurrentRole(e.target.checked);
                                        if (e.target.checked) {
                                            setForm({ ...form, ended_on: '' });
                                        }
                                    }}
                                    className="size-4 rounded border-zinc-300 text-[#001c17] focus:ring-[#E47818]"
                                />
                                <span>I currently work in this position</span>
                            </label>

                            {/* Degree Alignment Checkbox */}
                            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5">
                                <label className="flex items-start gap-2.5 text-xs font-semibold text-emerald-950 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.is_related_to_degree}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                is_related_to_degree: e.target.checked,
                                            })
                                        }
                                        className="mt-0.5 size-4 rounded border-emerald-300 text-emerald-700 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <span>This position is related to my college degree / field of study</span>
                                        <p className="mt-0.5 text-[11px] font-normal text-emerald-800/80 leading-relaxed">
                                            Tracking curriculum alignment directly supports SEAIT&#39;s Commission on Higher Education (CHED) institutional accreditation rating.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="h-9 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-9 rounded-xl bg-[#E47818] px-5 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] transition disabled:opacity-60 cursor-pointer"
                                >
                                    {saving ? 'Saving…' : 'Submit Career Milestone'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Complete Profile Modal Dialog */}
            <AlumniProfileCompletionModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                profile={alumniProfile}
                onSuccess={() => profileResource.reload()}
            />
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
                    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
                        <label className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#667166] sm:justify-start">
                            <span>Date from</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-8 rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                            />
                        </label>
                        <label className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#667166] sm:justify-start">
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
                                            className="grid grid-cols-[100px_1fr_56px] items-center gap-2 text-xs sm:grid-cols-[160px_1fr_80px] sm:gap-3"
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
                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${active
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
                                            className={`px-4 py-3 ${col.align === 'right'
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
                                                    className={`px-4 py-3 text-[#414e43] ${col.align === 'right'
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
    avatar?: string | null;
    roles: string[];
    assigned_program_ids?: number[];
    assigned_programs?: Array<{
        id: number;
        code: string;
        name: string;
    }>;
    alumni_profile_id?: number | null;
    is_verified?: boolean;
    is_suspended: boolean;
    created_at?: string | null;
};

type AdminRoleCatalogItem = {
    id: number;
    name: string;
    label: string;
    permissions: string[];
};

type AdminPermissionCatalogItem = {
    id: number;
    name: string;
    label: string;
};

type AdminProgramCatalogItem = {
    id: number;
    department_id: number;
    code: string;
    name: string;
};

type AdminUsersResponse = {
    data: UserRoleAssignment[];
    meta?: {
        roles_catalog?: AdminRoleCatalogItem[];
        permissions_catalog?: AdminPermissionCatalogItem[];
        programs_catalog?: AdminProgramCatalogItem[];
    };
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
    const { data, loading, error, reload } =
        useApiResource<AdminUsersResponse>(
            isSystemAdmin ? '/api/admin/users' : null,
        );
    const [selectedRoles, setSelectedRoles] = useState<
        Record<number, string[]>
    >({});
    const [selectedPrograms, setSelectedPrograms] = useState<
        Record<number, number[]>
    >({});
    const [saving, setSaving] = useState<Record<number, boolean>>({});
    const [savingPrograms, setSavingPrograms] = useState<
        Record<number, boolean>
    >({});
    const [savingRolePermissions, setSavingRolePermissions] = useState<
        Record<number, boolean>
    >({});
    const [managing, setManaging] = useState<Record<number, boolean>>({});
    const [inviteOpen, setInviteOpen] = useState(false);
    const [permissionsMatrixOpen, setPermissionsMatrixOpen] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
        password: '',
        roles: [] as string[],
        assigned_program_ids: [] as number[],
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
        const nextSelectedPrograms = Object.fromEntries(
            data.data.map((user) => [
                user.id,
                [...(user.assigned_program_ids ?? [])],
            ]),
        );
        setSelectedRoles(nextSelectedRoles);
        setSelectedPrograms(nextSelectedPrograms);
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

    async function updateUserAssignedPrograms(
        userId: number,
        nextProgramIds: number[],
    ) {
        setSavingPrograms((current) => ({ ...current, [userId]: true }));
        try {
            await apiRequest<ApiEnvelope<UserRoleAssignment>>(
                `/api/admin/users/${userId}/programs`,
                {
                    method: 'PATCH',
                    body: { assigned_program_ids: nextProgramIds },
                },
            );
            setSelectedPrograms((current) => ({
                ...current,
                [userId]: nextProgramIds,
            }));
            reload();
            toast.success('Assigned academic programs updated.');
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'Assigned programs could not be updated.',
            );
        } finally {
            setSavingPrograms((current) => ({ ...current, [userId]: false }));
        }
    }

    async function toggleRolePermission(
        roleItem: AdminRoleCatalogItem,
        permissionName: string,
    ) {
        const nextPermissions = roleItem.permissions.includes(permissionName)
            ? roleItem.permissions.filter((p) => p !== permissionName)
            : [...roleItem.permissions, permissionName];

        setSavingRolePermissions((current) => ({
            ...current,
            [roleItem.id]: true,
        }));
        try {
            await apiRequest(`/api/admin/roles/${roleItem.id}/permissions`, {
                method: 'PATCH',
                body: { permissions: nextPermissions },
            });
            reload();
            toast.success(`Updated permissions for ${roleItem.label}.`);
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'Role permissions could not be updated.',
            );
        } finally {
            setSavingRolePermissions((current) => ({
                ...current,
                [roleItem.id]: false,
            }));
        }
    }

    async function inviteUser(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setInviting(true);

        try {
            const payload: Record<string, unknown> = {
                name: inviteForm.name,
                email: inviteForm.email,
                roles: inviteForm.roles,
            };
            if (inviteForm.password.trim()) {
                payload.password = inviteForm.password.trim();
            }
            if (
                inviteForm.roles.includes('department-coordinator') &&
                inviteForm.assigned_program_ids.length > 0
            ) {
                payload.assigned_program_ids = inviteForm.assigned_program_ids;
            }

            const response = await apiRequest<{
                data: UserRoleAssignment;
                message?: string;
            }>('/api/admin/users', {
                method: 'POST',
                body: payload,
            });
            setInviteForm({
                name: '',
                email: '',
                password: '',
                roles: [],
                assigned_program_ids: [],
            });
            setInviteOpen(false);
            reload();
            toast.success(response.message ?? 'Invitation sent.');
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
    const rolesCatalog = data?.meta?.roles_catalog ?? [];
    const permissionsCatalog = data?.meta?.permissions_catalog ?? [];
    const programsCatalog = data?.meta?.programs_catalog ?? [];

    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            !searchQuery.trim() ||
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole =
            roleFilter === 'all'
                ? true
                : roleFilter === 'suspended'
                    ? u.is_suspended
                    : u.roles.includes(roleFilter);
        return matchesSearch && matchesRole;
    });

    return (
        <section className="rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold tracking-tight text-[#29382e]">
                        Roles assigned to your account
                    </h2>
                    <p className="mt-0.5 text-xs text-[#7a8278]">
                        Active permissions and institutional scopes linked to
                        your credentials.
                    </p>
                </div>
                {isSystemAdmin && rolesCatalog.length > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            setPermissionsMatrixOpen((prev) => !prev)
                        }
                        className="rounded-full border border-[#d6dfd3] bg-[#f8faf7] px-3.5 py-1.5 text-[11px] font-semibold text-[#2f4f3e] transition hover:bg-[#edf2eb]"
                    >
                        {permissionsMatrixOpen
                            ? 'Hide Role Permissions Matrix'
                            : 'Configure Role Permissions'}
                    </button>
                )}
            </div>

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

            {/* Granular Role Permissions Matrix */}
            {isSystemAdmin && permissionsMatrixOpen && rolesCatalog.length > 0 && (
                <div className="mt-5 rounded-2xl border border-[#dfe5dd] bg-[#f9faf7] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="text-xs font-bold tracking-wider text-[#2b5139] uppercase">
                                Role Permissions Matrix
                            </h3>
                            <p className="mt-0.5 text-[11px] text-[#6b7669]">
                                Grant or restrict granular capabilities per role
                                (e.g., allowing Department Coordinators to edit
                                alumni records or manage surveys within their
                                assigned programs).
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {rolesCatalog
                            .filter(
                                (r) =>
                                    r.name === 'alumni-coordinator' ||
                                    r.name === 'department-coordinator',
                            )
                            .map((roleItem) => (
                                <div
                                    key={roleItem.id}
                                    className="rounded-xl border border-[#e3e8e0] bg-white p-3.5"
                                >
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-[#29382e]">
                                            {roleItem.label}
                                        </span>
                                        <span className="rounded-full bg-[#edf2eb] px-2 py-0.5 text-[10px] font-semibold text-[#2b5139]">
                                            {roleItem.permissions.length}{' '}
                                            permissions
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {permissionsCatalog.map((perm) => {
                                            const active =
                                                roleItem.permissions.includes(
                                                    perm.name,
                                                );
                                            return (
                                                <button
                                                    key={perm.name}
                                                    type="button"
                                                    disabled={
                                                        savingRolePermissions[
                                                        roleItem.id
                                                        ]
                                                    }
                                                    onClick={() =>
                                                        void toggleRolePermission(
                                                            roleItem,
                                                            perm.name,
                                                        )
                                                    }
                                                    title={perm.label}
                                                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${active
                                                        ? 'bg-[#2b5139] text-white'
                                                        : 'border border-[#dce2d9] bg-[#fafbf9] text-[#5c685d] hover:bg-[#eff2ed]'
                                                        }`}
                                                >
                                                    {perm.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {isSystemAdmin && (
                <div className="mt-6 space-y-5 border-t border-[#eff0ec] pt-5">
                    <DemoQuickLoginToggleCard />

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold tracking-tight text-[#29382e]">
                                User access & program scoping
                            </h3>
                            <p className="mt-0.5 text-xs text-[#7a8278]">
                                Assign institutional roles and academic program
                                scopes for Department Coordinators.
                            </p>
                        </div>
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

                    {/* Search & Role Filter Bar */}
                    <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users by name or email…"
                            className="h-9 w-full rounded-xl border border-[#dfe5dd] bg-[#fafbf9] px-3 text-xs text-[#29382e] outline-none focus:border-[#6d8b72] sm:max-w-xs"
                        />
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                ['all', 'All'],
                                ['system-administrator', 'Admins'],
                                ['alumni-coordinator', 'Alumni Coord.'],
                                ['department-coordinator', 'Dept. Coord.'],
                                ['alumni', 'Alumni'],
                                ['employer', 'Employers'],
                                ['suspended', 'Suspended'],
                            ].map(([code, label]) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => setRoleFilter(code)}
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${roleFilter === code
                                        ? 'bg-[#2b5139] text-white'
                                        : 'border border-[#e2e7df] bg-[#fafbf9] text-[#5e6a5f] hover:bg-[#eff2ed]'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {inviteOpen && (
                        <form
                            onSubmit={inviteUser}
                            className="mb-5 space-y-3.5 rounded-2xl border border-[#dfe5dd] bg-[#f9faf7] p-4"
                        >
                            <div className="grid gap-3 sm:grid-cols-3">
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
                                <label className="space-y-1.5 text-xs font-medium text-[#4d5a4f]">
                                    Initial password (optional)
                                    <input
                                        type="password"
                                        minLength={8}
                                        maxLength={255}
                                        value={inviteForm.password}
                                        onChange={(event) =>
                                            setInviteForm((form) => ({
                                                ...form,
                                                password: event.target.value,
                                            }))
                                        }
                                        placeholder="Leave blank to email setup link"
                                        className="w-full rounded-xl border border-[#dfe5dd] bg-white px-3 py-2 text-sm font-normal text-[#29382e] outline-none focus:border-[#6d8b72]"
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

                            {inviteForm.roles.includes(
                                'department-coordinator',
                            ) &&
                                programsCatalog.length > 0 && (
                                    <fieldset className="rounded-xl border border-[#e2e7df] bg-white p-3">
                                        <legend className="px-1 text-[11px] font-semibold text-[#2b5139]">
                                            Assigned Academic Programs
                                            (Department Coordinator Scope)
                                        </legend>
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {programsCatalog.map((prog) => {
                                                const active =
                                                    inviteForm.assigned_program_ids.includes(
                                                        prog.id,
                                                    );
                                                return (
                                                    <button
                                                        key={prog.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setInviteForm(
                                                                (form) => ({
                                                                    ...form,
                                                                    assigned_program_ids:
                                                                        active
                                                                            ? form.assigned_program_ids.filter(
                                                                                (
                                                                                    id,
                                                                                ) =>
                                                                                    id !==
                                                                                    prog.id,
                                                                            )
                                                                            : [
                                                                                ...form.assigned_program_ids,
                                                                                prog.id,
                                                                            ],
                                                                }),
                                                            )
                                                        }
                                                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${active
                                                            ? 'bg-[#2b5139] text-white'
                                                            : 'border border-[#dce2d9] bg-[#f9faf7] text-[#4d5a4f]'
                                                            }`}
                                                    >
                                                        {prog.code} ·{' '}
                                                        {prog.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </fieldset>
                                )}

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
                                    {inviting
                                        ? 'Saving…'
                                        : inviteForm.password.trim()
                                            ? 'Create user account'
                                            : 'Send invitation'}
                                </button>
                            </div>
                        </form>
                    )}

                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <ErrorState message={error} />
                    ) : filteredUsers.length ? (
                        <div className="space-y-4">
                            {filteredUsers.map((user) => {
                                const currentRoles =
                                    selectedRoles[user.id] ?? user.roles;
                                const currentProgramIds =
                                    selectedPrograms[user.id] ??
                                    user.assigned_program_ids ??
                                    [];
                                const isProtected = user.roles.includes(
                                    'system-administrator',
                                );
                                const canManage =
                                    !isProtected && user.id !== currentUserId;
                                const isDeptCoordinator =
                                    currentRoles.includes(
                                        'department-coordinator',
                                    );

                                return (
                                    <div
                                        key={user.id}
                                        className="rounded-2xl border border-[#e9ebe5] bg-[#f9faf7] p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-[#001c17]/10">
                                                    <AvatarImage
                                                        src={
                                                            user.avatar ??
                                                            undefined
                                                        }
                                                        alt={user.name}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback className="rounded-full bg-[#e9eee5] text-[11px] font-bold text-[#45634a]">
                                                        {initials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-semibold text-[#39463b]">
                                                            {user.name}
                                                        </p>
                                                        {user.is_verified && (
                                                            <span className="rounded-full bg-[#e6efe4] px-2 py-0.5 text-[10px] font-semibold text-[#2b5139]">
                                                                Verified
                                                            </span>
                                                        )}
                                                        {user.alumni_profile_id && (
                                                            <span className="rounded-full bg-[#eef2ec] px-2 py-0.5 text-[10px] font-medium text-[#4d6250]">
                                                                Claimed Alumni #
                                                                {
                                                                    user.alumni_profile_id
                                                                }
                                                            </span>
                                                        )}
                                                        {user.is_suspended && (
                                                            <span className="rounded-full bg-[#f7e9e5] px-2.5 py-0.5 text-[10px] font-semibold text-[#8b4e43]">
                                                                Suspended
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-[#7a8278]">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-medium tracking-[0.14em] text-[#6d7d6a] uppercase">
                                                {currentRoles.length
                                                    ? currentRoles.length
                                                    : 0}{' '}
                                                roles
                                            </span>
                                        </div>

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

                                        {/* Assigned Academic Programs for Department Coordinators */}
                                        {isDeptCoordinator &&
                                            programsCatalog.length > 0 && (
                                                <div className="mt-3.5 rounded-xl border border-[#e2e7df] bg-white p-3">
                                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-[11px] font-semibold text-[#2b5139]">
                                                            Assigned Academic
                                                            Programs (
                                                            {
                                                                currentProgramIds.length
                                                            }{' '}
                                                            selected)
                                                        </span>
                                                        {currentProgramIds.length ===
                                                            0 && (
                                                                <span className="rounded bg-[#fdf4e7] px-2 py-0.5 text-[10px] font-semibold text-[#9a6728]">
                                                                    No programs
                                                                    assigned —
                                                                    select programs
                                                                    to grant record
                                                                    access
                                                                </span>
                                                            )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {programsCatalog.map(
                                                            (prog) => {
                                                                const active =
                                                                    currentProgramIds.includes(
                                                                        prog.id,
                                                                    );
                                                                return (
                                                                    <button
                                                                        key={
                                                                            prog.id
                                                                        }
                                                                        type="button"
                                                                        disabled={
                                                                            savingPrograms[
                                                                            user
                                                                                .id
                                                                            ]
                                                                        }
                                                                        onClick={() => {
                                                                            const nextIds =
                                                                                active
                                                                                    ? currentProgramIds.filter(
                                                                                        (
                                                                                            id,
                                                                                        ) =>
                                                                                            id !==
                                                                                            prog.id,
                                                                                    )
                                                                                    : [
                                                                                        ...currentProgramIds,
                                                                                        prog.id,
                                                                                    ];
                                                                            void updateUserAssignedPrograms(
                                                                                user.id,
                                                                                nextIds,
                                                                            );
                                                                        }}
                                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${active
                                                                            ? 'bg-[#2b5139] text-white'
                                                                            : 'border border-[#dce2d9] bg-[#f9faf7] text-[#536055] hover:bg-[#edf2eb]'
                                                                            }`}
                                                                    >
                                                                        {
                                                                            prog.code
                                                                        }{' '}
                                                                        ·{' '}
                                                                        {
                                                                            prog.name
                                                                        }
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                    </div>
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
                            No users match your current filter.
                        </EmptyState>
                    )}
                </div>
            )}

            <p className="mt-4 text-xs leading-5 text-[#7a8278]">
                Role and permission changes are managed by an administrator and
                recorded in the system activity log.
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
    const programsRes =
        useApiResource<ApiEnvelope<AcademicProgram[]>>('/api/programs');
    const departmentsRes =
        useApiResource<ApiEnvelope<AcademicDepartment[]>>('/api/departments');

    const [viewMode, setViewMode] = useState<'modular' | 'grid'>('modular');
    const [selectedDepartmentFilter, setSelectedDepartmentFilter] =
        useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Department Form State (Create / Edit)
    const [departmentFormOpen, setDepartmentFormOpen] = useState(false);
    const [editingDepartmentId, setEditingDepartmentId] = useState<
        number | null
    >(null);
    const [departmentForm, setDepartmentForm] = useState({
        code: '',
        name: '',
        description: '',
    });
    const [departmentLogoFile, setDepartmentLogoFile] = useState<File | null>(
        null,
    );
    const [departmentLogoPreview, setDepartmentLogoPreview] = useState<
        string | null
    >(null);
    const [removeDepartmentLogo, setRemoveDepartmentLogo] = useState(false);
    const [savingDepartment, setSavingDepartment] = useState(false);

    // Program Form State (Create / Edit)
    const [programFormOpen, setProgramFormOpen] = useState(false);
    const [editingProgramId, setEditingProgramId] = useState<number | null>(
        null,
    );
    const [createNewDeptInline, setCreateNewDeptInline] = useState(false);
    const [inlineDeptForm, setInlineDeptForm] = useState({
        code: '',
        name: '',
        description: '',
    });
    const [form, setForm] = useState({
        department_id: '',
        code: '',
        name: '',
        description: '',
        degree_title: '',
    });
    const [creating, setCreating] = useState(false);

    // Inline Add Degree Offering State
    const [addingDegreeProgramId, setAddingDegreeProgramId] = useState<
        number | null
    >(null);
    const [degreeTitleInput, setDegreeTitleInput] = useState('');
    const [savingDegree, setSavingDegree] = useState(false);

    const isProgramModalActive = createOpen || programFormOpen;

    function reloadAll() {
        programsRes.reload();
        departmentsRes.reload();
    }

    function clearDepartmentLogoPreview(previewUrl: string | null) {
        if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
    }

    function openCreateDepartment() {
        clearDepartmentLogoPreview(departmentLogoPreview);
        setEditingDepartmentId(null);
        setDepartmentForm({ code: '', name: '', description: '' });
        setDepartmentLogoFile(null);
        setDepartmentLogoPreview(null);
        setRemoveDepartmentLogo(false);
        setDepartmentFormOpen(true);
    }

    function openEditDepartment(dept: AcademicDepartment) {
        clearDepartmentLogoPreview(departmentLogoPreview);
        setEditingDepartmentId(dept.id);
        setDepartmentForm({
            code: dept.code,
            name: dept.name,
            description: dept.description ?? '',
        });
        setDepartmentLogoFile(null);
        setDepartmentLogoPreview(dept.logo ?? null);
        setRemoveDepartmentLogo(false);
        setDepartmentFormOpen(true);
    }

    function openAddProgramForDepartment(deptId?: number) {
        setEditingProgramId(null);
        setCreateNewDeptInline(false);
        setForm({
            department_id: deptId ? String(deptId) : '',
            code: '',
            name: '',
            description: '',
            degree_title: '',
        });
        setProgramFormOpen(true);
    }

    function openEditProgram(prog: AcademicProgram) {
        setEditingProgramId(prog.id);
        setCreateNewDeptInline(false);
        setForm({
            department_id: String(prog.department_id),
            code: prog.code,
            name: prog.name,
            description: prog.description ?? '',
            degree_title: '',
        });
        setProgramFormOpen(true);
    }

    function closeProgramForm() {
        setProgramFormOpen(false);
        setEditingProgramId(null);
        setCreateNewDeptInline(false);
        onCloseCreate();
    }

    async function saveDepartment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSavingDepartment(true);
        try {
            const formData = new FormData();
            formData.append('code', departmentForm.code);
            formData.append('name', departmentForm.name);
            formData.append('description', departmentForm.description);

            if (departmentLogoFile) {
                formData.append('logo', departmentLogoFile);
            } else if (removeDepartmentLogo) {
                formData.append('remove_logo', '1');
            }

            if (editingDepartmentId !== null) {
                formData.append('_method', 'PATCH');
                await apiRequest<ApiEnvelope<AcademicDepartment>>(
                    `/api/departments/${editingDepartmentId}`,
                    {
                        method: 'POST',
                        body: formData,
                    },
                );
                toast.success('Department updated.');
            } else {
                await apiRequest<ApiEnvelope<AcademicDepartment>>(
                    '/api/departments',
                    {
                        method: 'POST',
                        body: formData,
                    },
                );
                toast.success('Department created.');
            }
            clearDepartmentLogoPreview(departmentLogoPreview);
            setDepartmentForm({ code: '', name: '', description: '' });
            setDepartmentLogoFile(null);
            setDepartmentLogoPreview(null);
            setRemoveDepartmentLogo(false);
            setEditingDepartmentId(null);
            setDepartmentFormOpen(false);
            reloadAll();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Department could not be saved.',
            );
        } finally {
            setSavingDepartment(false);
        }
    }

    async function createProgram(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);
        try {
            let targetDeptId = form.department_id;

            if (createNewDeptInline) {
                const newDeptRes = await apiRequest<
                    ApiEnvelope<AcademicDepartment>
                >('/api/departments', {
                    method: 'POST',
                    body: {
                        code: inlineDeptForm.code,
                        name: inlineDeptForm.name,
                        description: inlineDeptForm.description || null,
                    },
                });
                targetDeptId = String(newDeptRes.data.id);
            }

            if (editingProgramId !== null) {
                await apiRequest<ApiEnvelope<AcademicProgram>>(
                    `/api/programs/${editingProgramId}`,
                    {
                        method: 'PATCH',
                        body: {
                            department_id: Number(targetDeptId),
                            code: form.code,
                            name: form.name,
                            description: form.description || null,
                        },
                    },
                );
                toast.success('Academic program updated.');
            } else {
                await apiRequest<ApiEnvelope<AcademicProgram>>(
                    `/api/departments/${targetDeptId}/programs`,
                    {
                        method: 'POST',
                        body: {
                            code: form.code,
                            name: form.name,
                            description: form.description || null,
                            degree_title: form.degree_title || null,
                        },
                    },
                );
                toast.success('Academic program created.');
            }

            setForm({
                department_id: '',
                code: '',
                name: '',
                description: '',
                degree_title: '',
            });
            setInlineDeptForm({ code: '', name: '', description: '' });
            closeProgramForm();
            reloadAll();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Academic program could not be saved.',
            );
        } finally {
            setCreating(false);
        }
    }

    async function addDegreeOffering(programId: number) {
        if (!degreeTitleInput.trim()) return;
        setSavingDegree(true);
        try {
            await apiRequest(`/api/programs/${programId}/degrees`, {
                method: 'POST',
                body: {
                    degree_title: degreeTitleInput.trim(),
                },
            });
            setDegreeTitleInput('');
            setAddingDegreeProgramId(null);
            reloadAll();
            toast.success('Degree offering added to program.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Degree offering could not be added.',
            );
        } finally {
            setSavingDegree(false);
        }
    }

    if (programsRes.loading || departmentsRes.loading) {
        return <LoadingState />;
    }

    if (programsRes.error) {
        return <ErrorState message={programsRes.error} />;
    }

    const departmentsList = departmentsRes.data?.data ?? [];
    const programsList = programsRes.data?.data ?? [];
    const totalDegrees = programsList.reduce(
        (sum, p) => sum + (p.program_degrees?.length ?? 0),
        0,
    );

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredDepartments = departmentsList.filter((dept) => {
        if (
            selectedDepartmentFilter !== 'all' &&
            String(dept.id) !== selectedDepartmentFilter
        ) {
            return false;
        }
        if (!normalizedQuery) return true;
        const deptMatches =
            dept.code.toLowerCase().includes(normalizedQuery) ||
            dept.name.toLowerCase().includes(normalizedQuery);
        const progMatches = programsList
            .filter((p) => p.department_id === dept.id)
            .some(
                (p) =>
                    p.code.toLowerCase().includes(normalizedQuery) ||
                    p.name.toLowerCase().includes(normalizedQuery),
            );
        return deptMatches || progMatches;
    });

    const filteredPrograms = programsList.filter((prog) => {
        if (
            selectedDepartmentFilter !== 'all' &&
            String(prog.department_id) !== selectedDepartmentFilter
        ) {
            return false;
        }
        if (!normalizedQuery) return true;
        return (
            prog.code.toLowerCase().includes(normalizedQuery) ||
            prog.name.toLowerCase().includes(normalizedQuery) ||
            (prog.department?.name.toLowerCase().includes(normalizedQuery) ??
                false)
        );
    });

    return (
        <div className="space-y-4">
            {/* Top Modular Action & Filter Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#edf2eb] px-3 py-1 text-xs font-semibold text-[#2b5139]">
                            {departmentsList.length}{' '}
                            {departmentsList.length === 1
                                ? 'Department'
                                : 'Departments'}
                        </span>
                        <span className="rounded-full bg-[#f3f5f1] px-3 py-1 text-xs font-semibold text-[#4d5a4f]">
                            {programsList.length}{' '}
                            {programsList.length === 1
                                ? 'Academic Program'
                                : 'Academic Programs'}
                        </span>
                        <span className="rounded-full bg-[#f7f8f5] px-3 py-1 text-xs font-medium text-[#6f786e]">
                            {totalDegrees} Degree Offerings
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-lg bg-[#f3f5f1] p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode('modular')}
                                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${viewMode === 'modular'
                                        ? 'bg-white text-[#2b5139] shadow-2xs'
                                        : 'text-[#626c61] hover:text-[#29382e]'
                                    }`}
                            >
                                Modular by Department
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${viewMode === 'grid'
                                        ? 'bg-white text-[#2b5139] shadow-2xs'
                                        : 'text-[#626c61] hover:text-[#29382e]'
                                    }`}
                            >
                                All Programs Grid
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateDepartment}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#cfe0cc] bg-[#edf2eb] px-3.5 text-xs font-semibold text-[#2b5139] transition hover:bg-[#e1ebe0]"
                        >
                            + Create department
                        </button>
                        <button
                            type="button"
                            onClick={() => openAddProgramForDepartment()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2b5139] px-3.5 text-xs font-semibold text-white transition hover:bg-[#22422d]"
                        >
                            + Add program
                        </button>
                    </div>
                </div>

                {/* Search & Department Filter Pills */}
                <div className="flex flex-col gap-2.5 border-t border-[#eff0ec] pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search departments, program codes, or titles…"
                        className="h-9 w-full rounded-xl border border-[#dfe5dd] bg-[#fafbf9] px-3 text-xs text-[#29382e] outline-none focus:border-[#6d8b72] sm:max-w-xs"
                    />
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSelectedDepartmentFilter('all')}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${selectedDepartmentFilter === 'all'
                                    ? 'bg-[#2b5139] text-white'
                                    : 'border border-[#e2e7df] bg-[#fafbf9] text-[#5e6a5f] hover:bg-[#eff2ed]'
                                }`}
                        >
                            All Departments ({departmentsList.length})
                        </button>
                        {departmentsList.map((dept) => {
                            const count = programsList.filter(
                                (p) => p.department_id === dept.id,
                            ).length;
                            const active =
                                selectedDepartmentFilter === String(dept.id);
                            return (
                                <button
                                    key={dept.id}
                                    type="button"
                                    onClick={() =>
                                        setSelectedDepartmentFilter(
                                            active ? 'all' : String(dept.id),
                                        )
                                    }
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${active
                                            ? 'bg-[#2b5139] text-white'
                                            : 'border border-[#e2e7df] bg-[#fafbf9] text-[#5e6a5f] hover:bg-[#eff2ed]'
                                        }`}
                                >
                                    {dept.code} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Create / Edit Department Form */}
            {departmentFormOpen && (
                <form
                    onSubmit={saveDepartment}
                    className="space-y-4 rounded-2xl border border-[#cfe0cc] bg-[#f8faf7] p-4 sm:p-5"
                >
                    <div className="flex items-center justify-between border-b border-[#e3eae0] pb-2.5">
                        <div>
                            <h3 className="text-sm font-semibold text-[#29382e]">
                                {editingDepartmentId !== null
                                    ? 'Edit Academic Department / College'
                                    : 'Create New Academic Department / College'}
                            </h3>
                            <p className="text-xs text-[#6f786e]">
                                Departments group related academic programs and
                                cohort reports.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Department code
                            <input
                                required
                                maxLength={32}
                                value={departmentForm.code}
                                onChange={(e) =>
                                    setDepartmentForm({
                                        ...departmentForm,
                                        code: e.target.value,
                                    })
                                }
                                placeholder="e.g., CCS, CBA, COE"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d9] bg-white px-3 text-xs uppercase"
                            />
                        </label>
                        <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                            Department / College name
                            <input
                                required
                                maxLength={160}
                                value={departmentForm.name}
                                onChange={(e) =>
                                    setDepartmentForm({
                                        ...departmentForm,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="e.g., College of Computing Studies"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d9] bg-white px-3 text-xs"
                            />
                        </label>
                        <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-3">
                            Description (optional)
                            <input
                                maxLength={500}
                                value={departmentForm.description}
                                onChange={(e) =>
                                    setDepartmentForm({
                                        ...departmentForm,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Brief overview of the college or academic department…"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d9] bg-white px-3 text-xs"
                            />
                        </label>
                        <div className="sm:col-span-3">
                            <span className="block text-xs font-medium text-[#4d5a4f]">
                                Department logo (optional)
                            </span>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-xl border border-[#dce2d9] bg-white p-3">
                                {departmentLogoPreview ? (
                                    <img
                                        src={departmentLogoPreview}
                                        alt="Department logo preview"
                                        className="size-12 shrink-0 rounded-xl border border-[#dce2d9] object-cover"
                                    />
                                ) : (
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#cfd8cc] bg-[#f8faf7] text-[10px] font-bold tracking-wide text-[#5e6a5f] uppercase">
                                        {departmentForm.code.trim().slice(0, 5) ||
                                            'LOGO'}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1 space-y-1">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(e) => {
                                            const file =
                                                e.target.files?.[0] ?? null;
                                            clearDepartmentLogoPreview(
                                                departmentLogoPreview,
                                            );
                                            setDepartmentLogoFile(file);
                                            if (file) {
                                                setDepartmentLogoPreview(
                                                    URL.createObjectURL(file),
                                                );
                                                setRemoveDepartmentLogo(false);
                                            } else {
                                                setDepartmentLogoPreview(null);
                                            }
                                        }}
                                        className="block w-full text-xs text-[#4d5a4f] file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf2eb] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#2b5139] hover:file:bg-[#e1ebe0]"
                                    />
                                    <p className="text-[11px] text-[#737c72]">
                                        PNG, JPG, or WEBP up to 5MB. Displayed
                                        in the catalog and public portal.
                                    </p>
                                </div>
                                {departmentLogoPreview && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearDepartmentLogoPreview(
                                                departmentLogoPreview,
                                            );
                                            setDepartmentLogoFile(null);
                                            setDepartmentLogoPreview(null);
                                            setRemoveDepartmentLogo(true);
                                        }}
                                        className="rounded-lg border border-[#e3d3cf] bg-[#fdf6f5] px-2.5 py-1.5 text-[11px] font-semibold text-[#8b4e43] hover:bg-[#f9ebe8]"
                                    >
                                        Remove logo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                clearDepartmentLogoPreview(
                                    departmentLogoPreview,
                                );
                                setDepartmentLogoFile(null);
                                setDepartmentLogoPreview(null);
                                setRemoveDepartmentLogo(false);
                                setDepartmentFormOpen(false);
                                setEditingDepartmentId(null);
                            }}
                            className="h-9 rounded-lg border border-[#dce2d9] bg-white px-3 text-xs font-medium text-[#687267]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={savingDepartment}
                            className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                        >
                            {savingDepartment
                                ? 'Saving…'
                                : editingDepartmentId !== null
                                    ? 'Save department'
                                    : 'Create department'}
                        </button>
                    </div>
                </form>
            )}

            {/* Create / Edit Academic Program Form */}
            {isProgramModalActive && (
                <form
                    onSubmit={createProgram}
                    className="grid gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:grid-cols-2 sm:p-5"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eff0ec] pb-2.5 sm:col-span-2">
                        <div>
                            <h3 className="text-sm font-semibold text-[#29382e]">
                                {editingProgramId !== null
                                    ? 'Edit Academic Program'
                                    : 'Add Academic Program'}
                            </h3>
                            <p className="text-xs text-[#7a8278]">
                                Link the program to an existing department or
                                create a new department inline.
                            </p>
                        </div>
                        {editingProgramId === null && (
                            <button
                                type="button"
                                onClick={() =>
                                    setCreateNewDeptInline((prev) => !prev)
                                }
                                className="rounded-lg border border-[#cfe0cc] bg-[#edf2eb] px-3 py-1.5 text-[11px] font-semibold text-[#2b5139] hover:bg-[#e1ebe0]"
                            >
                                {createNewDeptInline
                                    ? '← Select existing department'
                                    : '+ Create new department inline'}
                            </button>
                        )}
                    </div>

                    {createNewDeptInline ? (
                        <div className="grid gap-3 rounded-xl border border-[#dce4d9] bg-[#f8faf7] p-3.5 sm:col-span-2 sm:grid-cols-2">
                            <label className="text-xs font-medium text-[#2b5139]">
                                New department code
                                <input
                                    required
                                    maxLength={32}
                                    value={inlineDeptForm.code}
                                    onChange={(e) =>
                                        setInlineDeptForm({
                                            ...inlineDeptForm,
                                            code: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., CON"
                                    className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d9] bg-white px-3 text-xs uppercase"
                                />
                            </label>
                            <label className="text-xs font-medium text-[#2b5139]">
                                New department name
                                <input
                                    required
                                    maxLength={160}
                                    value={inlineDeptForm.name}
                                    onChange={(e) =>
                                        setInlineDeptForm({
                                            ...inlineDeptForm,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., College of Nursing"
                                    className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d9] bg-white px-3 text-xs"
                                />
                            </label>
                        </div>
                    ) : (
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
                                {departmentsList.map((department) => (
                                    <option
                                        key={department.id}
                                        value={department.id}
                                    >
                                        {department.code} · {department.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

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
                                placeholder={
                                    name === 'code'
                                        ? 'e.g., BSCS, BSIT, BSN'
                                        : 'e.g., BS in Computer Science'
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    ))}

                    {editingProgramId === null && (
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Initial degree title (optional)
                            <input
                                value={form.degree_title}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        degree_title: event.target.value,
                                    })
                                }
                                placeholder="e.g., Bachelor of Science in Computer Science"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    )}

                    <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                        Description (optional)
                        <input
                            value={form.description}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    description: event.target.value,
                                })
                            }
                            placeholder="Optional program summary or specialization notes…"
                            className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                        />
                    </label>

                    <div className="flex items-center justify-end gap-2 sm:col-span-2">
                        <button
                            type="button"
                            onClick={closeProgramForm}
                            className="h-9 rounded-lg border border-[#e8eae4] px-3 text-xs font-medium text-[#687267]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                        >
                            {creating
                                ? 'Saving…'
                                : editingProgramId !== null
                                    ? 'Save changes'
                                    : 'Add program'}
                        </button>
                    </div>
                    {departmentsRes.error ? (
                        <p role="alert" className="text-xs text-[#8b4e43]">
                            {departmentsRes.error}
                        </p>
                    ) : null}
                </form>
            )}

            {/* Modular by Department View */}
            {viewMode === 'modular' ? (
                filteredDepartments.length ? (
                    <div className="space-y-4">
                        {filteredDepartments.map((dept) => {
                            const deptPrograms = programsList.filter(
                                (p) =>
                                    p.department_id === dept.id &&
                                    (!normalizedQuery ||
                                        dept.code
                                            .toLowerCase()
                                            .includes(normalizedQuery) ||
                                        dept.name
                                            .toLowerCase()
                                            .includes(normalizedQuery) ||
                                        p.code
                                            .toLowerCase()
                                            .includes(normalizedQuery) ||
                                        p.name
                                            .toLowerCase()
                                            .includes(normalizedQuery)),
                            );

                            return (
                                <section
                                    key={dept.id}
                                    className="rounded-2xl border border-[#e4e9e1] bg-white p-5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eff1ed] pb-3.5">
                                        <div className="flex items-start gap-3">
                                            {dept.logo && (
                                                <img
                                                    src={dept.logo}
                                                    alt={`${dept.name} logo`}
                                                    className="size-11 shrink-0 rounded-xl border border-[#e3e7df] bg-white object-cover"
                                                />
                                            )}
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-lg bg-[#2b5139] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
                                                        {dept.code}
                                                    </span>
                                                    <h2 className="text-sm font-semibold text-[#29382e]">
                                                        {dept.name}
                                                    </h2>
                                                    <span className="rounded-full bg-[#f2f4f0] px-2.5 py-0.5 text-[10px] font-semibold text-[#5b675c]">
                                                        {deptPrograms.length}{' '}
                                                        {deptPrograms.length ===
                                                        1
                                                            ? 'program'
                                                            : 'programs'}
                                                    </span>
                                                </div>
                                                {dept.description && (
                                                    <p className="mt-1 text-xs text-[#737c72]">
                                                        {dept.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditDepartment(dept)
                                                }
                                                className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#536055] hover:bg-[#f6f7f4]"
                                            >
                                                Edit department
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openAddProgramForDepartment(
                                                        dept.id,
                                                    )
                                                }
                                                className="rounded-lg bg-[#edf2eb] px-3 py-1.5 text-[11px] font-semibold text-[#2b5139] hover:bg-[#dfe7dc]"
                                            >
                                                + Add program here
                                            </button>
                                        </div>
                                    </div>

                                    {deptPrograms.length ? (
                                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {deptPrograms.map((program) => (
                                                <article
                                                    key={program.id}
                                                    className="flex flex-col justify-between rounded-xl border border-[#e9ebe5] bg-[#fafbf9] p-4"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <span className="rounded bg-[#edf2eb] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#2b5139] uppercase">
                                                                {program.code}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditProgram(
                                                                        program,
                                                                    )
                                                                }
                                                                className="text-[11px] font-semibold text-[#687267] hover:text-[#2b5139]"
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                        <h3 className="mt-2 text-sm font-semibold text-[#39463b]">
                                                            {program.name}
                                                        </h3>
                                                        {program.description && (
                                                            <p className="mt-1 text-xs text-[#7a8278]">
                                                                {
                                                                    program.description
                                                                }
                                                            </p>
                                                        )}

                                                        {program.program_degrees
                                                            ?.length ? (
                                                            <ul className="mt-3 space-y-1 border-t border-[#e8ece5] pt-2.5">
                                                                {program.program_degrees.map(
                                                                    (
                                                                        offering,
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                offering.id
                                                                            }
                                                                            className="text-[11px] text-[#5e685d]"
                                                                        >
                                                                            •{' '}
                                                                            {
                                                                                offering
                                                                                    .degree
                                                                                    .title
                                                                            }
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        ) : (
                                                            <p className="mt-3 border-t border-[#e8ece5] pt-2.5 text-[11px] text-[#969e95]">
                                                                No degree
                                                                offerings linked
                                                                yet.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 pt-2">
                                                        {addingDegreeProgramId ===
                                                            program.id ? (
                                                            <div className="flex gap-1.5">
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        degreeTitleInput
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setDegreeTitleInput(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="Degree title (e.g. BS in IT)"
                                                                    className="h-8 flex-1 rounded-lg border border-[#dce2d9] bg-white px-2 text-[11px]"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        savingDegree
                                                                    }
                                                                    onClick={() =>
                                                                        void addDegreeOffering(
                                                                            program.id,
                                                                        )
                                                                    }
                                                                    className="h-8 rounded-lg bg-[#2b5139] px-2.5 text-[10px] font-semibold text-white"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setAddingDegreeProgramId(
                                                                            null,
                                                                        );
                                                                        setDegreeTitleInput(
                                                                            '',
                                                                        );
                                                                    }}
                                                                    className="h-8 rounded-lg border border-[#dce2d9] bg-white px-2 text-[10px] text-[#687267]"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setAddingDegreeProgramId(
                                                                        program.id,
                                                                    );
                                                                    setDegreeTitleInput(
                                                                        '',
                                                                    );
                                                                }}
                                                                className="text-[11px] font-semibold text-[#2b5139] hover:underline"
                                                            >
                                                                + Add degree
                                                                offering
                                                            </button>
                                                        )}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-3 rounded-xl border border-dashed border-[#dce2d9] bg-[#fafbf9] p-4 text-center text-xs text-[#7a8278]">
                                            No academic programs under{' '}
                                            <span className="font-semibold text-[#39463b]">
                                                {dept.name}
                                            </span>{' '}
                                            yet.{' '}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openAddProgramForDepartment(
                                                        dept.id,
                                                    )
                                                }
                                                className="font-semibold text-[#2b5139] hover:underline"
                                            >
                                                Add the first program →
                                            </button>
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState>
                        No academic departments match your filter. Click "+
                        Create department" above to add one.
                    </EmptyState>
                )
            ) : filteredPrograms.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredPrograms.map((program) => (
                        <article
                            key={program.id}
                            className="rounded-2xl border border-[#e9ebe5] bg-white p-5"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[10px] font-semibold tracking-wide text-[#829080] uppercase">
                                    {program.code}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => openEditProgram(program)}
                                    className="text-[11px] font-semibold text-[#687267] hover:text-[#2b5139]"
                                >
                                    Edit
                                </button>
                            </div>
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

const QUESTION_TYPE_LABELS: Record<string, string> = {
    text: 'Short Text',
    short_text: 'Short Text',
    textarea: 'Long Text',
    long_text: 'Long Text',
    radio: 'Multiple Choice',
    multiple_choice: 'Multiple Choice',
    choice: 'Multiple Choice',
    multiselect: 'Checkbox (Multi-Select)',
    checkbox: 'Checkbox (Multi-Select)',
    select: 'Dropdown',
    dropdown: 'Dropdown',
    rating: 'Rating Scale (1–5)',
    date: 'Date',
    number: 'Number',
    boolean: 'Yes / No',
    yes_no: 'Yes / No',
};

const BUILDER_QUESTION_TYPES = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'radio', label: 'Multiple Choice (Single)' },
    { value: 'multiselect', label: 'Checkbox (Multiple)' },
    { value: 'select', label: 'Dropdown' },
    { value: 'rating', label: 'Rating Scale (1–5)' },
    { value: 'date', label: 'Date' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes / No' },
] as const;

function requiresQuestionOptions(type: string): boolean {
    return [
        'radio',
        'multiple_choice',
        'choice',
        'multiselect',
        'checkbox',
        'select',
        'dropdown',
    ].includes(type);
}

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
            className="mt-4 space-y-3.5 rounded-2xl bg-[#f3f6f2] p-4 sm:p-5"
        >
            {/* Respondent Header Card */}
            <div className="rounded-xl border border-[#dce4d9] border-t-8 border-t-[#2b5139] bg-white p-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#2b5139]">
                        {survey.is_anonymous
                            ? '🔒 Anonymous Form · Your name will not be shown in response summaries'
                            : '📋 Institutional Tracer Form · 1 response per alumnus'}
                    </span>
                    <span className="text-[11px] font-medium text-[#b84a39]">
                        * Indicates required question
                    </span>
                </div>
            </div>

            {survey.questions.map((question, qIndex) => {
                const value = answers[question.id];
                const qType = question.type;

                return (
                    <div
                        key={question.id}
                        className="rounded-xl border border-[#dfe5dc] bg-white p-4 shadow-2xs sm:p-5"
                    >
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-[#233127] sm:text-sm">
                                {qIndex + 1}. {question.prompt}
                                {question.is_required && (
                                    <span className="ml-1 text-[#c93b2b]">
                                        *
                                    </span>
                                )}
                            </p>
                            <span className="shrink-0 rounded bg-[#f4f6f2] px-2 py-0.5 text-[10px] font-medium text-[#6f786e]">
                                {QUESTION_TYPE_LABELS[qType] ?? qType}
                            </span>
                        </div>

                        {(qType === 'textarea' || qType === 'long_text') && (
                            <textarea
                                required={question.is_required}
                                value={typeof value === 'string' ? value : ''}
                                placeholder="Your answer"
                                onChange={(event) =>
                                    updateAnswer(
                                        question.id,
                                        event.target.value,
                                    )
                                }
                                className="min-h-24 w-full border-b-2 border-[#dce2d9] bg-[#fafbf9] p-3 text-xs text-[#29382e] transition outline-none focus:border-[#2b5139] focus:bg-white"
                            />
                        )}

                        {(qType === 'radio' ||
                            qType === 'multiple_choice' ||
                            qType === 'choice') && (
                                <div className="space-y-2">
                                    {(question.options ?? []).map((option) => (
                                        <label
                                            key={option}
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-xs transition ${value === option
                                                ? 'border-[#2b5139] bg-[#edf2eb] font-semibold text-[#2b5139]'
                                                : 'border-[#e8ece5] bg-white text-[#3d4a3f] hover:bg-[#f9faf8]'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${question.id}`}
                                                required={question.is_required}
                                                checked={value === option}
                                                onChange={() =>
                                                    updateAnswer(
                                                        question.id,
                                                        option,
                                                    )
                                                }
                                                className="size-4 accent-[#2b5139]"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                        {(qType === 'multiselect' || qType === 'checkbox') && (
                            <div className="space-y-2">
                                {(question.options ?? []).map((option) => {
                                    const selected = Array.isArray(value)
                                        ? (value as string[])
                                        : [];
                                    const isChecked = selected.includes(option);
                                    return (
                                        <label
                                            key={option}
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-xs transition ${isChecked
                                                ? 'border-[#2b5139] bg-[#edf2eb] font-semibold text-[#2b5139]'
                                                : 'border-[#e8ece5] bg-white text-[#3d4a3f] hover:bg-[#f9faf8]'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(event) =>
                                                    updateAnswer(
                                                        question.id,
                                                        event.target.checked
                                                            ? [
                                                                ...selected,
                                                                option,
                                                            ]
                                                            : selected.filter(
                                                                (item) =>
                                                                    item !==
                                                                    option,
                                                            ),
                                                    )
                                                }
                                                className="size-4 accent-[#2b5139]"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {(qType === 'select' || qType === 'dropdown') && (
                            <select
                                required={question.is_required}
                                value={
                                    value !== undefined && value !== null
                                        ? String(value)
                                        : ''
                                }
                                onChange={(event) =>
                                    updateAnswer(
                                        question.id,
                                        event.target.value,
                                    )
                                }
                                className="h-10 w-full max-w-sm rounded-lg border border-[#dce2d9] bg-white px-3 text-xs text-[#29382e] outline-none focus:border-[#2b5139]"
                            >
                                <option value="">Choose</option>
                                {(question.options ?? []).map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}

                        {qType === 'rating' && (
                            <div className="py-2">
                                <div className="flex items-center justify-between gap-2 sm:max-w-md">
                                    <span className="text-[11px] text-[#7a8278]">
                                        1 (Lowest)
                                    </span>
                                    <div className="flex items-center gap-3 sm:gap-5">
                                        {[1, 2, 3, 4, 5].map((score) => {
                                            const active =
                                                Number(value) === score;
                                            return (
                                                <label
                                                    key={score}
                                                    className="flex cursor-pointer flex-col items-center gap-1.5"
                                                >
                                                    <span className="text-xs font-semibold text-[#4d5a4f]">
                                                        {score}
                                                    </span>
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        required={
                                                            question.is_required
                                                        }
                                                        checked={active}
                                                        onChange={() =>
                                                            updateAnswer(
                                                                question.id,
                                                                score,
                                                            )
                                                        }
                                                        className="size-4 accent-[#2b5139]"
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <span className="text-[11px] text-[#7a8278]">
                                        5 (Highest)
                                    </span>
                                </div>
                            </div>
                        )}

                        {(qType === 'boolean' || qType === 'yes_no') && (
                            <div className="flex gap-3">
                                {[
                                    { label: 'Yes', val: true },
                                    { label: 'No', val: false },
                                ].map((item) => (
                                    <label
                                        key={item.label}
                                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-2 text-xs transition ${value === item.val
                                            ? 'border-[#2b5139] bg-[#edf2eb] font-semibold text-[#2b5139]'
                                            : 'border-[#e8ece5] bg-white text-[#3d4a3f]'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            required={question.is_required}
                                            checked={value === item.val}
                                            onChange={() =>
                                                updateAnswer(
                                                    question.id,
                                                    item.val,
                                                )
                                            }
                                            className="size-4 accent-[#2b5139]"
                                        />
                                        <span>{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {qType === 'date' && (
                            <input
                                type="date"
                                required={question.is_required}
                                value={typeof value === 'string' ? value : ''}
                                onChange={(event) =>
                                    updateAnswer(
                                        question.id,
                                        event.target.value,
                                    )
                                }
                                className="h-10 w-full max-w-xs rounded-lg border border-[#dce2d9] bg-white px-3 text-xs text-[#29382e] outline-none focus:border-[#2b5139]"
                            />
                        )}

                        {(qType === 'text' ||
                            qType === 'short_text' ||
                            qType === 'number') && (
                                <input
                                    type={qType === 'number' ? 'number' : 'text'}
                                    required={question.is_required}
                                    placeholder="Your answer"
                                    value={
                                        typeof value === 'string' ||
                                            typeof value === 'number'
                                            ? value
                                            : ''
                                    }
                                    onChange={(event) =>
                                        updateAnswer(
                                            question.id,
                                            qType === 'number'
                                                ? event.target.value === ''
                                                    ? ''
                                                    : Number(event.target.value)
                                                : event.target.value,
                                        )
                                    }
                                    className="h-10 w-full max-w-md border-b-2 border-[#dce2d9] bg-transparent px-1 text-xs text-[#29382e] transition outline-none focus:border-[#2b5139]"
                                />
                            )}
                    </div>
                );
            })}

            <div className="flex items-center justify-between pt-1">
                <button
                    type="submit"
                    disabled={saving}
                    className="h-9 rounded-lg bg-[#2b5139] px-5 text-xs font-semibold text-white shadow-xs hover:bg-[#21402c] disabled:opacity-60"
                >
                    {saving ? 'Submitting…' : 'Submit'}
                </button>
                <button
                    type="button"
                    onClick={() => setAnswers({})}
                    className="text-xs font-semibold text-[#2b5139] hover:underline"
                >
                    Clear form
                </button>
            </div>
        </form>
    );
}

type QuestionDraft = {
    prompt: string;
    type: string;
    options: string;
    optionsList: string[];
    is_required: boolean;
};

type SurveyAnalyticsPayload = {
    survey_id: number;
    title: string;
    status: string;
    is_anonymous: boolean;
    total_responses: number;
    questions: Array<{
        id: number;
        prompt: string;
        type: string;
        is_required: boolean;
        answered_count: number;
        response_rate: number;
        distribution: Array<{
            label: string;
            count: number;
            percentage: number;
        }>;
        recent_answers: Array<{
            respondent: string;
            answer: string;
            submitted_at: string | null;
        }>;
    }>;
};

const COHORT_YEAR_OPTIONS = [
    2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018,
];

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
    const canViewAnalytics =
        canManage || role === 'Department coordinator';
    const canRespond = role === 'Alumni';
    const meRes = useApiResource<ApiEnvelope<AlumniProfile>>(
        canRespond ? '/api/me/alumni' : null,
    );
    const alumniProfile = meRes.data?.data;
    const isProfileComplete = Boolean(alumniProfile?.is_complete);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const { data, loading, error, reload } =
        useApiResource<ApiEnvelope<RawPagination<Survey>>>('/api/surveys');
    const departmentsRes = useApiResource<ApiEnvelope<AcademicDepartment[]>>(
        canManage ? '/api/departments' : null,
    );
    const programsRes = useApiResource<ApiEnvelope<AcademicProgram[]>>(
        canManage ? '/api/programs' : null,
    );

    const [builderTab, setBuilderTab] = useState<
        'questions' | 'settings' | 'preview'
    >('questions');
    const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
    const [editingSurveyId, setEditingSurveyId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [closesAt, setClosesAt] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [targetSpecificCohorts, setTargetSpecificCohorts] = useState(false);
    const [targetDepartmentIds, setTargetDepartmentIds] = useState<number[]>(
        [],
    );
    const [targetProgramIds, setTargetProgramIds] = useState<number[]>([]);
    const [targetGraduationYears, setTargetGraduationYears] = useState<
        number[]
    >([]);
    const [customYearInput, setCustomYearInput] = useState('');
    const [questions, setQuestions] = useState<QuestionDraft[]>([
        {
            prompt: '',
            type: 'radio',
            options: 'Option 1, Option 2',
            optionsList: ['Option 1', 'Option 2'],
            is_required: true,
        },
    ]);

    const [creating, setCreating] = useState(false);
    const [publishing, setPublishing] = useState<number | null>(null);
    const [closing, setClosing] = useState<number | null>(null);
    const [activeAnalyticsId, setActiveAnalyticsId] = useState<number | null>(
        null,
    );
    const [analyticsData, setAnalyticsData] =
        useState<SurveyAnalyticsPayload | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    function resetBuilder() {
        setBuilderTab('questions');
        setActiveQuestionIdx(0);
        setEditingSurveyId(null);
        setTitle('');
        setDescription('');
        setStartsAt('');
        setClosesAt('');
        setIsAnonymous(false);
        setTargetSpecificCohorts(false);
        setTargetDepartmentIds([]);
        setTargetProgramIds([]);
        setTargetGraduationYears([]);
        setCustomYearInput('');
        setQuestions([
            {
                prompt: '',
                type: 'radio',
                options: 'Option 1, Option 2',
                optionsList: ['Option 1', 'Option 2'],
                is_required: true,
            },
        ]);
    }

    function openEditSurvey(survey: Survey) {
        setBuilderTab('questions');
        setActiveQuestionIdx(0);
        setEditingSurveyId(survey.id);
        setTitle(survey.title);
        setDescription(survey.description ?? '');
        setStartsAt(survey.starts_at ? survey.starts_at.slice(0, 10) : '');
        setClosesAt(survey.closes_at ? survey.closes_at.slice(0, 10) : '');
        setIsAnonymous(Boolean(survey.is_anonymous));
        const hasTargeting = Boolean(
            survey.target_department_ids?.length ||
            survey.target_program_ids?.length ||
            survey.target_graduation_years?.length,
        );
        setTargetSpecificCohorts(hasTargeting);
        setTargetDepartmentIds(survey.target_department_ids ?? []);
        setTargetProgramIds(survey.target_program_ids ?? []);
        setTargetGraduationYears(survey.target_graduation_years ?? []);
        setQuestions(
            survey.questions.length
                ? survey.questions.map((q) => {
                    const list =
                        q.options && q.options.length
                            ? [...q.options]
                            : ['Option 1'];
                    return {
                        prompt: q.prompt,
                        type: q.type,
                        options: list.join(', '),
                        optionsList: list,
                        is_required: q.is_required,
                    };
                })
                : [
                    {
                        prompt: '',
                        type: 'radio',
                        options: 'Option 1, Option 2',
                        optionsList: ['Option 1', 'Option 2'],
                        is_required: true,
                    },
                ],
        );
    }

    function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
        setQuestions((current) =>
            current.map((item, idx) => {
                if (idx !== index) return item;
                const updated = { ...item, ...patch };
                if (
                    patch.type &&
                    requiresQuestionOptions(patch.type) &&
                    updated.optionsList.length === 0
                ) {
                    updated.optionsList = ['Option 1'];
                    updated.options = 'Option 1';
                }
                return updated;
            }),
        );
    }

    function updateQuestionOptionItem(
        questionIndex: number,
        optionIndex: number,
        value: string,
    ) {
        setQuestions((current) =>
            current.map((item, idx) => {
                if (idx !== questionIndex) return item;
                const nextList = item.optionsList.map((opt, oIdx) =>
                    oIdx === optionIndex ? value : opt,
                );
                return {
                    ...item,
                    optionsList: nextList,
                    options: nextList.join(', '),
                };
            }),
        );
    }

    function addQuestionOptionItem(questionIndex: number) {
        setQuestions((current) =>
            current.map((item, idx) => {
                if (idx !== questionIndex) return item;
                const nextList = [
                    ...item.optionsList,
                    `Option ${item.optionsList.length + 1}`,
                ];
                return {
                    ...item,
                    optionsList: nextList,
                    options: nextList.join(', '),
                };
            }),
        );
    }

    function removeQuestionOptionItem(
        questionIndex: number,
        optionIndex: number,
    ) {
        setQuestions((current) =>
            current.map((item, idx) => {
                if (idx !== questionIndex || item.optionsList.length <= 1) {
                    return item;
                }
                const nextList = item.optionsList.filter(
                    (_, oIdx) => oIdx !== optionIndex,
                );
                return {
                    ...item,
                    optionsList: nextList,
                    options: nextList.join(', '),
                };
            }),
        );
    }

    function addQuestion() {
        setQuestions((current) => {
            const next = [
                ...current,
                {
                    prompt: '',
                    type: 'radio',
                    options: 'Option 1, Option 2',
                    optionsList: ['Option 1', 'Option 2'],
                    is_required: true,
                },
            ];
            setActiveQuestionIdx(next.length - 1);
            return next;
        });
    }

    function duplicateQuestion(index: number) {
        setQuestions((current) => {
            const copy = [...current];
            const source = current[index];
            const clone: QuestionDraft = {
                ...source,
                optionsList: [...source.optionsList],
            };
            copy.splice(index + 1, 0, clone);
            setActiveQuestionIdx(index + 1);
            return copy;
        });
    }

    function removeQuestion(index: number) {
        setQuestions((current) =>
            current.length > 1
                ? current.filter((_, idx) => idx !== index)
                : current,
        );
    }

    function moveQuestion(index: number, direction: -1 | 1) {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= questions.length) {
            return;
        }
        setQuestions((current) => {
            const copy = [...current];
            const [item] = copy.splice(index, 1);
            copy.splice(nextIndex, 0, item);
            setActiveQuestionIdx(nextIndex);
            return copy;
        });
    }

    function toggleId(list: number[], id: number): number[] {
        return list.includes(id)
            ? list.filter((item) => item !== id)
            : [...list, id];
    }

    function addCustomBatchYear() {
        const parsed = Number.parseInt(customYearInput.trim(), 10);
        if (Number.isNaN(parsed) || parsed < 1950 || parsed > 2100) {
            toast.error('Enter a valid graduation year between 1950 and 2100.');
            return;
        }
        if (!targetGraduationYears.includes(parsed)) {
            setTargetGraduationYears((curr) =>
                [...curr, parsed].sort((a, b) => b - a),
            );
        }
        setCustomYearInput('');
    }

    async function saveSurvey(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);

        const formattedQuestions = questions.map((q, index) => {
            const fromList = q.optionsList
                .map((opt) => opt.trim())
                .filter(Boolean);
            const fromString = q.options
                .split(',')
                .map((opt) => opt.trim())
                .filter(Boolean);
            const parsedOptions = fromList.length ? fromList : fromString;

            return {
                prompt: q.prompt,
                type: q.type,
                options: requiresQuestionOptions(q.type) ? parsedOptions : null,
                is_required: q.is_required,
                position: index,
            };
        });

        const payload = {
            title,
            description: description || null,
            starts_at: startsAt || null,
            closes_at: closesAt || null,
            is_anonymous: isAnonymous,
            target_department_ids: targetSpecificCohorts
                ? targetDepartmentIds
                : null,
            target_program_ids: targetSpecificCohorts ? targetProgramIds : null,
            target_graduation_years: targetSpecificCohorts
                ? targetGraduationYears
                : null,
            questions: formattedQuestions,
        };

        try {
            if (editingSurveyId !== null) {
                await apiRequest<ApiEnvelope<Survey>>(
                    `/api/surveys/${editingSurveyId}`,
                    {
                        method: 'PATCH',
                        body: payload,
                    },
                );
                toast.success('Survey updated.');
            } else {
                await apiRequest<ApiEnvelope<Survey>>('/api/surveys', {
                    method: 'POST',
                    body: payload,
                });
                toast.success('Survey created as a draft.');
            }
            resetBuilder();
            onCloseCreate();
            reload();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey could not be saved.',
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

    async function closeSurvey(id: number) {
        setClosing(id);
        try {
            await apiRequest<ApiEnvelope<Survey>>(`/api/surveys/${id}/close`, {
                method: 'POST',
            });
            reload();
            toast.success('Survey closed.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey could not be closed.',
            );
        } finally {
            setClosing(null);
        }
    }

    async function toggleAnalytics(surveyId: number) {
        if (activeAnalyticsId === surveyId) {
            setActiveAnalyticsId(null);
            setAnalyticsData(null);
            return;
        }
        setActiveAnalyticsId(surveyId);
        setAnalyticsLoading(true);
        try {
            const response = await apiRequest<
                ApiEnvelope<SurveyAnalyticsPayload>
            >(`/api/surveys/${surveyId}/analytics`);
            setAnalyticsData(response.data);
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey analytics could not be loaded.',
            );
            setActiveAnalyticsId(null);
        } finally {
            setAnalyticsLoading(false);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const surveys = data?.data.data ?? [];
    const departments = departmentsRes.data?.data ?? [];
    const programs = programsRes.data?.data ?? [];
    const builderVisible = canManage && (createOpen || editingSurveyId !== null);

    return (
        <div className="space-y-4">
            {builderVisible ? (
                <form
                    onSubmit={saveSurvey}
                    className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-[#dfe5dc] bg-[#f1f4ef] p-4 sm:p-6"
                >
                    {/* Survey Builder Top Navigation Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e7df] bg-white px-4 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <span className="grid size-8 place-items-center rounded-lg bg-[#2b5139] text-xs font-bold text-white">
                                SB
                            </span>
                            <div>
                                <p className="text-xs font-bold text-[#29382e]">
                                    {title.trim() || 'Untitled Tracer Survey'}
                                </p>
                                <p className="text-[10px] text-[#7a8278]">
                                    {editingSurveyId !== null
                                        ? 'Editing Draft Survey'
                                        : 'Visual Survey Builder & Dynamic Question Engine'}{' '}
                                    · {questions.length}{' '}
                                    {questions.length === 1
                                        ? 'Question'
                                        : 'Questions'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 rounded-lg bg-[#f3f5f1] p-1">
                            {(
                                [
                                    ['questions', 'Questions'],
                                    ['settings', 'Settings & Cohorts'],
                                    ['preview', 'Preview Form'],
                                ] as const
                            ).map(([tabKey, tabLabel]) => (
                                <button
                                    key={tabKey}
                                    type="button"
                                    onClick={() => setBuilderTab(tabKey)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${builderTab === tabKey
                                        ? 'bg-white text-[#2b5139] shadow-2xs'
                                        : 'text-[#626c61] hover:text-[#29382e]'
                                        }`}
                                >
                                    {tabLabel}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    resetBuilder();
                                    onCloseCreate();
                                }}
                                className="h-8 rounded-lg border border-[#e3e7df] bg-white px-3 text-xs font-medium text-[#687267] hover:bg-[#f6f7f4]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="h-8 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white shadow-2xs hover:bg-[#21402c] disabled:opacity-60"
                            >
                                {creating
                                    ? 'Saving…'
                                    : editingSurveyId !== null
                                        ? 'Save changes'
                                        : 'Create survey'}
                            </button>
                        </div>
                    </div>

                    {/* Google Forms Header Card (Always mounted for form validation) */}
                    <div className="rounded-xl border border-[#dce3d9] border-t-8 border-t-[#2b5139] bg-white p-5 shadow-2xs">
                        <label className="block text-[11px] font-semibold tracking-wider text-[#667367] uppercase">
                            Survey title
                            <input
                                required
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="Untitled Tracer Survey"
                                className="mt-1 w-full border-b-2 border-[#e3e7df] bg-transparent pb-2 text-lg font-bold text-[#233127] transition outline-none focus:border-[#2b5139]"
                            />
                        </label>
                        <label className="mt-3 block text-[11px] font-medium text-[#667367]">
                            Form description
                            <textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                rows={2}
                                placeholder="Form description (explain the purpose of this survey to alumni respondents)…"
                                className="mt-1 w-full border-b border-[#e5e9e2] bg-transparent pb-1.5 text-xs text-[#4d5a4f] transition outline-none focus:border-[#2b5139]"
                            />
                        </label>
                    </div>

                    {/* Settings & Cohort Targeting Card */}
                    <div
                        className={`space-y-4 rounded-xl border border-[#dce3d9] bg-white p-5 shadow-2xs ${builderTab === 'preview' ? 'hidden' : ''
                            }`}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eff1ed] pb-3">
                            <div>
                                <h3 className="text-xs font-bold tracking-wider text-[#2b5139] uppercase">
                                    Schedule, Privacy & Cohort Targeting
                                </h3>
                                <p className="text-[11px] text-[#758074]">
                                    Configure opening/closing dates, anonymous
                                    mode, and target graduation batches or
                                    programs.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="text-xs font-medium text-[#4d5a4f]">
                                Opens on (optional)
                                <input
                                    type="date"
                                    value={startsAt}
                                    onChange={(event) =>
                                        setStartsAt(event.target.value)
                                    }
                                    className="mt-1.5 h-9 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                                />
                            </label>
                            <label className="text-xs font-medium text-[#4d5a4f]">
                                Closes on
                                <input
                                    type="date"
                                    value={closesAt}
                                    onChange={(event) =>
                                        setClosesAt(event.target.value)
                                    }
                                    className="mt-1.5 h-9 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                                />
                            </label>
                            <div className="flex flex-col justify-end gap-2 sm:col-span-2">
                                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#3b4a3e]">
                                    <input
                                        type="checkbox"
                                        checked={isAnonymous}
                                        onChange={(e) =>
                                            setIsAnonymous(e.target.checked)
                                        }
                                        className="size-4 accent-[#2b5139]"
                                    />
                                    <span>
                                        Collect anonymous responses (mask
                                        respondent names in summaries)
                                    </span>
                                </label>
                                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#2b5139]">
                                    <input
                                        type="checkbox"
                                        checked={targetSpecificCohorts}
                                        onChange={(e) =>
                                            setTargetSpecificCohorts(
                                                e.target.checked,
                                            )
                                        }
                                        className="size-4 accent-[#2b5139]"
                                    />
                                    <span>
                                        Target specific departments, programs,
                                        or graduating batches
                                    </span>
                                </label>
                            </div>
                        </div>

                        {targetSpecificCohorts && (
                            <div className="grid gap-4 border-t border-[#e6eae3] pt-4 lg:grid-cols-3">
                                {/* Target Departments */}
                                <div>
                                    <p className="mb-2 text-[11px] font-bold tracking-wider text-[#627063] uppercase">
                                        Target Departments (
                                        {targetDepartmentIds.length || 'All'})
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {departments.map((dept) => {
                                            const active =
                                                targetDepartmentIds.includes(
                                                    dept.id,
                                                );
                                            return (
                                                <button
                                                    key={dept.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setTargetDepartmentIds(
                                                            (curr) =>
                                                                toggleId(
                                                                    curr,
                                                                    dept.id,
                                                                ),
                                                        )
                                                    }
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${active
                                                        ? 'bg-[#2b5139] text-white'
                                                        : 'border border-[#dce2d9] bg-[#f9faf7] text-[#536055]'
                                                        }`}
                                                >
                                                    {dept.code} · {dept.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Target Academic Programs */}
                                <div>
                                    <p className="mb-2 text-[11px] font-bold tracking-wider text-[#627063] uppercase">
                                        Target Academic Programs (
                                        {targetProgramIds.length || 'All'})
                                    </p>
                                    <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                                        {programs.map((prog) => {
                                            const active =
                                                targetProgramIds.includes(
                                                    prog.id,
                                                );
                                            return (
                                                <button
                                                    key={prog.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setTargetProgramIds(
                                                            (curr) =>
                                                                toggleId(
                                                                    curr,
                                                                    prog.id,
                                                                ),
                                                        )
                                                    }
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${active
                                                        ? 'bg-[#2b5139] text-white'
                                                        : 'border border-[#dce2d9] bg-[#f9faf7] text-[#536055]'
                                                        }`}
                                                >
                                                    {prog.code}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Target Graduation Years / Batches */}
                                <div>
                                    <p className="mb-2 text-[11px] font-bold tracking-wider text-[#627063] uppercase">
                                        Target Graduation Batches (
                                        {targetGraduationYears.length || 'All'})
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.from(
                                            new Set([
                                                ...COHORT_YEAR_OPTIONS,
                                                ...targetGraduationYears,
                                            ]),
                                        )
                                            .sort((a, b) => b - a)
                                            .map((yr) => {
                                                const active =
                                                    targetGraduationYears.includes(
                                                        yr,
                                                    );
                                                return (
                                                    <button
                                                        key={yr}
                                                        type="button"
                                                        onClick={() =>
                                                            setTargetGraduationYears(
                                                                (curr) =>
                                                                    toggleId(
                                                                        curr,
                                                                        yr,
                                                                    ),
                                                            )
                                                        }
                                                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${active
                                                            ? 'bg-[#2b5139] text-white'
                                                            : 'border border-[#dce2d9] bg-[#f9faf7] text-[#536055]'
                                                            }`}
                                                    >
                                                        {yr}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                    <div className="mt-2 flex gap-1.5">
                                        <input
                                            type="number"
                                            min={1950}
                                            max={2100}
                                            value={customYearInput}
                                            onChange={(e) =>
                                                setCustomYearInput(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Add year (e.g. 2015)"
                                            className="h-8 flex-1 rounded-lg border border-[#dce2d9] bg-white px-2.5 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={addCustomBatchYear}
                                            className="h-8 rounded-lg border border-[#dce2d9] bg-white px-3 text-[11px] font-semibold text-[#2b5139] hover:bg-[#edf2eb]"
                                        >
                                            Add Batch
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Google Forms Live Preview Mode */}
                    {builderTab === 'preview' && (
                        <div className="space-y-3 rounded-xl border border-[#dce3d9] bg-white p-5">
                            <div className="flex items-center justify-between border-b border-[#eff1ed] pb-3">
                                <span className="text-xs font-bold text-[#2b5139] uppercase">
                                    Live Respondent Form Preview
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setBuilderTab('questions')}
                                    className="text-xs font-semibold text-[#2b5139] hover:underline"
                                >
                                    ← Back to editing questions
                                </button>
                            </div>
                            {questions.map((q, qIdx) => (
                                <div
                                    key={qIdx}
                                    className="rounded-xl border border-[#e3e7df] bg-[#fafbf9] p-4"
                                >
                                    <p className="text-xs font-semibold text-[#233127]">
                                        {qIdx + 1}.{' '}
                                        {q.prompt || 'Untitled Question'}
                                        {q.is_required && (
                                            <span className="ml-1 text-[#c93b2b]">
                                                *
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#7a8278]">
                                        Format:{' '}
                                        {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                                        {requiresQuestionOptions(q.type)
                                            ? ` · Choices: ${q.optionsList.join(', ')}`
                                            : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Google Forms Question Cards Stream */}
                    <div
                        className={`space-y-3.5 ${builderTab === 'preview' ? 'hidden' : ''
                            }`}
                    >
                        {questions.map((question, index) => {
                            const isFocused = activeQuestionIdx === index;
                            const isChoice = requiresQuestionOptions(
                                question.type,
                            );

                            return (
                                <div
                                    key={index}
                                    onClick={() => setActiveQuestionIdx(index)}
                                    className={`rounded-xl border bg-white p-5 shadow-2xs transition ${isFocused
                                        ? 'border-[#cad5c6] border-l-4 border-l-[#2b5139]'
                                        : 'border-[#e3e7df]'
                                        }`}
                                >
                                    <div className="grid gap-3 sm:grid-cols-[1fr_230px]">
                                        <label className="text-xs font-medium text-[#4d5a4f]">
                                            {index === 0
                                                ? 'First question'
                                                : `Question #${index + 1}`}
                                            <input
                                                required
                                                value={question.prompt}
                                                onChange={(event) =>
                                                    updateQuestion(index, {
                                                        prompt: event.target
                                                            .value,
                                                    })
                                                }
                                                placeholder="Question"
                                                className="mt-1.5 h-11 w-full rounded-t-lg border-b-2 border-[#d5ddd2] bg-[#f8faf7] px-3.5 text-sm font-medium text-[#233127] transition outline-none focus:border-[#2b5139] focus:bg-[#f1f5ef]"
                                            />
                                        </label>

                                        <label className="text-xs font-medium text-[#4d5a4f]">
                                            Question type
                                            <select
                                                value={question.type}
                                                onChange={(event) =>
                                                    updateQuestion(index, {
                                                        type: event.target
                                                            .value,
                                                    })
                                                }
                                                className="mt-1.5 h-11 w-full rounded-lg border border-[#d5ddd2] bg-white px-3 text-xs font-semibold text-[#29382e] outline-none focus:border-[#2b5139]"
                                            >
                                                {BUILDER_QUESTION_TYPES.map(
                                                    (typeOption) => (
                                                        <option
                                                            key={
                                                                typeOption.value
                                                            }
                                                            value={
                                                                typeOption.value
                                                            }
                                                        >
                                                            {typeOption.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </label>
                                    </div>

                                    {/* Google Forms Interactive Answer Area */}
                                    <div className="mt-4">
                                        {isChoice ? (
                                            <div className="space-y-2">
                                                {question.optionsList.map(
                                                    (optVal, optIdx) => (
                                                        <div
                                                            key={optIdx}
                                                            className="flex items-center gap-2.5"
                                                        >
                                                            <span className="w-5 text-center text-xs font-bold text-[#838c81]">
                                                                {question.type ===
                                                                    'radio'
                                                                    ? '○'
                                                                    : question.type ===
                                                                        'multiselect'
                                                                        ? '☐'
                                                                        : `${optIdx + 1}.`}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={optVal}
                                                                onChange={(e) =>
                                                                    updateQuestionOptionItem(
                                                                        index,
                                                                        optIdx,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder={`Option ${optIdx + 1}`}
                                                                className="h-9 flex-1 border-b border-transparent bg-transparent px-1 text-xs text-[#29382e] transition outline-none hover:border-[#dce2d9] focus:border-b-2 focus:border-[#2b5139]"
                                                            />
                                                            {question
                                                                .optionsList
                                                                .length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeQuestionOptionItem(
                                                                                index,
                                                                                optIdx,
                                                                            )
                                                                        }
                                                                        title="Remove option"
                                                                        className="rounded p-1 text-xs text-[#8a9289] hover:bg-[#f2f4f0] hover:text-[#8b4e43]"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                )}
                                                        </div>
                                                    ),
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            addQuestionOptionItem(
                                                                index,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2b5139] hover:underline"
                                                    >
                                                        <span>
                                                            {question.type ===
                                                                'radio'
                                                                ? '○'
                                                                : question.type ===
                                                                    'multiselect'
                                                                    ? '☐'
                                                                    : '+'}
                                                        </span>
                                                        <span>Add option</span>
                                                    </button>
                                                </div>

                                                <label className="mt-2 block text-[11px] font-medium text-[#7a8278]">
                                                    Answer choices (comma
                                                    separated quick-fill)
                                                    <input
                                                        value={question.options}
                                                        onChange={(event) => {
                                                            const raw =
                                                                event.target
                                                                    .value;
                                                            const split = raw
                                                                .split(',')
                                                                .map((s) =>
                                                                    s.trim(),
                                                                )
                                                                .filter(
                                                                    Boolean,
                                                                );
                                                            updateQuestion(
                                                                index,
                                                                {
                                                                    options:
                                                                        raw,
                                                                    optionsList:
                                                                        split.length
                                                                            ? split
                                                                            : [
                                                                                '',
                                                                            ],
                                                                },
                                                            );
                                                        }}
                                                        placeholder="e.g., Very Relevant, Moderately Relevant, Not Relevant"
                                                        className="mt-1 h-8 w-full rounded-lg border border-[#e6eae3] bg-[#fafbf9] px-2.5 text-[11px] text-[#4d5a4f]"
                                                    />
                                                </label>
                                            </div>
                                        ) : question.type === 'text' ? (
                                            <div className="max-w-xs border-b border-dotted border-[#b8c2b6] pb-1.5 text-xs text-[#8a9289]">
                                                Short answer text
                                            </div>
                                        ) : question.type === 'textarea' ? (
                                            <div className="max-w-lg border-b border-dotted border-[#b8c2b6] pb-4 text-xs text-[#8a9289]">
                                                Long answer paragraph text
                                            </div>
                                        ) : question.type === 'rating' ? (
                                            <div className="flex items-center gap-4 py-1 text-xs text-[#687267]">
                                                <span>Linear scale:</span>
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <span
                                                        key={n}
                                                        className="inline-flex size-7 items-center justify-center rounded-full border border-[#d5ddd2] bg-[#fafbf9] font-semibold"
                                                    >
                                                        {n}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : question.type === 'boolean' ? (
                                            <div className="flex gap-3 text-xs text-[#687267]">
                                                <span className="rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-3 py-1">
                                                    ○ Yes
                                                </span>
                                                <span className="rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-3 py-1">
                                                    ○ No
                                                </span>
                                            </div>
                                        ) : question.type === 'date' ? (
                                            <div className="max-w-[180px] border-b border-dotted border-[#b8c2b6] pb-1.5 text-xs text-[#8a9289]">
                                                Month, day, year 📅
                                            </div>
                                        ) : (
                                            <div className="max-w-[180px] border-b border-dotted border-[#b8c2b6] pb-1.5 text-xs text-[#8a9289]">
                                                Numeric value (0–9)
                                            </div>
                                        )}
                                    </div>

                                    {/* Google Forms Bottom Card Action Toolbar */}
                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#eff1ed] pt-3">
                                        <span className="text-[11px] font-medium text-[#7a8278]">
                                            Question {index + 1} of{' '}
                                            {questions.length}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={index === 0}
                                                onClick={() =>
                                                    moveQuestion(index, -1)
                                                }
                                                title="Move question up"
                                                className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#536055] hover:bg-[#f4f6f2] disabled:opacity-40"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                disabled={
                                                    index ===
                                                    questions.length - 1
                                                }
                                                onClick={() =>
                                                    moveQuestion(index, 1)
                                                }
                                                title="Move question down"
                                                className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#536055] hover:bg-[#f4f6f2] disabled:opacity-40"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    duplicateQuestion(index)
                                                }
                                                className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#4d5a4f] hover:bg-[#f4f6f2]"
                                            >
                                                Duplicate
                                            </button>
                                            {questions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeQuestion(index)
                                                    }
                                                    className="rounded-lg border border-[#ecd8d2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#8b4e43] hover:bg-[#fcf5f3]"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                            <div className="mx-1 h-4 w-px bg-[#e3e7df]" />
                                            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#4d5a4f]">
                                                <span>Required</span>
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        question.is_required
                                                    }
                                                    onChange={(e) =>
                                                        updateQuestion(index, {
                                                            is_required:
                                                                e.target
                                                                    .checked,
                                                        })
                                                    }
                                                    className="size-4 accent-[#2b5139]"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Google Forms Floating-Style Bottom Add Bar */}
                        <div className="flex items-center justify-between rounded-xl border border-[#dce3d9] bg-white px-4 py-3 shadow-2xs">
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#edf2eb] px-4 text-xs font-bold text-[#2b5139] transition hover:bg-[#dfe8dc]"
                            >
                                ⊕ Add question
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetBuilder();
                                        onCloseCreate();
                                    }}
                                    className="h-9 rounded-lg border border-[#e3e7df] px-3 text-xs font-medium text-[#687267]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="h-9 rounded-lg bg-[#2b5139] px-5 text-xs font-semibold text-white shadow-xs hover:bg-[#21402c] disabled:opacity-60"
                                >
                                    {creating
                                        ? 'Saving…'
                                        : editingSurveyId !== null
                                            ? 'Save changes'
                                            : 'Create survey'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : null}

            {surveys.length ? (
                surveys.map((survey) => {
                    const hasCohortRules = Boolean(
                        survey.target_department_ids?.length ||
                        survey.target_program_ids?.length ||
                        survey.target_graduation_years?.length,
                    );

                    return (
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
                                        {survey.is_anonymous && (
                                            <span className="rounded-full bg-[#edf2eb] px-2.5 py-1 text-[10px] font-semibold text-[#2b5139]">
                                                Anonymous
                                            </span>
                                        )}
                                        {survey.responses_count !==
                                            undefined && (
                                                <span className="rounded-full bg-[#f4f5f2] px-2.5 py-1 text-[10px] font-semibold text-[#546055]">
                                                    {survey.responses_count}{' '}
                                                    {survey.responses_count === 1
                                                        ? 'response'
                                                        : 'responses'}
                                                </span>
                                            )}
                                    </div>
                                    {survey.description ? (
                                        <p className="mt-1 text-xs leading-5 text-[#7a8278]">
                                            {survey.description}
                                        </p>
                                    ) : null}

                                    {/* Cohort & Schedule Badges */}
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#7c847a]">
                                        <span className="rounded bg-[#f6f7f4] px-2 py-0.5 font-medium">
                                            {hasCohortRules
                                                ? [
                                                    survey
                                                        .target_department_ids
                                                        ?.length
                                                        ? `${survey.target_department_ids.length} dept(s)`
                                                        : null,
                                                    survey.target_program_ids
                                                        ?.length
                                                        ? `${survey.target_program_ids.length} program(s)`
                                                        : null,
                                                    survey
                                                        .target_graduation_years
                                                        ?.length
                                                        ? `Batches: ${survey.target_graduation_years.join(', ')}`
                                                        : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')
                                                : 'All alumni cohorts'}
                                        </span>
                                        {survey.starts_at && (
                                            <span>
                                                Opens{' '}
                                                {new Date(
                                                    survey.starts_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        )}
                                        {survey.closes_at && (
                                            <span>
                                                Closes{' '}
                                                {new Date(
                                                    survey.closes_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {canViewAnalytics && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void toggleAnalytics(survey.id)
                                            }
                                            className="rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-3 py-2 text-[11px] font-semibold text-[#3f5242] hover:bg-[#eff2ed]"
                                        >
                                            {activeAnalyticsId === survey.id
                                                ? 'Hide analytics'
                                                : 'Analytics'}
                                        </button>
                                    )}
                                    {canManage &&
                                        (survey.responses_count ?? 0) === 0 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditSurvey(survey)
                                                }
                                                className="rounded-lg border border-[#e3e7df] bg-white px-3 py-2 text-[11px] font-semibold text-[#526054] hover:bg-[#f6f7f4]"
                                            >
                                                Edit
                                            </button>
                                        )}
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
                                    {canManage &&
                                        survey.status === 'published' ? (
                                        <button
                                            type="button"
                                            disabled={closing === survey.id}
                                            onClick={() =>
                                                void closeSurvey(survey.id)
                                            }
                                            className="rounded-lg border border-[#ecd8d2] bg-white px-3 py-2 text-[11px] font-semibold text-[#8b4e43] disabled:opacity-60"
                                        >
                                            {closing === survey.id
                                                ? 'Closing…'
                                                : 'Close survey'}
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {canManage ? (
                                <ul className="mt-3 space-y-1 border-t border-[#eff0ec] pt-3">
                                    {survey.questions.map((question, qIdx) => (
                                        <li
                                            key={question.id}
                                            className="text-[11px] text-[#6f786e]"
                                        >
                                            {qIdx + 1}. {question.prompt}{' '}
                                            <span className="text-[#969c94]">
                                                ·{' '}
                                                {QUESTION_TYPE_LABELS[
                                                    question.type
                                                ] ?? question.type}
                                                {question.is_required
                                                    ? ' (Required)'
                                                    : ' (Optional)'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : canRespond && !isProfileComplete ? (
                                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs">
                                    <div className="flex items-center gap-2 font-bold text-amber-950">
                                        <Lock className="size-4 text-[#E47818]" />
                                        Profile Completion Required to Participate
                                    </div>
                                    <p className="mt-1 text-[11px] text-amber-900/80 leading-relaxed">
                                        Please complete your alumni profile (gender, civil status, contact number, current address, and permanent address) before answering surveys.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setProfileModalOpen(true)}
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#E47818] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] cursor-pointer"
                                    >
                                        <Pencil className="size-3" />
                                        Complete Profile to Answer Survey
                                    </button>
                                </div>
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
                                    {survey.questions.map((question, qIdx) => (
                                        <li
                                            key={question.id}
                                            className="text-[11px] text-[#6f786e]"
                                        >
                                            {qIdx + 1}. {question.prompt}{' '}
                                            <span className="text-[#969c94]">
                                                ·{' '}
                                                {QUESTION_TYPE_LABELS[
                                                    question.type
                                                ] ?? question.type}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Inline Survey Analytics Breakdown */}
                            {activeAnalyticsId === survey.id && (
                                <div className="mt-4 rounded-xl border border-[#dfe6dc] bg-[#f8faf7] p-4">
                                    {analyticsLoading ? (
                                        <p className="text-xs text-[#6e776d]">
                                            Loading survey response analytics…
                                        </p>
                                    ) : analyticsData ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5eae2] pb-2.5">
                                                <h3 className="text-xs font-bold text-[#2b5139] uppercase">
                                                    Response Analytics ·{' '}
                                                    {
                                                        analyticsData.total_responses
                                                    }{' '}
                                                    Total Submissions
                                                </h3>
                                                <span className="text-[11px] text-[#687267]">
                                                    {analyticsData.is_anonymous
                                                        ? 'Anonymous mode active'
                                                        : 'Identifiable responses'}
                                                </span>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {analyticsData.questions.map(
                                                    (q) => (
                                                        <div
                                                            key={q.id}
                                                            className="rounded-xl border border-[#e6eae3] bg-white p-3.5"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="text-xs font-semibold text-[#314034]">
                                                                    {q.prompt}
                                                                </p>
                                                                <span className="shrink-0 text-[10px] font-medium text-[#69866c]">
                                                                    {
                                                                        q.answered_count
                                                                    }{' '}
                                                                    answered (
                                                                    {
                                                                        q.response_rate
                                                                    }
                                                                    %)
                                                                </span>
                                                            </div>
                                                            {q.distribution
                                                                .length > 0 ? (
                                                                <div className="mt-2.5 space-y-1.5">
                                                                    {q.distribution.map(
                                                                        (d) => (
                                                                            <div
                                                                                key={
                                                                                    d.label
                                                                                }
                                                                                className="text-[11px]"
                                                                            >
                                                                                <div className="flex justify-between text-[#556156]">
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            d.label
                                                                                        }
                                                                                    </span>
                                                                                    <span className="font-semibold">
                                                                                        {
                                                                                            d.count
                                                                                        }{' '}
                                                                                        (
                                                                                        {
                                                                                            d.percentage
                                                                                        }
                                                                                        %)
                                                                                    </span>
                                                                                </div>
                                                                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eef1ec]">
                                                                                    <div
                                                                                        className="h-full rounded-full bg-[#4b7254]"
                                                                                        style={{
                                                                                            width: `${Math.min(100, d.percentage)}%`,
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="mt-2 text-[11px] text-[#8a9289]">
                                                                    No responses
                                                                    recorded for
                                                                    this
                                                                    question
                                                                    yet.
                                                                </p>
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </article>
                    );
                })
            ) : (
                <EmptyState>
                    {canManage
                        ? 'No surveys have been created yet.'
                        : 'There are no open surveys right now.'}
                </EmptyState>
            )}

            <AlumniProfileCompletionModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                profile={alumniProfile}
                onSuccess={() => meRes.reload()}
            />
        </div>
    );
}

const ANNOUNCEMENT_CATEGORIES = [
    {
        value: 'general',
        label: 'General Update',
        badgeClass: 'bg-[#f2f4f0] text-[#556256]',
    },
    {
        value: 'event',
        label: 'Event / Homecoming',
        badgeClass: 'bg-[#edf2eb] text-[#2b5139]',
    },
    {
        value: 'career',
        label: 'Career & Jobs',
        badgeClass: 'bg-[#e8eff4] text-[#2c5270]',
    },
    {
        value: 'tracer',
        label: 'Tracer Notice',
        badgeClass: 'bg-[#f4efe6] text-[#7a5828]',
    },
    {
        value: 'scholarship',
        label: 'Scholarship / Grant',
        badgeClass: 'bg-[#efeaf4] text-[#583b78]',
    },
    {
        value: 'urgent',
        label: 'Urgent Advisory',
        badgeClass: 'bg-[#faeae8] text-[#9e382b]',
    },
] as const;

const AUDIENCE_ROLE_LABELS: Record<string, string> = {
    alumni: 'Alumni',
    employer: 'Employers',
    'alumni-coordinator': 'Alumni Coordinators',
    'department-coordinator': 'Department Coordinators',
};

export function AnnouncementCenter({
    role,
    createOpen,
    onCloseCreate,
}: {
    role: WorkspaceRole;
    createOpen: boolean;
    onCloseCreate: () => void;
}) {
    const canManage =
        role === 'Administrator' || role === 'Alumni coordinator';
    const { data, loading, error, reload } = useApiResource<
        ApiEnvelope<RawPagination<Announcement>>
    >(canManage ? '/api/announcements/manage' : '/api/announcements');
    const departmentsRes = useApiResource<ApiEnvelope<AcademicDepartment[]>>(
        canManage ? '/api/departments' : null,
    );
    const programsRes = useApiResource<ApiEnvelope<AcademicProgram[]>>(
        canManage ? '/api/programs' : null,
    );

    const [editingId, setEditingId] = useState<number | null>(null);
    const [composerOpen, setComposerOpen] = useState(false);
    const [showCohortTargeting, setShowCohortTargeting] = useState(false);

    const [form, setForm] = useState({
        title: '',
        body: '',
        category: 'general',
        is_pinned: false,
        is_public: true,
        publish_now: false,
        notify_audience: true,
        action_label: '',
        action_url: '',
        expires_at: '',
        audience_roles: [] as string[],
        target_department_ids: [] as number[],
        target_program_ids: [] as number[],
        graduation_years_text: '',
    });

    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState<number | null>(null);
    const [unpublishing, setUnpublishing] = useState<number | null>(null);
    const [pinningId, setPinningId] = useState<number | null>(null);

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const isFormVisible = canManage && (createOpen || composerOpen);

    function resetForm() {
        setEditingId(null);
        setComposerOpen(false);
        setShowCohortTargeting(false);
        setForm({
            title: '',
            body: '',
            category: 'general',
            is_pinned: false,
            is_public: true,
            publish_now: false,
            notify_audience: true,
            action_label: '',
            action_url: '',
            expires_at: '',
            audience_roles: [],
            target_department_ids: [],
            target_program_ids: [],
            graduation_years_text: '',
        });
        onCloseCreate();
    }

    function openEdit(item: Announcement) {
        setEditingId(item.id);
        const hasCohort = Boolean(
            item.target_department_ids?.length ||
            item.target_program_ids?.length ||
            item.target_graduation_years?.length,
        );
        setShowCohortTargeting(hasCohort);
        setForm({
            title: item.title,
            body: item.body,
            category: item.category ?? 'general',
            is_pinned: Boolean(item.is_pinned),
            is_public: item.is_public ?? true,
            publish_now: false,
            notify_audience: false,
            action_label: item.action_label ?? '',
            action_url: item.action_url ?? '',
            expires_at: item.expires_at ? item.expires_at.slice(0, 10) : '',
            audience_roles: item.audience_roles ?? [],
            target_department_ids: item.target_department_ids ?? [],
            target_program_ids: item.target_program_ids ?? [],
            graduation_years_text: (item.target_graduation_years ?? []).join(
                ', ',
            ),
        });
        setComposerOpen(true);
    }

    async function saveAnnouncement(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);

        const parsedYears = form.graduation_years_text
            .split(',')
            .map((s) => Number.parseInt(s.trim(), 10))
            .filter((n) => !Number.isNaN(n) && n >= 1950 && n <= 2100);

        const payload = {
            title: form.title,
            body: form.body,
            category: form.category,
            is_pinned: form.is_pinned,
            is_public: form.is_public,
            action_label: form.action_label.trim() || null,
            action_url: form.action_url.trim() || null,
            expires_at: form.expires_at || null,
            audience_roles: form.audience_roles.length
                ? form.audience_roles
                : null,
            target_department_ids: form.target_department_ids.length
                ? form.target_department_ids
                : null,
            target_program_ids: form.target_program_ids.length
                ? form.target_program_ids
                : null,
            target_graduation_years: parsedYears.length ? parsedYears : null,
            ...(editingId === null
                ? {
                    publish_now: form.publish_now,
                    notify_audience: form.notify_audience,
                }
                : {}),
        };

        try {
            if (editingId !== null) {
                await apiRequest<ApiEnvelope<Announcement>>(
                    `/api/announcements/${editingId}`,
                    {
                        method: 'PATCH',
                        body: payload,
                    },
                );
                toast.success('Announcement updated.');
            } else {
                await apiRequest<ApiEnvelope<Announcement>>(
                    '/api/announcements',
                    {
                        method: 'POST',
                        body: payload,
                    },
                );
                toast.success(
                    form.publish_now
                        ? 'Announcement published.'
                        : 'Announcement created as a draft.',
                );
            }
            resetForm();
            reload();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Announcement could not be saved.',
            );
        } finally {
            setSaving(false);
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

    async function unpublishAnnouncement(
        id: number,
        nextStatus: 'draft' | 'archived' = 'draft',
    ) {
        setUnpublishing(id);
        try {
            await apiRequest<ApiEnvelope<Announcement>>(
                `/api/announcements/${id}/unpublish`,
                {
                    method: 'POST',
                    body: { status: nextStatus },
                },
            );
            reload();
            toast.success(
                nextStatus === 'archived'
                    ? 'Announcement archived.'
                    : 'Announcement moved back to drafts.',
            );
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Announcement status could not be updated.',
            );
        } finally {
            setUnpublishing(null);
        }
    }

    async function togglePinAnnouncement(item: Announcement) {
        setPinningId(item.id);
        try {
            await apiRequest<ApiEnvelope<Announcement>>(
                `/api/announcements/${item.id}`,
                {
                    method: 'PATCH',
                    body: { is_pinned: !item.is_pinned },
                },
            );
            reload();
            toast.success(
                item.is_pinned
                    ? 'Announcement unpinned.'
                    : 'Announcement pinned to top.',
            );
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Pin status could not be updated.',
            );
        } finally {
            setPinningId(null);
        }
    }

    async function deleteAnnouncement(id: number): Promise<boolean> {
        try {
            await apiRequest(`/api/announcements/${id}`, {
                method: 'DELETE',
            });
            reload();
            toast.success('Announcement deleted.');
            return true;
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Announcement could not be deleted.',
            );
            return false;
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const announcements = data?.data.data ?? [];
    const departmentsList = departmentsRes.data?.data ?? [];
    const programsList = programsRes.data?.data ?? [];

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredAnnouncements = announcements.filter((item) => {
        if (statusFilter === 'pinned' && !item.is_pinned) return false;
        if (
            statusFilter !== 'all' &&
            statusFilter !== 'pinned' &&
            item.status !== statusFilter
        ) {
            return false;
        }
        if (
            categoryFilter !== 'all' &&
            (item.category ?? 'general') !== categoryFilter
        ) {
            return false;
        }
        if (!normalizedQuery) return true;
        return (
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.body.toLowerCase().includes(normalizedQuery) ||
            (item.author?.name.toLowerCase().includes(normalizedQuery) ?? false)
        );
    });

    const publishedCount = announcements.filter(
        (a) => a.status === 'published',
    ).length;
    const draftCount = announcements.filter((a) => a.status === 'draft').length;
    const pinnedCount = announcements.filter((a) => a.is_pinned).length;

    return (
        <div className="space-y-4">
            {/* Summary, Search & Filter Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#edf2eb] px-3 py-1 text-xs font-semibold text-[#2b5139]">
                            {publishedCount} Published
                        </span>
                        {pinnedCount > 0 && (
                            <span className="rounded-full bg-[#f4efe6] px-3 py-1 text-xs font-semibold text-[#7a5828]">
                                📌 {pinnedCount} Pinned
                            </span>
                        )}
                        {canManage && (
                            <span className="rounded-full bg-[#f3f5f1] px-3 py-1 text-xs font-medium text-[#5d685e]">
                                {draftCount} Drafts
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-[#eff0ec] pt-3 lg:flex-row lg:items-center lg:justify-between">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search announcements by title, keyword, or author…"
                        className="h-9 w-full rounded-xl border border-[#dfe5dd] bg-[#fafbf9] px-3 text-xs text-[#29382e] outline-none focus:border-[#6d8b72] lg:max-w-xs"
                    />

                    <div className="flex flex-wrap items-center gap-1.5">
                        {canManage &&
                            (
                                [
                                    ['all', 'All'],
                                    ['pinned', '📌 Pinned'],
                                    ['published', 'Published'],
                                    ['draft', 'Drafts'],
                                    ['archived', 'Archived'],
                                ] as const
                            ).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setStatusFilter(key)}
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${statusFilter === key
                                            ? 'bg-[#2b5139] text-white'
                                            : 'border border-[#e2e7df] bg-[#fafbf9] text-[#5e6a5f] hover:bg-[#eff2ed]'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}

                        <select
                            aria-label="Filter by category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="h-7 rounded-full border border-[#dce2d9] bg-white px-2.5 text-[11px] font-medium text-[#4d5a4f] outline-none"
                        >
                            <option value="all">All Categories</option>
                            {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Create / Edit Announcement Composer */}
            {isFormVisible ? (
                <form
                    onSubmit={saveAnnouncement}
                    className="space-y-4 rounded-2xl border border-[#cfe0cc] bg-white p-4 shadow-2xs sm:p-5"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eff0ec] pb-3">
                        <div>
                            <h3 className="text-sm font-semibold text-[#29382e]">
                                {editingId !== null
                                    ? 'Edit Announcement'
                                    : 'Create Institutional Announcement'}
                            </h3>
                            <p className="text-xs text-[#737c72]">
                                Broadcast updates, career fairs, homecoming
                                events, or cohort-specific tracer notices.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setShowCohortTargeting((prev) => !prev)
                            }
                            className="rounded-lg border border-[#cfe0cc] bg-[#edf2eb] px-3 py-1.5 text-[11px] font-semibold text-[#2b5139] hover:bg-[#e1ebe0]"
                        >
                            {showCohortTargeting
                                ? 'Hide cohort targeting'
                                : '🎯 Target specific department / program / batch'}
                        </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                            Title
                            <input
                                required
                                maxLength={180}
                                value={form.title}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        title: event.target.value,
                                    })
                                }
                                placeholder="e.g., Grand Alumni Homecoming 2026 & Career Fair"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Category
                            <select
                                value={form.category}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        category: event.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                            >
                                {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className="block text-xs font-medium text-[#4d5a4f]">
                        Announcement body
                        <textarea
                            required
                            value={form.body}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    body: event.target.value,
                                })
                            }
                            placeholder="Write the full announcement details, schedule, venue, or instructions…"
                            className="mt-1.5 min-h-28 w-full rounded-lg border border-[#e3e7df] p-3 text-xs"
                        />
                    </label>

                    {/* Optional Call-To-Action & Expiration Date */}
                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Call-to-action button label (optional)
                            <input
                                maxLength={80}
                                value={form.action_label}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        action_label: event.target.value,
                                    })
                                }
                                placeholder="e.g., Register Now, View Schedule"
                                className="mt-1.5 h-9 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Call-to-action link URL (optional)
                            <input
                                maxLength={500}
                                value={form.action_url}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        action_url: event.target.value,
                                    })
                                }
                                placeholder="https://… or /alumni/registration-assistance"
                                className="mt-1.5 h-9 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Expiration date (optional)
                            <input
                                type="date"
                                value={form.expires_at}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        expires_at: event.target.value,
                                    })
                                }
                                className="mt-1.5 h-9 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    </div>

                    {/* Audience Roles */}
                    <fieldset className="flex flex-wrap gap-4 rounded-xl border border-[#eff0ec] bg-[#fafbf9] p-3 text-xs text-[#687267]">
                        <legend className="px-1 font-semibold text-[#4d5a4f]">
                            Audience roles (leave blank for all authenticated
                            users)
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
                                    className="size-3.5 accent-[#2b5139]"
                                />
                                {label}
                            </label>
                        ))}
                    </fieldset>

                    {/* Cohort Targeting Panel (P3) */}
                    {showCohortTargeting && (
                        <div className="space-y-3 rounded-xl border border-[#dce4d9] bg-[#f8faf7] p-4">
                            <div>
                                <h4 className="text-xs font-semibold text-[#2b5139]">
                                    Cohort Targeting (Optional)
                                </h4>
                                <p className="text-[11px] text-[#6d776c]">
                                    Restrict which alumni cohorts see this
                                    announcement based on their academic
                                    department, degree program, or graduation
                                    year.
                                </p>
                            </div>

                            {departmentsList.length > 0 && (
                                <div>
                                    <p className="mb-1.5 text-[11px] font-medium text-[#4d5a4f]">
                                        Target Departments
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {departmentsList.map((dept) => {
                                            const active =
                                                form.target_department_ids.includes(
                                                    dept.id,
                                                );
                                            return (
                                                <button
                                                    key={dept.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setForm({
                                                            ...form,
                                                            target_department_ids:
                                                                active
                                                                    ? form.target_department_ids.filter(
                                                                        (
                                                                            id,
                                                                        ) =>
                                                                            id !==
                                                                            dept.id,
                                                                    )
                                                                    : [
                                                                        ...form.target_department_ids,
                                                                        dept.id,
                                                                    ],
                                                        })
                                                    }
                                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${active
                                                            ? 'bg-[#2b5139] text-white'
                                                            : 'border border-[#dce2d9] bg-white text-[#526053]'
                                                        }`}
                                                >
                                                    {dept.code} · {dept.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {programsList.length > 0 && (
                                <div>
                                    <p className="mb-1.5 text-[11px] font-medium text-[#4d5a4f]">
                                        Target Academic Programs
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {programsList.map((prog) => {
                                            const active =
                                                form.target_program_ids.includes(
                                                    prog.id,
                                                );
                                            return (
                                                <button
                                                    key={prog.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setForm({
                                                            ...form,
                                                            target_program_ids:
                                                                active
                                                                    ? form.target_program_ids.filter(
                                                                        (
                                                                            id,
                                                                        ) =>
                                                                            id !==
                                                                            prog.id,
                                                                    )
                                                                    : [
                                                                        ...form.target_program_ids,
                                                                        prog.id,
                                                                    ],
                                                        })
                                                    }
                                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${active
                                                            ? 'bg-[#2b5139] text-white'
                                                            : 'border border-[#dce2d9] bg-white text-[#526053]'
                                                        }`}
                                                >
                                                    {prog.code}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <label className="block text-xs font-medium text-[#4d5a4f]">
                                Target Graduation Years (comma-separated,
                                optional)
                                <input
                                    value={form.graduation_years_text}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            graduation_years_text:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="e.g., 2022, 2023, 2024"
                                    className="mt-1 h-9 w-full max-w-sm rounded-lg border border-[#dce2d9] bg-white px-3 text-xs"
                                />
                            </label>
                        </div>
                    )}

                    {/* Display & Publishing Options */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eff0ec] pt-3">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#4d5a4f]">
                            <label className="flex items-center gap-2 font-medium">
                                <input
                                    type="checkbox"
                                    checked={form.is_pinned}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            is_pinned: e.target.checked,
                                        })
                                    }
                                    className="size-3.5 accent-[#2b5139]"
                                />
                                📌 Pin to top of feed
                            </label>

                            <label className="flex items-center gap-2 font-medium">
                                <input
                                    type="checkbox"
                                    checked={form.is_public}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            is_public: e.target.checked,
                                        })
                                    }
                                    className="size-3.5 accent-[#2b5139]"
                                />
                                🌐 Show on public homepage
                            </label>

                            {editingId === null && (
                                <label className="flex items-center gap-2 font-semibold text-[#2b5139]">
                                    <input
                                        type="checkbox"
                                        checked={form.publish_now}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                publish_now: e.target.checked,
                                            })
                                        }
                                        className="size-3.5 accent-[#2b5139]"
                                    />
                                    Publish immediately
                                </label>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="h-9 rounded-lg border border-[#e8eae4] px-3 text-xs font-medium text-[#687267]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                            >
                                {saving
                                    ? 'Saving…'
                                    : editingId !== null
                                        ? 'Save changes'
                                        : form.publish_now
                                            ? 'Create & publish'
                                            : 'Create announcement'}
                            </button>
                        </div>
                    </div>
                </form>
            ) : null}

            {/* Announcements Feed */}
            {filteredAnnouncements.length ? (
                <div className="space-y-3">
                    {filteredAnnouncements.map((announcement) => {
                        const catMeta =
                            ANNOUNCEMENT_CATEGORIES.find(
                                (c) =>
                                    c.value ===
                                    (announcement.category ?? 'general'),
                            ) ?? ANNOUNCEMENT_CATEGORIES[0];
                        const hasCohort = Boolean(
                            announcement.target_department_ids?.length ||
                            announcement.target_program_ids?.length ||
                            announcement.target_graduation_years?.length,
                        );

                        return (
                            <article
                                key={announcement.id}
                                className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-start sm:p-5 ${announcement.is_pinned
                                        ? 'border-[#cfe0cc] bg-[#fbfcfa]'
                                        : 'border-[#e9ebe5] bg-white'
                                    }`}
                            >
                                <span
                                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${announcement.is_pinned
                                            ? 'bg-[#2b5139] text-white'
                                            : 'bg-[#eef2eb] text-[#5e795f]'
                                        }`}
                                >
                                    <MessageSquareText className="size-4" />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {announcement.is_pinned && (
                                            <span className="rounded-full bg-[#2b5139] px-2.5 py-0.5 text-[10px] font-bold text-white">
                                                📌 Pinned
                                            </span>
                                        )}
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${catMeta.badgeClass}`}
                                        >
                                            {catMeta.label}
                                        </span>
                                        <span className="rounded-full bg-[#f2f3ef] px-2.5 py-0.5 text-[10px] font-medium text-[#697367] capitalize">
                                            {announcement.status}
                                        </span>
                                        {canManage &&
                                            announcement.is_public ===
                                            false && (
                                                <span className="rounded-full bg-[#f4f1ea] px-2.5 py-0.5 text-[10px] font-medium text-[#7c6a46]">
                                                    Internal only
                                                </span>
                                            )}
                                    </div>

                                    <h2 className="mt-2 text-sm font-semibold text-[#39463b]">
                                        {announcement.title}
                                    </h2>

                                    <p className="mt-1 text-xs leading-5 whitespace-pre-line text-[#7a8278]">
                                        {announcement.body}
                                    </p>

                                    {announcement.action_url && (
                                        <div className="mt-3">
                                            <a
                                                href={announcement.action_url}
                                                target={
                                                    announcement.action_url.startsWith(
                                                        'http',
                                                    )
                                                        ? '_blank'
                                                        : undefined
                                                }
                                                rel={
                                                    announcement.action_url.startsWith(
                                                        'http',
                                                    )
                                                        ? 'noopener noreferrer'
                                                        : undefined
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#edf2eb] px-3 py-1.5 text-xs font-semibold text-[#2b5139] transition hover:bg-[#dfe8dc]"
                                            >
                                                {announcement.action_label ||
                                                    'Learn more'}{' '}
                                                <ArrowRight className="size-3" />
                                            </a>
                                        </div>
                                    )}

                                    {/* Audience & Metadata Footer */}
                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#858b82]">
                                        <span>
                                            {announcement.published_at
                                                ? `Published ${new Date(announcement.published_at).toLocaleDateString()}`
                                                : `Created ${new Date(announcement.created_at).toLocaleDateString()}`}
                                        </span>
                                        {announcement.author?.name && (
                                            <span>
                                                · by {announcement.author.name}
                                            </span>
                                        )}
                                        {announcement.expires_at && (
                                            <span>
                                                · Expires{' '}
                                                {new Date(
                                                    announcement.expires_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        )}
                                        {canManage && (
                                            <span className="rounded bg-[#f5f6f3] px-2 py-0.5 font-medium text-[#616b60]">
                                                Audience:{' '}
                                                {announcement.audience_roles
                                                    ?.length
                                                    ? announcement.audience_roles
                                                        .map(
                                                            (r) =>
                                                                AUDIENCE_ROLE_LABELS[
                                                                r
                                                                ] ?? r,
                                                        )
                                                        .join(', ')
                                                    : 'All roles'}
                                            </span>
                                        )}
                                        {hasCohort && (
                                            <span className="rounded bg-[#edf2eb] px-2 py-0.5 font-medium text-[#2b5139]">
                                                🎯{' '}
                                                {[
                                                    announcement
                                                        .target_department_ids
                                                        ?.length
                                                        ? `${announcement.target_department_ids.length} dept(s)`
                                                        : null,
                                                    announcement
                                                        .target_program_ids
                                                        ?.length
                                                        ? `${announcement.target_program_ids.length} program(s)`
                                                        : null,
                                                    announcement
                                                        .target_graduation_years
                                                        ?.length
                                                        ? `Batch ${announcement.target_graduation_years.join(', ')}`
                                                        : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Manager Action Controls */}
                                {canManage && (
                                    <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
                                        <button
                                            type="button"
                                            disabled={
                                                pinningId === announcement.id
                                            }
                                            onClick={() =>
                                                void togglePinAnnouncement(
                                                    announcement,
                                                )
                                            }
                                            className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#526054] hover:bg-[#f6f7f4] disabled:opacity-60"
                                        >
                                            {announcement.is_pinned
                                                ? 'Unpin'
                                                : 'Pin'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEdit(announcement)
                                            }
                                            className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#526054] hover:bg-[#f6f7f4]"
                                        >
                                            Edit
                                        </button>

                                        {announcement.status !== 'published' ? (
                                            <button
                                                type="button"
                                                disabled={
                                                    publishing ===
                                                    announcement.id
                                                }
                                                onClick={() =>
                                                    void publishAnnouncement(
                                                        announcement.id,
                                                    )
                                                }
                                                className="rounded-lg bg-[#2b5139] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                                            >
                                                {publishing === announcement.id
                                                    ? 'Publishing…'
                                                    : 'Publish'}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={
                                                    unpublishing ===
                                                    announcement.id
                                                }
                                                onClick={() =>
                                                    void unpublishAnnouncement(
                                                        announcement.id,
                                                        'draft',
                                                    )
                                                }
                                                className="rounded-lg border border-[#e5dfd3] bg-[#faf8f4] px-2.5 py-1.5 text-[11px] font-semibold text-[#7a6338] disabled:opacity-60"
                                            >
                                                {unpublishing ===
                                                    announcement.id
                                                    ? 'Updating…'
                                                    : 'Unpublish'}
                                            </button>
                                        )}

                                        <ConfirmationDialog
                                            title="Delete announcement?"
                                            description={`This will permanently delete "${announcement.title}".`}
                                            confirmLabel="Delete announcement"
                                            onConfirm={() =>
                                                deleteAnnouncement(
                                                    announcement.id,
                                                )
                                            }
                                        >
                                            <button
                                                type="button"
                                                className="rounded-lg border border-[#ecd8d2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#8b4e43] hover:bg-[#fdf7f5]"
                                            >
                                                Delete
                                            </button>
                                        </ConfirmationDialog>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            ) : (
                <EmptyState>
                    {canManage
                        ? 'No announcements match your current filter.'
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

function formatSalary(min: number | null, max: number | null): string | null {
    if (!min && !max) return null;
    const fmt = (n: number) => `₱${n.toLocaleString()}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} / mo`;
    if (min) return `From ${fmt(min)} / mo`;
    if (max) return `Up to ${fmt(max)} / mo`;
    return null;
}

export function PublicJobs({
    onNavigate,
}: {
    onNavigate?: (page: string) => void;
} = {}) {
    const jobs =
        useApiResource<ApiEnvelope<RawPagination<JobPosting>>>('/api/jobs');
    const applications = useApiResource<
        ApiEnvelope<RawPagination<JobApplication>>
    >('/api/applications/me');
    const profileResource =
        useApiResource<ApiEnvelope<AlumniProfile>>('/api/me/alumni');
    const profile = profileResource.data?.data;
    const isProfileComplete = Boolean(profile?.is_complete);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const documentsResource = useApiResource<
        ApiEnvelope<AlumniDocumentItem[]>
    >(profile?.id ? `/api/alumni/${profile.id}/documents` : null);

    const [searchQuery, setSearchQuery] = useState('');
    const [workplaceFilter, setWorkplaceFilter] = useState('all');
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
    const [selectedJobForDetails, setSelectedJobForDetails] =
        useState<JobPosting | null>(null);
    const [selectedJobForApply, setSelectedJobForApply] =
        useState<JobPosting | null>(null);

    // Application Form State
    const [resumeChoice, setResumeChoice] = useState<'archive' | 'upload'>('archive');
    const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [agreedToConsent, setAgreedToConsent] = useState(false);
    const [applying, setApplying] = useState(false);

    const archivedResumes = (documentsResource.data?.data ?? []).filter(
        (d) => d.document_type === 'resume',
    );
    const latestArchivedResume = archivedResumes[0];

    useEffect(() => {
        if (latestArchivedResume) {
            setResumeChoice('archive');
        } else {
            setResumeChoice('upload');
        }
    }, [latestArchivedResume]);

    // Escape key handling for modals
    useEffect(() => {
        if (!selectedJobForDetails && !selectedJobForApply) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedJobForDetails(null);
                setSelectedJobForApply(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedJobForDetails, selectedJobForApply]);

    function startApply(job: JobPosting) {
        if (!isProfileComplete) {
            toast.error(
                'Please complete your profile (gender, civil status, contact number, current address, and permanent address) before applying for jobs.',
            );
            setProfileModalOpen(true);
            return;
        }
        setSelectedJobForApply(job);
    }

    async function handleApplySubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedJobForApply) return;
        if (!isProfileComplete) {
            toast.error(
                'Please complete your profile (gender, civil status, contact number, current address, and permanent address) before applying for jobs.',
            );
            setSelectedJobForApply(null);
            setProfileModalOpen(true);
            return;
        }
        if (!agreedToConsent) {
            toast.error(
                'Please authorize the transmission of your verified credentials.',
            );
            return;
        }

        setApplying(true);
        const formData = new FormData();
        if (coverLetter.trim()) {
            formData.append('cover_letter', coverLetter.trim());
        }
        if (resumeChoice === 'upload' && selectedResumeFile) {
            formData.append('resume', selectedResumeFile);
        }

        try {
            await apiRequest<ApiEnvelope<JobApplication>>(
                `/api/jobs/${selectedJobForApply.id}/applications`,
                {
                    method: 'POST',
                    body: formData,
                },
            );
            applications.reload();
            toast.success(
                `Application submitted to ${selectedJobForApply.employer?.company_name ?? 'employer'}!`,
            );
            setSelectedJobForApply(null);
            setCoverLetter('');
            setSelectedResumeFile(null);
            setAgreedToConsent(false);
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Application could not be submitted.',
            );
        } finally {
            setApplying(false);
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

    const postings = jobs.data?.data.data ?? [];
    const submittedApplications = applications.data?.data.data ?? [];
    const applicationByJobId = new Map(
        submittedApplications.map((app) => [Number(app.job_posting_id), app]),
    );

    const filteredPostings = postings.filter((job) => {
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchesTitle = job.title.toLowerCase().includes(q);
            const matchesEmployer = job.employer?.company_name
                .toLowerCase()
                .includes(q);
            const matchesLocation = job.location?.toLowerCase().includes(q);
            const matchesDesc = job.description.toLowerCase().includes(q);
            if (!matchesTitle && !matchesEmployer && !matchesLocation && !matchesDesc) {
                return false;
            }
        }
        if (workplaceFilter !== 'all' && job.workplace_type !== workplaceFilter) {
            return false;
        }
        if (
            employmentTypeFilter !== 'all' &&
            job.employment_type?.toLowerCase() !== employmentTypeFilter.toLowerCase()
        ) {
            return false;
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Opportunities Hero Header */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001c17] via-[#052d26] to-[#0b382f] p-6 text-white shadow-lg sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[#E47818]/15 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/20 text-[#E47818]">
                            <BriefcaseBusiness className="size-8" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                    Career Opportunities
                                </h1>
                                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-500/30">
                                    Verified Partners
                                </span>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-emerald-100/80">
                                Explore official roles shared by verified industry partners actively seeking SEAIT alumni.
                            </p>
                        </div>
                    </div>
                    {onNavigate && (
                        <button
                            type="button"
                            onClick={() => onNavigate('My applications')}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 focus:outline-hidden focus:ring-2 focus:ring-white/40 cursor-pointer self-start sm:self-center"
                        >
                            <FileCheck className="size-4" />
                            My Applications ({submittedApplications.length})
                        </button>
                    )}
                </div>
            </section>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search by job title, company, or skills…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#E47818] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/20"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <select
                        value={workplaceFilter}
                        onChange={(e) => setWorkplaceFilter(e.target.value)}
                        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-700 focus:border-[#E47818] focus:outline-hidden"
                    >
                        <option value="all">All Workplace Types</option>
                        <option value="onsite">On-site</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="remote">Remote</option>
                    </select>

                    <select
                        value={employmentTypeFilter}
                        onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-700 focus:border-[#E47818] focus:outline-hidden"
                    >
                        <option value="all">All Employment Types</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contractual">Contractual</option>
                        <option value="internship">Internship</option>
                    </select>

                    {(searchQuery || workplaceFilter !== 'all' || employmentTypeFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setWorkplaceFilter('all');
                                setEmploymentTypeFilter('all');
                            }}
                            className="text-xs font-semibold text-[#E47818] hover:underline px-2 cursor-pointer"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Jobs Grid */}
            {filteredPostings.length ? (
                <div className="grid gap-5 lg:grid-cols-2">
                    {filteredPostings.map((job) => {
                        const application = applicationByJobId.get(job.id);
                        const isApplied = Boolean(application);
                        const salaryText = formatSalary(job.salary_min, job.salary_max);

                        return (
                            <article
                                key={job.id}
                                className="relative flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs transition hover:border-[#E47818]/40 hover:shadow-md"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#001c17] text-base font-bold text-white shadow-xs">
                                                {initials(job.employer?.company_name ?? 'Company')}
                                            </span>
                                            <div className="min-w-0">
                                                <h2 className="text-base font-bold text-zinc-900 truncate">
                                                    {job.title}
                                                </h2>
                                                <p className="mt-0.5 text-xs font-semibold text-zinc-600 flex items-center gap-1.5 truncate">
                                                    <span>{job.employer?.company_name ?? 'Employer Partner'}</span>
                                                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                                                </p>
                                            </div>
                                        </div>

                                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 capitalize shrink-0">
                                            {job.employment_type ?? 'Full-time'}
                                        </span>
                                    </div>

                                    {/* Metadata chips */}
                                    <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
                                        {job.location && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-zinc-600">
                                                <MapPin className="size-3" />
                                                {job.location}
                                            </span>
                                        )}
                                        {job.workplace_type && (
                                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-zinc-600 capitalize">
                                                {job.workplace_type}
                                            </span>
                                        )}
                                        {salaryText && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 border border-emerald-200">
                                                <Coins className="size-3 text-emerald-600" />
                                                {salaryText}
                                            </span>
                                        )}
                                        {job.closes_at && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-zinc-500 text-[11px]">
                                                <Clock className="size-3" />
                                                Closes {new Date(job.closes_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description snippet */}
                                    <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-zinc-600 whitespace-pre-line">
                                        {job.description}
                                    </p>
                                </div>

                                {/* Card Actions */}
                                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                                    {isApplied ? (
                                        <div className="flex items-center justify-between w-full">
                                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                Application Submitted
                                                <span className="text-[10px] text-emerald-600 font-normal">
                                                    ({application?.status.replace('_', ' ')})
                                                </span>
                                            </span>
                                            {onNavigate && (
                                                <button
                                                    type="button"
                                                    onClick={() => onNavigate('My applications')}
                                                    className="text-xs font-semibold text-[#001c17] hover:underline cursor-pointer"
                                                >
                                                    View status →
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedJobForDetails(job)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                                            >
                                                <Eye className="size-3.5" />
                                                View Job Details
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => startApply(job)}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E47818] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] transition cursor-pointer"
                                            >
                                                Apply with Verified Record
                                                <ArrowRight className="size-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-zinc-200 p-12 text-center">
                    <Briefcase className="size-10 mx-auto text-zinc-300" />
                    <h3 className="mt-3 text-sm font-bold text-zinc-800">
                        No job postings match your filter
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                        Try adjusting your keywords or workplace filters.
                    </p>
                </div>
            )}

            {/* Job Details Modal */}
            {selectedJobForDetails && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={() => setSelectedJobForDetails(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Job Details"
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-start justify-between pb-5 border-b border-zinc-100">
                            <div className="flex items-center gap-4 min-w-0">
                                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#001c17] text-lg font-bold text-white shadow-sm">
                                    {initials(selectedJobForDetails.employer?.company_name ?? 'Company')}
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-zinc-900">
                                        {selectedJobForDetails.title}
                                    </h2>
                                    <p className="text-xs font-semibold text-zinc-600 flex items-center gap-1.5 mt-0.5">
                                        <span>{selectedJobForDetails.employer?.company_name}</span>
                                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                                        {selectedJobForDetails.employer?.website && (
                                            <a
                                                href={selectedJobForDetails.employer.website}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[#E47818] hover:underline inline-flex items-center gap-0.5 text-[11px]"
                                            >
                                                Visit Website <ExternalLink className="size-2.5" />
                                            </a>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedJobForDetails(null)}
                                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-5 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                                {selectedJobForDetails.location && (
                                    <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">
                                        📍 {selectedJobForDetails.location}
                                    </span>
                                )}
                                {selectedJobForDetails.employment_type && (
                                    <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700 capitalize">
                                        💼 {selectedJobForDetails.employment_type}
                                    </span>
                                )}
                                {selectedJobForDetails.workplace_type && (
                                    <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700 capitalize">
                                        🏢 {selectedJobForDetails.workplace_type}
                                    </span>
                                )}
                                {formatSalary(selectedJobForDetails.salary_min, selectedJobForDetails.salary_max) && (
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-800 border border-emerald-200">
                                        💰 {formatSalary(selectedJobForDetails.salary_min, selectedJobForDetails.salary_max)}
                                    </span>
                                )}
                            </div>

                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                    Position Overview & Requirements
                                </h3>
                                <div className="mt-2 text-xs leading-relaxed text-zinc-700 whitespace-pre-line rounded-2xl bg-zinc-50/70 p-4 border border-zinc-100">
                                    {selectedJobForDetails.description}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
                                <p className="font-semibold text-amber-950 flex items-center gap-1.5 text-xs">
                                    <ShieldCheck className="size-4 text-[#E47818]" />
                                    Verified SEAIT Recruitment Partner
                                </p>
                                <p className="mt-1 text-[11px] text-amber-800/80 leading-relaxed">
                                    Applications through this portal transmit your verified alumni academic credentials and tracer records directly to the hiring coordinator.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
                            <button
                                type="button"
                                onClick={() => setSelectedJobForDetails(null)}
                                className="h-10 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                            >
                                Close
                            </button>
                            {!applicationByJobId.has(selectedJobForDetails.id) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const j = selectedJobForDetails;
                                        setSelectedJobForDetails(null);
                                        startApply(j);
                                    }}
                                    className="h-10 rounded-xl bg-[#E47818] px-5 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] cursor-pointer"
                                >
                                    Apply with Verified Record
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Step-by-Step Job Application Modal */}
            {selectedJobForApply && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={() => setSelectedJobForApply(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Job Application Form"
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
                            <div className="flex items-center gap-3">
                                <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-[#E47818]">
                                    <Briefcase className="size-5" />
                                </span>
                                <div>
                                    <h2 className="text-base font-bold text-zinc-900">
                                        Apply for {selectedJobForApply.title}
                                    </h2>
                                    <p className="text-xs text-zinc-500">
                                        {selectedJobForApply.employer?.company_name} · Official Alumni Application
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedJobForApply(null)}
                                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleApplySubmit} className="mt-5 space-y-5">
                            {/* Section 1: Verified Credentials Snapshot Preview */}
                            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                                    <ShieldCheck className="size-4 text-emerald-600" />
                                    Verified SEAIT Credentials Snapshot (RA 10173)
                                </div>
                                <p className="mt-1 text-[11px] text-emerald-800/80 leading-relaxed">
                                    To ensure trust with partner employers, ATMS captures an immutable snapshot of your registrar-verified credentials with this application:
                                </p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="rounded-lg bg-white p-2 border border-emerald-200/60">
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">Applicant</span>
                                        <span className="font-semibold text-zinc-900">{profile?.name ?? 'Verified Alumni'}</span>
                                    </div>
                                    <div className="rounded-lg bg-white p-2 border border-emerald-200/60">
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">Degree Program</span>
                                        <span className="font-semibold text-zinc-900 truncate block">
                                            {profile?.education_records?.[0]?.program ?? 'Degree Program'}
                                        </span>
                                    </div>
                                    <div className="rounded-lg bg-white p-2 border border-emerald-200/60">
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">Class Year & Honors</span>
                                        <span className="font-semibold text-zinc-900">
                                            Class of {profile?.education_records?.[0]?.graduation_year ?? 'Alumni'}
                                            {profile?.education_records?.[0]?.honors ? ` · ${profile.education_records[0].honors}` : ''}
                                        </span>
                                    </div>
                                    <div className="rounded-lg bg-white p-2 border border-emerald-200/60">
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">Current Career Status</span>
                                        <span className="font-semibold text-zinc-900 truncate block">
                                            {profile?.employment_records?.[0]?.job_title ?? 'Active Job Seeker'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Resume / CV Selection */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-800">
                                    Resume / Curriculum Vitae
                                </label>
                                <p className="mt-0.5 text-[11px] text-zinc-500">
                                    Select your verified archive resume or upload a tailored version for this role.
                                </p>

                                <div className="mt-2.5 space-y-2">
                                    {latestArchivedResume ? (
                                        <label className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-xs cursor-pointer hover:bg-zinc-50">
                                            <input
                                                type="radio"
                                                name="resumeChoice"
                                                value="archive"
                                                checked={resumeChoice === 'archive'}
                                                onChange={() => setResumeChoice('archive')}
                                                className="size-4 text-[#001c17] focus:ring-[#E47818]"
                                            />
                                            <div className="min-w-0">
                                                <span className="font-semibold text-zinc-900 block truncate">
                                                    Use saved resume: {latestArchivedResume.original_name}
                                                </span>
                                                <span className="text-[10px] text-zinc-500">
                                                    From your verified document archive
                                                </span>
                                            </div>
                                        </label>
                                    ) : null}

                                    <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 text-xs cursor-pointer hover:bg-zinc-50">
                                        <input
                                            type="radio"
                                            name="resumeChoice"
                                            value="upload"
                                            checked={resumeChoice === 'upload'}
                                            onChange={() => setResumeChoice('upload')}
                                            className="size-4 text-[#001c17] focus:ring-[#E47818] mt-0.5"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <span className="font-semibold text-zinc-900 block">
                                                {latestArchivedResume ? 'Upload a new / tailored resume' : 'Upload your resume (.pdf, .doc, .docx)'}
                                            </span>
                                            {resumeChoice === 'upload' && (
                                                <input
                                                    type="file"
                                                    required={!latestArchivedResume}
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={(e) => setSelectedResumeFile(e.target.files?.[0] ?? null)}
                                                    className="mt-2 block w-full text-xs text-zinc-600 file:mr-2 file:h-7 file:rounded-lg file:border-0 file:bg-[#001c17] file:px-2.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#0b382f] cursor-pointer"
                                                />
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Section 3: Cover Letter */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-zinc-800">
                                        Cover Letter / Message to Hiring Team
                                    </label>
                                    <span className="text-[10px] text-zinc-400">
                                        Optional · {coverLetter.length} / 10,000
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-zinc-500">
                                    Share why your background and SEAIT training make you a strong fit for this opportunity.
                                </p>

                                {/* Quick pitch templates */}
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCoverLetter(
                                                `Dear Hiring Team at ${selectedJobForApply.employer?.company_name},\n\nI am excited to submit my verified alumni application for the ${selectedJobForApply.title} position. As a graduate of South East Asian Institute of Technology, Inc., my coursework and practical training have prepared me to make an immediate impact on your team.\n\nThank you for reviewing my credentials, and I look forward to connecting with your team.`,
                                            )
                                        }
                                        className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                                    >
                                        + Insert SEAIT Graduate Intro
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCoverLetter(
                                                (prev) =>
                                                    prev +
                                                    '\n\nMy technical capstone and academic honors demonstrate my commitment to excellence and high quality execution.',
                                            )
                                        }
                                        className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                                    >
                                        + Mention Academic Training
                                    </button>
                                </div>

                                <textarea
                                    rows={4}
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    maxLength={10000}
                                    placeholder="Write a message to introduce yourself..."
                                    className="mt-2 w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-800 focus:border-[#E47818] focus:outline-hidden"
                                />
                            </div>

                            {/* Section 4: Data Privacy Consent */}
                            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
                                <label className="flex items-start gap-2.5 text-xs text-zinc-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={agreedToConsent}
                                        onChange={(e) => setAgreedToConsent(e.target.checked)}
                                        className="mt-0.5 size-4 rounded border-zinc-300 text-[#001c17] focus:ring-[#E47818]"
                                    />
                                    <span className="leading-relaxed text-[11px]">
                                        I authorize South East Asian Institute of Technology, Inc. to transmit my verified alumni profile snapshot, educational records, and resume to{' '}
                                        <strong>{selectedJobForApply.employer?.company_name}</strong> in accordance with Republic Act No. 10173 (Data Privacy Act of 2012).
                                    </span>
                                </label>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedJobForApply(null)}
                                    className="h-10 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={applying || !agreedToConsent}
                                    className="h-10 rounded-xl bg-[#E47818] px-5 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] transition disabled:opacity-50 cursor-pointer"
                                >
                                    {applying ? 'Submitting Application…' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Complete Profile Modal Dialog */}
            <AlumniProfileCompletionModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                profile={profile}
                onSuccess={() => profileResource.reload()}
            />
        </div>
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
    const [deleting, setDeleting] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'published' | 'draft' | 'closing_soon'
    >('all');
    const [workplaceFilter, setWorkplaceFilter] = useState<string>('all');
    const [selectedJobForPreview, setSelectedJobForPreview] =
        useState<JobPosting | null>(null);
    const [selectedJobForEdit, setSelectedJobForEdit] =
        useState<JobPosting | null>(null);
    const [editForm, setEditForm] = useState(emptyJobForm);
    const [updating, setUpdating] = useState(false);
    const [internalCreateOpen, setInternalCreateOpen] = useState(false);

    const isModalCreateOpen = createOpen || internalCreateOpen;

    useEffect(() => {
        const firstEmployer = employers.data?.data[0];
        if (firstEmployer && !form.employer_id) {
            setForm((current) => ({
                ...current,
                employer_id: String(firstEmployer.id),
            }));
        }
    }, [employers.data, form.employer_id]);

    useEffect(() => {
        if (selectedJobForEdit) {
            setEditForm({
                employer_id: String(selectedJobForEdit.employer_id),
                title: selectedJobForEdit.title,
                description: selectedJobForEdit.description,
                location: selectedJobForEdit.location ?? '',
                employment_type: selectedJobForEdit.employment_type ?? 'full-time',
                workplace_type: selectedJobForEdit.workplace_type ?? 'onsite',
                salary_min: selectedJobForEdit.salary_min
                    ? String(selectedJobForEdit.salary_min)
                    : '',
                salary_max: selectedJobForEdit.salary_max
                    ? String(selectedJobForEdit.salary_max)
                    : '',
                closes_at: selectedJobForEdit.closes_at
                    ? selectedJobForEdit.closes_at.split('T')[0]
                    : '',
            });
        }
    }, [selectedJobForEdit]);

    // Escape key handler for open modals
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedJobForPreview) setSelectedJobForPreview(null);
                if (selectedJobForEdit) setSelectedJobForEdit(null);
                if (isModalCreateOpen) {
                    setInternalCreateOpen(false);
                    onCloseCreate();
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedJobForPreview, selectedJobForEdit, isModalCreateOpen, onCloseCreate]);

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
            setInternalCreateOpen(false);
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

    async function updateJob(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedJobForEdit) return;
        setUpdating(true);
        try {
            await apiRequest<ApiEnvelope<JobPosting>>(
                `/api/employer/jobs/${selectedJobForEdit.id}`,
                {
                    method: 'PATCH',
                    body: {
                        title: editForm.title,
                        description: editForm.description,
                        location: editForm.location || null,
                        employment_type: editForm.employment_type || null,
                        workplace_type: editForm.workplace_type || null,
                        salary_min: editForm.salary_min
                            ? Number(editForm.salary_min)
                            : null,
                        salary_max: editForm.salary_max
                            ? Number(editForm.salary_max)
                            : null,
                        closes_at: editForm.closes_at || null,
                    },
                },
            );
            setSelectedJobForEdit(null);
            jobs.reload();
            toast.success('Job posting updated successfully.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Job posting could not be updated.',
            );
        } finally {
            setUpdating(false);
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
            if (selectedJobForPreview?.id === jobId) {
                setSelectedJobForPreview((prev) =>
                    prev ? { ...prev, status: 'published' } : null,
                );
            }
            toast.success('Job posting published to SEAIT Alumni Job Board.');
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

    async function deleteJob(jobId: number) {
        if (
            !window.confirm(
                'Are you sure you want to delete this job posting draft?',
            )
        ) {
            return;
        }
        setDeleting(jobId);
        try {
            await apiRequest(`/api/employer/jobs/${jobId}`, {
                method: 'DELETE',
            });
            jobs.reload();
            toast.success('Job posting deleted.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Job posting could not be deleted.',
            );
        } finally {
            setDeleting(null);
        }
    }

    function getRemainingDays(closesAt: string | null): {
        text: string;
        urgent: boolean;
        expired: boolean;
    } | null {
        if (!closesAt) return null;
        const target = new Date(closesAt).getTime();
        const now = Date.now();
        const diffDays = Math.ceil((target - now) / (1000 * 3600 * 24));
        if (diffDays < 0) {
            return { text: 'Expired', urgent: true, expired: true };
        }
        if (diffDays === 0) {
            return { text: 'Closes today', urgent: true, expired: false };
        }
        if (diffDays === 1) {
            return { text: 'Closes tomorrow', urgent: true, expired: false };
        }
        if (diffDays <= 7) {
            return {
                text: `Closes in ${diffDays} days`,
                urgent: true,
                expired: false,
            };
        }
        return {
            text: `Closes in ${diffDays} days`,
            urgent: false,
            expired: false,
        };
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

    // Pipeline KPI calculations
    const totalPostings = postings.length;
    const publishedPostings = postings.filter(
        (j) => j.status === 'published',
    ).length;
    const draftPostings = postings.filter((j) => j.status === 'draft').length;
    const totalApplicantsCount = postings.reduce(
        (sum, j) => sum + (j.applications_count ?? 0),
        0,
    );
    const closingSoonCount = postings.filter((j) => {
        if (j.status !== 'published' || !j.closes_at) return false;
        const d = Math.ceil(
            (new Date(j.closes_at).getTime() - Date.now()) / (1000 * 3600 * 24),
        );
        return d >= 0 && d <= 14;
    }).length;

    // Filtered postings
    const filteredPostings = postings.filter((job) => {
        if (statusFilter === 'published' && job.status !== 'published')
            return false;
        if (statusFilter === 'draft' && job.status !== 'draft')
            return false;
        if (statusFilter === 'closing_soon') {
            if (job.status !== 'published' || !job.closes_at) return false;
            const d = Math.ceil(
                (new Date(job.closes_at).getTime() - Date.now()) /
                (1000 * 3600 * 24),
            );
            if (d < 0 || d > 14) return false;
        }
        if (
            workplaceFilter !== 'all' &&
            job.workplace_type?.toLowerCase() !== workplaceFilter.toLowerCase()
        ) {
            return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchesTitle = job.title.toLowerCase().includes(q);
            const matchesLoc = job.location?.toLowerCase().includes(q) ?? false;
            const matchesDesc = job.description.toLowerCase().includes(q);
            const matchesType =
                job.employment_type?.toLowerCase().includes(q) ?? false;
            if (!matchesTitle && !matchesLoc && !matchesDesc && !matchesType) {
                return false;
            }
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Hero Recruitment Bar */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#001c17] via-[#072c23] to-[#0e4437] p-6 text-white shadow-xl shadow-emerald-950/15 sm:p-7">
                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="max-w-2xl space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
                            <Sparkles className="size-3.5 text-[#E47818]" />
                            SEAIT Employer Partner Job Management
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                            Career Opportunities & Job Postings
                        </h1>
                        <p className="text-xs leading-relaxed text-emerald-100/80">
                            Create and manage job postings published to verified
                            South East Asian Institute of Technology alumni. Review
                            application pipelines, update salary ranges, and track
                            talent acquisition.
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setInternalCreateOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#E47818] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#c96611] transition-all cursor-pointer"
                        >
                            <Plus className="size-4" /> Post New Opportunity
                        </button>
                    </div>
                </div>

                {/* Subtle decorative background glow */}
                <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            {/* Warning if no registered companies */}
            {!companies.length ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
                    <h2 className="text-sm font-semibold text-amber-900">
                        Company profile required
                    </h2>
                    <p className="mt-1 text-xs text-amber-700">
                        Register and verify your company before creating public
                        job postings for SEAIT graduates.
                    </p>
                    <button
                        type="button"
                        onClick={() => onNavigate('Company profile')}
                        className="mt-4 rounded-xl bg-[#0b382f] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                    >
                        Set up company profile
                    </button>
                </section>
            ) : null}

            {/* Recruitment Pipeline Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                            Total Roles
                        </span>
                        <div className="grid size-8 place-items-center rounded-xl bg-zinc-100 text-zinc-700">
                            <Briefcase className="size-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                        {totalPostings}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400">
                        Postings in workspace
                    </div>
                </div>

                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                            Live / Published
                        </span>
                        <div className="grid size-8 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="size-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-950">
                        {publishedPostings}
                    </div>
                    <div className="mt-1 text-[11px] text-emerald-700">
                        Active on alumni job board
                    </div>
                </div>

                <div className="rounded-2xl border border-blue-200/80 bg-blue-50/30 p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
                            Total Applicants
                        </span>
                        <div className="grid size-8 place-items-center rounded-xl bg-blue-100 text-blue-800">
                            <UsersRound className="size-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-blue-950">
                        {totalApplicantsCount}
                    </div>
                    <div className="mt-1 text-[11px] text-blue-700">
                        Verified alumni applications
                    </div>
                </div>

                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                            Drafts / Closing
                        </span>
                        <div className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-800">
                            <Clock className="size-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-amber-950">
                        {draftPostings}
                        {closingSoonCount > 0 && (
                            <span className="ml-2 text-xs font-semibold text-amber-700">
                                ({closingSoonCount} soon)
                            </span>
                        )}
                    </div>
                    <div className="mt-1 text-[11px] text-amber-700">
                        {draftPostings} drafts · {closingSoonCount} closing soon
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                    {(
                        [
                            ['all', `All (${totalPostings})`],
                            ['published', `Published (${publishedPostings})`],
                            ['draft', `Drafts (${draftPostings})`],
                            ['closing_soon', `Closing Soon (${closingSoonCount})`],
                        ] as const
                    ).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setStatusFilter(key)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${statusFilter === key
                                    ? 'bg-[#0b382f] text-white shadow-xs'
                                    : 'text-zinc-600 hover:bg-zinc-100'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Search & Workplace controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[180px] flex-1 sm:w-56">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search postings…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#0b382f] focus:bg-white focus:outline-hidden"
                        />
                    </div>

                    <select
                        value={workplaceFilter}
                        onChange={(e) => setWorkplaceFilter(e.target.value)}
                        className="h-9 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 focus:border-[#0b382f] focus:outline-hidden"
                    >
                        <option value="all">All Workplaces</option>
                        <option value="onsite">On-site</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="remote">Remote</option>
                    </select>
                </div>
            </div>

            {/* Job Postings Grid */}
            {filteredPostings.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {filteredPostings.map((job) => {
                        const employer = companies.find(
                            (company) => company.id === job.employer_id,
                        );
                        const canPublish =
                            employer?.verification_status === 'verified';
                        const daysInfo = getRemainingDays(job.closes_at);
                        const salaryText = formatSalary(
                            job.salary_min,
                            job.salary_max,
                        );

                        return (
                            <article
                                key={job.id}
                                className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md"
                            >
                                <div className="space-y-3">
                                    {/* Header: Company & Status Badge */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                                                <Building2 className="size-3 text-[#E47818]" />
                                                <span className="truncate">
                                                    {job.employer?.company_name ??
                                                        employer?.company_name ??
                                                        'Institutional Partner'}
                                                </span>
                                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                                                    Verified
                                                </span>
                                            </div>
                                            <h2 className="mt-1 text-base font-bold text-zinc-900 line-clamp-1">
                                                {job.title}
                                            </h2>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide capitalize ${job.status === 'published'
                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                    : job.status === 'draft'
                                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                                }`}
                                        >
                                            {job.status === 'published'
                                                ? '● Live'
                                                : job.status === 'draft'
                                                    ? 'Draft'
                                                    : 'Closed'}
                                        </span>
                                    </div>

                                    {/* Metadata Pills Row */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                        {job.employment_type && (
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 capitalize">
                                                <Briefcase className="size-3 text-zinc-500" />
                                                {job.employment_type}
                                            </span>
                                        )}
                                        {job.workplace_type && (
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 capitalize">
                                                <MapPin className="size-3 text-zinc-500" />
                                                {job.workplace_type}
                                            </span>
                                        )}
                                        {job.location && (
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                                                {job.location}
                                            </span>
                                        )}
                                        {salaryText && (
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2 py-0.5 font-bold text-emerald-900">
                                                <Coins className="size-3 text-emerald-600" />
                                                {salaryText}
                                            </span>
                                        )}
                                        {daysInfo && (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-medium ${daysInfo.urgent
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : 'bg-zinc-100 text-zinc-600'
                                                    }`}
                                            >
                                                <Clock className="size-3" />
                                                {daysInfo.text}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description Excerpt */}
                                    <p className="line-clamp-3 text-xs leading-relaxed text-zinc-600 whitespace-pre-line">
                                        {job.description}
                                    </p>
                                </div>

                                {/* Card Actions Footer */}
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-zinc-100 pt-3">
                                    {/* Applicant Count Pill */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (typeof window !== 'undefined') {
                                                window.sessionStorage.setItem(
                                                    'seait_employer_selected_job',
                                                    String(job.id),
                                                );
                                            }
                                            onNavigate('Applicants');
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                                    >
                                        <UsersRound className="size-3 text-emerald-700" />
                                        <span>
                                            {job.applications_count ?? 0} Alumni Applied
                                        </span>
                                    </button>

                                    {/* Right Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedJobForPreview(job)
                                            }
                                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                        >
                                            <Eye className="size-3 text-zinc-500" />
                                            Preview
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedJobForEdit(job)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                        >
                                            <Pencil className="size-3 text-zinc-500" />
                                            Edit
                                        </button>

                                        {job.status === 'draft' && (
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
                                                className="inline-flex items-center gap-1 rounded-lg bg-[#0b382f] px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-[#07241e] disabled:opacity-40 cursor-pointer"
                                            >
                                                {publishing === job.id
                                                    ? 'Publishing…'
                                                    : canPublish
                                                        ? 'Publish Live'
                                                        : 'Verification Required'}
                                            </button>
                                        )}

                                        {job.status === 'draft' &&
                                            (job.applications_count ?? 0) === 0 && (
                                                <button
                                                    type="button"
                                                    disabled={deleting === job.id}
                                                    onClick={() =>
                                                        void deleteJob(job.id)
                                                    }
                                                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                                    title="Delete Draft"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (typeof window !== 'undefined') {
                                                    window.sessionStorage.setItem(
                                                        'seait_employer_selected_job',
                                                        String(job.id),
                                                    );
                                                }
                                                onNavigate('Applicants');
                                            }}
                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-900 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                                        >
                                            Review Applicants{' '}
                                            <ArrowRight className="size-3" />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <EmptyState>
                    {searchQuery ||
                        statusFilter !== 'all' ||
                        workplaceFilter !== 'all'
                        ? 'No job postings match your active filter criteria.'
                        : 'No job postings have been created yet. Click "+ Post New Opportunity" above to publish your first role.'}
                </EmptyState>
            )}

            {/* Create Job Posting Modal */}
            {isModalCreateOpen && companies.length && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                            <div>
                                <h2 className="text-base font-bold text-zinc-900">
                                    Post Career Opportunity
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Create a job posting targeted to verified SEAIT
                                    alumni.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setInternalCreateOpen(false);
                                    onCloseCreate();
                                }}
                                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={createJob} className="mt-5 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="text-xs font-semibold text-zinc-700">
                                    Company
                                    <select
                                        required
                                        value={form.employer_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                employer_id: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs"
                                    >
                                        {companies.map((company) => (
                                            <option
                                                key={company.id}
                                                value={company.id}
                                            >
                                                {company.company_name} ·{' '}
                                                {company.verification_status}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Job Title
                                    <input
                                        required
                                        placeholder="e.g. Full-Stack Web Developer"
                                        value={form.title}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                title: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs focus:border-[#0b382f]"
                                    />
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Employment Type
                                    <select
                                        value={form.employment_type}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                employment_type: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs"
                                    >
                                        <option value="full-time">Full-time</option>
                                        <option value="part-time">Part-time</option>
                                        <option value="contract">Contract</option>
                                        <option value="internship">Internship</option>
                                        <option value="temporary">Temporary</option>
                                    </select>
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Workplace Setting
                                    <select
                                        value={form.workplace_type}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                workplace_type: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs"
                                    >
                                        <option value="onsite">On-site</option>
                                        <option value="hybrid">Hybrid</option>
                                        <option value="remote">Remote</option>
                                    </select>
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Location
                                    <input
                                        placeholder="e.g. BGC, Taguig City"
                                        value={form.location}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                location: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
                                    />
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Application Deadline
                                    <input
                                        type="date"
                                        value={form.closes_at}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                closes_at: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
                                    />
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Salary Minimum (₱ / mo)
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 45000"
                                        value={form.salary_min}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                salary_min: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
                                    />
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Salary Maximum (₱ / mo)
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 65000"
                                        value={form.salary_max}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                salary_max: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
                                    />
                                </label>
                            </div>

                            <label className="block text-xs font-semibold text-zinc-700">
                                Job Description, Responsibilities & Qualifications
                                <textarea
                                    required
                                    rows={6}
                                    placeholder="Outline responsibilities, required SEAIT academic background, and technical skills…"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            description: e.target.value,
                                        })
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-zinc-200 p-3 text-xs leading-relaxed"
                                />
                            </label>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInternalCreateOpen(false);
                                        onCloseCreate();
                                    }}
                                    className="h-10 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="h-10 rounded-xl bg-[#0b382f] px-5 text-xs font-bold text-white shadow-xs hover:bg-[#07241e] disabled:opacity-60 cursor-pointer"
                                >
                                    {creating ? 'Saving…' : 'Save as Draft'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Job Posting Modal */}
            {selectedJobForEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                            <div>
                                <h2 className="text-base font-bold text-zinc-900">
                                    Edit Career Opportunity
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Update position details, compensation, and
                                    application deadline.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedJobForEdit(null)}
                                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={updateJob} className="mt-5 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="text-xs font-semibold text-zinc-700 sm:col-span-2">
                                    Job Title
                                    <input
                                        required
                                        value={editForm.title}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                title: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs focus:border-[#0b382f]"
                                    />
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Employment Type
                                    <select
                                        value={editForm.employment_type}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                employment_type: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs"
                                    >
                                        <option value="full-time">Full-time</option>
                                        <option value="part-time">Part-time</option>
                                        <option value="contract">Contract</option>
                                        <option value="internship">Internship</option>
                                        <option value="temporary">Temporary</option>
                                    </select>
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Workplace Setting
                                    <select
                                        value={editForm.workplace_type}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                workplace_type: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs"
                                    >
                                        <option value="onsite">On-site</option>
                                        <option value="hybrid">Hybrid</option>
                                        <option value="remote">Remote</option>
                                    </select>
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Location
                                    <input
                                        value={editForm.location}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                location: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
                                    />
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Application Deadline
                                    <input
                                        type="date"
                                        value={editForm.closes_at}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                closes_at: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
                                    />
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Salary Minimum (₱ / mo)
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.salary_min}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                salary_min: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
                                    />
                                </label>

                                <label className="text-xs font-semibold text-zinc-700">
                                    Salary Maximum (₱ / mo)
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.salary_max}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                salary_max: e.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs"
                                    />
                                </label>
                            </div>

                            <label className="block text-xs font-semibold text-zinc-700">
                                Job Description, Responsibilities & Qualifications
                                <textarea
                                    required
                                    rows={6}
                                    value={editForm.description}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            description: e.target.value,
                                        })
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-zinc-200 p-3 text-xs leading-relaxed"
                                />
                            </label>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedJobForEdit(null)}
                                    className="h-10 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="h-10 rounded-xl bg-[#0b382f] px-5 text-xs font-bold text-white shadow-xs hover:bg-[#07241e] disabled:opacity-60 cursor-pointer"
                                >
                                    {updating ? 'Updating…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Job Details & Public Preview Modal */}
            {selectedJobForPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
                        <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                                    <Building2 className="size-3.5 text-[#E47818]" />
                                    <span>
                                        {selectedJobForPreview.employer
                                            ?.company_name ??
                                            'Institutional Partner'}
                                    </span>
                                    {selectedJobForPreview.employer
                                        ?.industry && (
                                            <span className="text-zinc-400">
                                                ·{' '}
                                                {
                                                    selectedJobForPreview.employer
                                                        .industry
                                                }
                                            </span>
                                        )}
                                </div>
                                <h2 className="text-lg font-bold text-zinc-900">
                                    {selectedJobForPreview.title}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedJobForPreview(null)}
                                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-5 text-xs">
                            {/* Badges Grid */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${selectedJobForPreview.status ===
                                            'published'
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : selectedJobForPreview.status ===
                                                'draft'
                                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                : 'bg-zinc-100 text-zinc-600'
                                        }`}
                                >
                                    {selectedJobForPreview.status === 'published'
                                        ? '● Live on Alumni Job Board'
                                        : selectedJobForPreview.status === 'draft'
                                            ? 'Draft (Hidden from Public)'
                                            : 'Closed'}
                                </span>
                                {selectedJobForPreview.employment_type && (
                                    <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700 capitalize">
                                        💼{' '}
                                        {selectedJobForPreview.employment_type}
                                    </span>
                                )}
                                {selectedJobForPreview.workplace_type && (
                                    <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700 capitalize">
                                        🏢 {selectedJobForPreview.workplace_type}
                                    </span>
                                )}
                                {selectedJobForPreview.location && (
                                    <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">
                                        📍 {selectedJobForPreview.location}
                                    </span>
                                )}
                                {formatSalary(
                                    selectedJobForPreview.salary_min,
                                    selectedJobForPreview.salary_max,
                                ) && (
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-900 border border-emerald-200">
                                            💰{' '}
                                            {formatSalary(
                                                selectedJobForPreview.salary_min,
                                                selectedJobForPreview.salary_max,
                                            )}
                                        </span>
                                    )}
                            </div>

                            {/* Application & Deadline Banner */}
                            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                                <div>
                                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                        Application Volume
                                    </span>
                                    <p className="mt-1 text-sm font-bold text-zinc-900">
                                        {selectedJobForPreview.applications_count ??
                                            0}{' '}
                                        Verified Candidates
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                        Application Deadline
                                    </span>
                                    <p className="mt-1 text-sm font-bold text-zinc-900">
                                        {selectedJobForPreview.closes_at
                                            ? new Date(
                                                selectedJobForPreview.closes_at,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })
                                            : 'Open until filled'}
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Description */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                    Position Overview & Job Description
                                </h3>
                                <div className="mt-2 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 leading-relaxed text-zinc-700 whitespace-pre-line text-xs">
                                    {selectedJobForPreview.description}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    const j = selectedJobForPreview;
                                    setSelectedJobForPreview(null);
                                    setSelectedJobForEdit(j);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                            >
                                <Pencil className="size-3.5 text-zinc-500" />
                                Edit Position
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedJobForPreview(null)}
                                    className="h-9 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                >
                                    Close
                                </button>
                                {selectedJobForPreview.status === 'draft' && (
                                    <button
                                        type="button"
                                        disabled={
                                            publishing ===
                                            selectedJobForPreview.id
                                        }
                                        onClick={() =>
                                            void publishJob(
                                                selectedJobForPreview.id,
                                            )
                                        }
                                        className="h-9 rounded-xl bg-[#0b382f] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#07241e] cursor-pointer"
                                    >
                                        {publishing ===
                                            selectedJobForPreview.id
                                            ? 'Publishing…'
                                            : 'Publish Live'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (typeof window !== 'undefined') {
                                            window.sessionStorage.setItem(
                                                'seait_employer_selected_job',
                                                String(
                                                    selectedJobForPreview.id,
                                                ),
                                            );
                                        }
                                        setSelectedJobForPreview(null);
                                        onNavigate('Applicants');
                                    }}
                                    className="inline-flex items-center gap-1.5 h-9 rounded-xl bg-[#E47818] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#c96611] cursor-pointer"
                                >
                                    View Applicants{' '}
                                    <ArrowRight className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const applicationStatusBadges: Record<
    string,
    { label: string; className: string }
> = {
    submitted: {
        label: 'Application Submitted',
        className: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    reviewing: {
        label: 'Under Review',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    shortlisted: {
        label: 'Shortlisted for Interview',
        className: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    hired: {
        label: 'Offer / Hired',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    rejected: {
        label: 'Not Selected',
        className: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    },
};

export function AlumniApplications({
    onNavigate,
}: {
    onNavigate?: (page: string) => void;
} = {}) {
    const { data, loading, error } = useApiResource<
        ApiEnvelope<RawPagination<JobApplication>>
    >('/api/applications/me');

    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'shortlisted' | 'closed'>('all');
    const [viewingApp, setViewingApp] = useState<JobApplication | null>(null);

    useEffect(() => {
        if (!viewingApp) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setViewingApp(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [viewingApp]);

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const applications = data?.data.data ?? [];

    const activeApplications = applications.filter(
        (a) => ['submitted', 'reviewing'].includes(a.status),
    );
    const shortlistedApplications = applications.filter(
        (a) => a.status === 'shortlisted',
    );
    const closedApplications = applications.filter(
        (a) => ['hired', 'rejected'].includes(a.status),
    );

    const filteredApplications = applications.filter((app) => {
        if (statusFilter === 'active') return ['submitted', 'reviewing'].includes(app.status);
        if (statusFilter === 'shortlisted') return app.status === 'shortlisted';
        if (statusFilter === 'closed') return ['hired', 'rejected'].includes(app.status);
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001c17] via-[#052d26] to-[#0b382f] p-6 text-white shadow-lg sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[#E47818]/15 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/20 text-[#E47818]">
                            <FileCheck className="size-8" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                    My Job Applications
                                </h1>
                                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-500/30">
                                    RA 10173 Protected
                                </span>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-emerald-100/80">
                                Track application status, review hiring feedback, and access frozen verified credential snapshots.
                            </p>
                        </div>
                    </div>
                    {onNavigate && (
                        <button
                            type="button"
                            onClick={() => onNavigate('Career opportunities')}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#E47818] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#c96611] focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/60 cursor-pointer self-start sm:self-center"
                        >
                            <Briefcase className="size-4" />
                            Explore Job Board
                        </button>
                    )}
                </div>
            </section>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 pb-3">
                {[
                    { id: 'all', label: 'All Applications', count: applications.length },
                    { id: 'active', label: 'Under Review / Active', count: activeApplications.length },
                    { id: 'shortlisted', label: 'Shortlisted', count: shortlistedApplications.length },
                    { id: 'closed', label: 'Completed / Decision', count: closedApplications.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${statusFilter === tab.id
                                ? 'bg-[#001c17] text-white shadow-2xs'
                                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                            }`}
                    >
                        <span>{tab.label}</span>
                        <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] ${statusFilter === tab.id
                                    ? 'bg-white/20 text-white'
                                    : 'bg-zinc-100 text-zinc-600'
                                }`}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Applications List */}
            {filteredApplications.length ? (
                <div className="grid gap-4">
                    {filteredApplications.map((application) => {
                        const statusMeta =
                            applicationStatusBadges[application.status] ?? {
                                label: application.status.replace('_', ' '),
                                className: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                            };

                        return (
                            <article
                                key={application.id}
                                className="flex flex-col gap-4 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs transition hover:border-[#E47818]/40 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex items-start gap-3.5 min-w-0">
                                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#001c17] text-base font-bold text-white shadow-xs">
                                        {initials(
                                            application.job_posting?.employer?.company_name ??
                                            'Employer',
                                        )}
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                                            {application.job_posting?.title ??
                                                'Position title archived'}
                                        </h2>
                                        <p className="mt-0.5 text-xs font-semibold text-zinc-600 flex items-center gap-1.5 truncate">
                                            <span>
                                                {application.job_posting?.employer
                                                    ?.company_name ?? 'Employer Partner'}
                                            </span>
                                            {application.job_posting?.location && (
                                                <>
                                                    <span>·</span>
                                                    <span className="font-normal text-zinc-500">
                                                        {application.job_posting.location}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                        <p className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1.5">
                                            <Calendar className="size-3" />
                                            Submitted on{' '}
                                            {new Date(
                                                application.created_at,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
                                    <span
                                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
                                    >
                                        {statusMeta.label}
                                    </span>

                                    {application.resume_snapshot_path && (
                                        <a
                                            href={`/api/applications/${application.id}/resume?inline=1`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                            title="View transmitted resume snapshot"
                                        >
                                            <Eye className="size-3" />
                                            Resume
                                        </a>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setViewingApp(application)}
                                        className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 cursor-pointer"
                                    >
                                        <Eye className="size-3" />
                                        View Snapshot
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-zinc-200 p-12 text-center">
                    <FileCheck className="size-10 mx-auto text-zinc-300" />
                    <h3 className="mt-3 text-sm font-bold text-zinc-800">
                        No applications in this view
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                        {statusFilter === 'all'
                            ? 'You have not submitted any job applications yet.'
                            : 'There are no applications matching this status filter.'}
                    </p>
                    {onNavigate && (
                        <button
                            type="button"
                            onClick={() => onNavigate('Career opportunities')}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#E47818] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] cursor-pointer"
                        >
                            Browse Career Opportunities
                        </button>
                    )}
                </div>
            )}

            {/* Application Snapshot Modal */}
            {viewingApp && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={() => setViewingApp(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Application Snapshot"
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E47818]">
                                    RA 10173 Application Snapshot
                                </span>
                                <h2 className="text-base font-bold text-zinc-900 mt-0.5">
                                    {viewingApp.job_posting?.title ?? 'Position Application'}
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    {viewingApp.job_posting?.employer?.company_name} · Submitted{' '}
                                    {new Date(viewingApp.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingApp(null)}
                                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4 text-xs">
                            {/* Application Status Badge */}
                            <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3.5 border border-zinc-100">
                                <span className="font-semibold text-zinc-700">Hiring Status</span>
                                <span
                                    className={`rounded-full border px-3 py-1 font-semibold ${applicationStatusBadges[viewingApp.status]?.className ??
                                        'bg-zinc-100 text-zinc-700 border-zinc-200'
                                        }`}
                                >
                                    {applicationStatusBadges[viewingApp.status]?.label ??
                                        viewingApp.status}
                                </span>
                            </div>

                            {/* Submitted Cover Letter */}
                            {viewingApp.cover_letter ? (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                        Submitted Cover Letter / Note
                                    </h3>
                                    <div className="mt-1.5 rounded-2xl bg-zinc-50/70 p-4 border border-zinc-200/60 leading-relaxed text-zinc-700 whitespace-pre-line text-xs">
                                        {viewingApp.cover_letter}
                                    </div>
                                </div>
                            ) : null}

                            {/* Frozen Profile Snapshot Details */}
                            {viewingApp.profile_snapshot && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                        Transmitted Verified Credentials Snapshot
                                    </h3>
                                    <div className="mt-1.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-3">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                                Degree & Academic Qualifications
                                            </span>
                                            {Array.isArray(viewingApp.profile_snapshot.education) &&
                                                viewingApp.profile_snapshot.education.length > 0 ? (
                                                <div className="mt-1 space-y-1">
                                                    {viewingApp.profile_snapshot.education.map(
                                                        (edu: any, i: number) => (
                                                            <p key={i} className="font-semibold text-zinc-900">
                                                                {edu.program ?? edu.degree}
                                                                {edu.graduation_year ? ` · Class of ${edu.graduation_year}` : ''}
                                                                {edu.honors ? ` · ${edu.honors}` : ''}
                                                                {edu.gwa ? ` · GWA ${edu.gwa}` : ''}
                                                            </p>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="font-semibold text-zinc-900 mt-0.5">
                                                    Verified Alumni Graduate
                                                </p>
                                            )}
                                        </div>

                                        {Array.isArray(viewingApp.profile_snapshot.employment) &&
                                            viewingApp.profile_snapshot.employment.length > 0 && (
                                                <div className="border-t border-emerald-200/60 pt-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                                        Transmitted Career Experience
                                                    </span>
                                                    <p className="font-semibold text-zinc-900 mt-0.5">
                                                        {viewingApp.profile_snapshot.employment[0].job_title} at{' '}
                                                        {viewingApp.profile_snapshot.employment[0].employer_name}
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            )}

                            {/* Resume Snapshot View & Download */}
                            {viewingApp.resume_snapshot_path && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4">
                                    <div className="flex items-center gap-2.5">
                                        <FileText className="size-4 text-[#001c17]" />
                                        <div>
                                            <span className="block font-semibold text-zinc-800 text-xs">
                                                Transmitted Resume Snapshot
                                            </span>
                                            <span className="block text-[10px] text-zinc-400">
                                                {viewingApp.resume_snapshot_path.toLowerCase().endsWith('.docx')
                                                    ? 'Microsoft Word (.docx)'
                                                    : viewingApp.resume_snapshot_path.toLowerCase().endsWith('.doc')
                                                    ? 'Word Document (.doc)'
                                                    : 'PDF Document (.pdf)'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`/api/applications/${viewingApp.id}/resume?inline=1`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                                        >
                                            <Eye className="size-3" /> View Online
                                        </a>
                                        <a
                                            href={`/api/applications/${viewingApp.id}/resume?download=1`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-xl bg-[#001c17] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0b382f]"
                                        >
                                            <Download className="size-3" /> Download
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end border-t border-zinc-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setViewingApp(null)}
                                className="h-10 rounded-xl bg-zinc-100 px-5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const employerStatusConfig: Record<
    string,
    { label: string; badgeClass: string; actionLabel: string }
> = {
    submitted: {
        label: 'New / Submitted',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        actionLabel: 'Mark Under Review',
    },
    reviewing: {
        label: 'Under Review',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        actionLabel: 'Shortlist for Interview',
    },
    shortlisted: {
        label: 'Shortlisted for Interview',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        actionLabel: 'Extend Offer / Hire',
    },
    hired: {
        label: 'Offer / Hired',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        actionLabel: 'Hired',
    },
    rejected: {
        label: 'Not Selected',
        badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200',
        actionLabel: 'Not Selected',
    },
};

export function EmployerApplicants({
    onNavigate,
}: {
    onNavigate?: (page: string) => void;
} = {}) {
    const jobs =
        useApiResource<ApiEnvelope<RawPagination<JobPosting>>>(
            '/api/employer/jobs',
        );
    const [selectedJobId, setSelectedJobId] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return (
                window.sessionStorage.getItem(
                    'seait_employer_selected_job',
                ) ?? ''
            );
        }
        return '';
    });
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'submitted' | 'reviewing' | 'shortlisted' | 'hired' | 'rejected'
    >('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [inspectingApp, setInspectingApp] =
        useState<JobApplication | null>(null);
    const [updating, setUpdating] = useState<number | null>(null);

    const postings = jobs.data?.data.data ?? [];
    const activeJobId =
        selectedJobId || (postings[0] ? String(postings[0].id) : '');
    const currentJob =
        postings.find((j) => String(j.id) === activeJobId) ?? postings[0];

    const applications = useApiResource<
        ApiEnvelope<RawPagination<JobApplication>>
    >(activeJobId ? `/api/employer/jobs/${activeJobId}/applications` : null);

    useEffect(() => {
        if (!inspectingApp) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setInspectingApp(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [inspectingApp]);

    const handleSelectJob = (id: string) => {
        setSelectedJobId(id);
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('seait_employer_selected_job', id);
        }
    };

    async function updateStatus(applicationId: number, status: string) {
        setUpdating(applicationId);
        try {
            await apiRequest<ApiEnvelope<JobApplication>>(
                `/api/applications/${applicationId}/status`,
                { method: 'PATCH', body: { status } },
            );
            applications.reload();
            jobs.reload();
            if (inspectingApp && inspectingApp.id === applicationId) {
                setInspectingApp((prev) =>
                    prev ? { ...prev, status } : null,
                );
            }
            toast.success(
                `Candidate status updated to ${status.replace('_', ' ')}.`,
            );
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
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center">
                <Briefcase className="size-12 mx-auto text-zinc-300" />
                <h2 className="mt-3 text-base font-bold text-zinc-900">
                    No job postings available
                </h2>
                <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
                    Create and publish job postings to start receiving verified applications from SEAIT graduates.
                </p>
                {onNavigate && (
                    <button
                        type="button"
                        onClick={() => onNavigate('Job postings')}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#E47818] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] cursor-pointer"
                    >
                        <Plus className="size-4" /> Create Job Posting
                    </button>
                )}
            </div>
        );
    }

    const allApplications = applications.data?.data.data ?? [];
    const submittedCount = allApplications.filter(
        (a) => a.status === 'submitted',
    ).length;
    const reviewingCount = allApplications.filter(
        (a) => a.status === 'reviewing',
    ).length;
    const shortlistedCount = allApplications.filter(
        (a) => a.status === 'shortlisted',
    ).length;
    const hiredCount = allApplications.filter(
        (a) => a.status === 'hired',
    ).length;
    const rejectedCount = allApplications.filter(
        (a) => a.status === 'rejected',
    ).length;

    const filteredApplicants = allApplications.filter((app) => {
        if (statusFilter !== 'all' && app.status !== statusFilter) {
            return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const name = (app.alumni_profile?.name ?? '').toLowerCase();
            const email = (app.alumni_profile?.email ?? '').toLowerCase();
            const snapshotStr = JSON.stringify(
                app.profile_snapshot ?? {},
            ).toLowerCase();
            if (
                !name.includes(q) &&
                !email.includes(q) &&
                !snapshotStr.includes(q)
            ) {
                return false;
            }
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001c17] via-[#052d26] to-[#0b382f] p-6 text-white shadow-lg sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[#E47818]/15 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/20 text-[#E47818]">
                            <UsersRound className="size-8" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                    Applicant Tracking System
                                </h1>
                                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-500/30">
                                    Verified Alumni Pipeline
                                </span>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-emerald-100/80">
                                Inspect verified academic credentials, evaluate frozen RA 10173 profiles, and manage candidate progression.
                            </p>
                        </div>
                    </div>
                    {onNavigate && (
                        <button
                            type="button"
                            onClick={() => onNavigate('Job postings')}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 focus:outline-hidden focus:ring-2 focus:ring-white/40 cursor-pointer self-start sm:self-center"
                        >
                            <Briefcase className="size-4" />
                            Job Postings ({postings.length})
                        </button>
                    )}
                </div>
            </section>

            {/* Job Selector Bar & Active Job Card */}
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full sm:max-w-md">
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Select Job Position to Review
                        </label>
                        <select
                            value={activeJobId}
                            onChange={(e) => handleSelectJob(e.target.value)}
                            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-xs font-semibold text-zinc-900 focus:border-[#E47818] focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/20"
                        >
                            {postings.map((job) => (
                                <option key={job.id} value={job.id}>
                                    {job.title} — {job.applications_count ?? 0} applicants ({job.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    {currentJob && (
                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${currentJob.status === 'published'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                    }`}
                            >
                                Status: {currentJob.status}
                            </span>
                            {currentJob.workplace_type && (
                                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 capitalize">
                                    {currentJob.workplace_type}
                                </span>
                            )}
                            {currentJob.location && (
                                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                                    📍 {currentJob.location}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Pipeline Stat Cards */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
                {[
                    {
                        label: 'Total Applicants',
                        count: allApplications.length,
                        color: 'text-zinc-900',
                        border: 'border-zinc-200/80',
                    },
                    {
                        label: 'New / Awaiting Review',
                        count: submittedCount,
                        color: 'text-blue-700',
                        border: 'border-blue-200/80 bg-blue-50/30',
                    },
                    {
                        label: 'Under Review',
                        count: reviewingCount,
                        color: 'text-amber-700',
                        border: 'border-amber-200/80 bg-amber-50/30',
                    },
                    {
                        label: 'Shortlisted / Interview',
                        count: shortlistedCount,
                        color: 'text-purple-700',
                        border: 'border-purple-200/80 bg-purple-50/30',
                    },
                    {
                        label: 'Hired / Placed',
                        count: hiredCount,
                        color: 'text-emerald-700',
                        border: 'border-emerald-200/80 bg-emerald-50/30',
                    },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className={`rounded-2xl border p-4 shadow-2xs ${stat.border}`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            {stat.label}
                        </span>
                        <p className={`mt-1.5 text-xl font-bold ${stat.color}`}>
                            {stat.count}
                        </p>
                    </div>
                ))}
            </div>

            {/* Candidate Filter & Search Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search candidates by name, email, or degree program…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#E47818] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E47818]/20"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        { id: 'all', label: 'All', count: allApplications.length },
                        { id: 'submitted', label: 'New', count: submittedCount },
                        { id: 'reviewing', label: 'Reviewing', count: reviewingCount },
                        { id: 'shortlisted', label: 'Shortlisted', count: shortlistedCount },
                        { id: 'hired', label: 'Hired', count: hiredCount },
                        { id: 'rejected', label: 'Rejected', count: rejectedCount },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() =>
                                setStatusFilter(tab.id as typeof statusFilter)
                            }
                            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${statusFilter === tab.id
                                    ? 'bg-[#001c17] text-white shadow-2xs'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span className="text-[10px] opacity-75">
                                ({tab.count})
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Applicants List */}
            {applications.loading ? (
                <LoadingState />
            ) : applications.error ? (
                <ErrorState message={applications.error} />
            ) : filteredApplicants.length ? (
                <div className="grid gap-4">
                    {filteredApplicants.map((application) => {
                        const statusMeta =
                            employerStatusConfig[application.status] ?? {
                                label: application.status.replace('_', ' '),
                                badgeClass:
                                    'bg-zinc-100 text-zinc-700 border-zinc-200',
                                actionLabel: 'Update',
                            };

                        const applicantName =
                            application.alumni_profile?.name ??
                            'Verified SEAIT Alumni';
                        const snapshotEdu =
                            application.profile_snapshot?.education?.[0];
                        const snapshotExp =
                            application.profile_snapshot?.employment?.[0];

                        return (
                            <article
                                key={application.id}
                                className="relative rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs transition hover:border-[#E47818]/40 hover:shadow-md"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    {/* Candidate Info */}
                                    <div className="flex items-start gap-4 min-w-0">
                                        <Avatar className="size-14 overflow-hidden rounded-2xl ring-2 ring-[#001c17]/10 shrink-0">
                                            <AvatarFallback className="rounded-2xl bg-[#001c17] text-base font-bold text-white">
                                                {initials(applicantName)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-base font-bold text-zinc-900">
                                                    {applicantName}
                                                </h2>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                                                    <CheckCircle2 className="size-3 text-emerald-600" />
                                                    Verified Alumni
                                                </span>
                                            </div>

                                            <p className="mt-0.5 text-xs text-zinc-500">
                                                {application.alumni_profile?.email}
                                            </p>

                                            {/* Academic Credentials Snapshot */}
                                            {snapshotEdu && (
                                                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                                                    <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-800">
                                                        <GraduationCap className="size-3.5 text-[#001c17]" />
                                                        {snapshotEdu.program ??
                                                            snapshotEdu.degree}
                                                    </span>
                                                    {snapshotEdu.graduation_year && (
                                                        <span className="rounded-lg bg-zinc-100 px-2 py-1 font-medium text-zinc-600 text-[11px]">
                                                            Batch {snapshotEdu.graduation_year}
                                                        </span>
                                                    )}
                                                    {snapshotEdu.honors && (
                                                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 font-bold text-amber-900 border border-amber-200 text-[11px]">
                                                            <Award className="size-3 text-amber-700" />
                                                            {snapshotEdu.honors}
                                                        </span>
                                                    )}
                                                    {snapshotEdu.gwa && (
                                                        <span className="rounded-lg bg-emerald-100 px-2 py-1 font-bold text-emerald-900 border border-emerald-200 text-[11px]">
                                                            GWA {snapshotEdu.gwa}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Work experience snapshot */}
                                            {snapshotExp && (
                                                <p className="mt-2 text-xs text-zinc-600 flex items-center gap-1.5">
                                                    <Briefcase className="size-3.5 text-zinc-400" />
                                                    <span>
                                                        {snapshotExp.job_title} at{' '}
                                                        <span className="font-semibold text-zinc-800">
                                                            {snapshotExp.employer_name}
                                                        </span>
                                                    </span>
                                                </p>
                                            )}

                                            {/* Cover Letter preview */}
                                            {application.cover_letter && (
                                                <div className="mt-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                                                    &ldquo;{application.cover_letter}&rdquo;
                                                </div>
                                            )}

                                            <p className="mt-3 text-[11px] text-zinc-400 flex items-center gap-1">
                                                <Calendar className="size-3" />
                                                Applied on{' '}
                                                {new Date(
                                                    application.created_at,
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status Badge & Actions */}
                                    <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}
                                            >
                                                {statusMeta.label}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <a
                                                href={`/api/applications/${application.id}/resume?inline=1`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                                                title="View candidate resume / dossier"
                                            >
                                                <Eye className="size-3.5 text-zinc-500" />
                                                View Resume
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => setInspectingApp(application)}
                                                className="inline-flex items-center gap-1 rounded-xl bg-[#001c17] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0b382f] transition cursor-pointer"
                                            >
                                                <Eye className="size-3.5" />
                                                Review Dossier
                                            </button>
                                        </div>

                                        {/* Quick 1-click status advancement */}
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                            {application.status === 'submitted' && (
                                                <button
                                                    type="button"
                                                    disabled={updating === application.id}
                                                    onClick={() => updateStatus(application.id, 'reviewing')}
                                                    className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-100 border border-blue-200 cursor-pointer disabled:opacity-50"
                                                >
                                                    Start Review →
                                                </button>
                                            )}
                                            {application.status === 'reviewing' && (
                                                <button
                                                    type="button"
                                                    disabled={updating === application.id}
                                                    onClick={() => updateStatus(application.id, 'shortlisted')}
                                                    className="rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-800 hover:bg-purple-100 border border-purple-200 cursor-pointer disabled:opacity-50"
                                                >
                                                    Shortlist for Interview →
                                                </button>
                                            )}
                                            {application.status === 'shortlisted' && (
                                                <button
                                                    type="button"
                                                    disabled={updating === application.id}
                                                    onClick={() => updateStatus(application.id, 'hired')}
                                                    className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer disabled:opacity-50"
                                                >
                                                    Mark as Hired / Offer →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-zinc-200 p-12 text-center bg-white">
                    <UsersRound className="size-10 mx-auto text-zinc-300" />
                    <h3 className="mt-3 text-sm font-bold text-zinc-800">
                        No candidates match this filter
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                        {allApplications.length === 0
                            ? 'No candidates have submitted applications for this job posting yet.'
                            : 'No applicants found matching your current filter criteria.'}
                    </p>
                    {statusFilter !== 'all' && (
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className="mt-3 text-xs font-semibold text-[#E47818] hover:underline cursor-pointer"
                        >
                            Clear filter to see all {allApplications.length} candidates
                        </button>
                    )}
                </div>
            )}

            {/* Candidate Evaluation Dossier Modal */}
            {inspectingApp && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={() => setInspectingApp(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Candidate Evaluation Dossier"
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <Avatar className="size-14 overflow-hidden rounded-2xl ring-2 ring-[#001c17]/10 shrink-0">
                                    <AvatarFallback className="rounded-2xl bg-[#001c17] text-lg font-bold text-white">
                                        {initials(
                                            inspectingApp.alumni_profile?.name ?? 'Candidate',
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold text-zinc-900">
                                            {inspectingApp.alumni_profile?.name ?? 'Applicant'}
                                        </h2>
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                            Verified Graduate
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {inspectingApp.alumni_profile?.email} · Applied on{' '}
                                        {new Date(inspectingApp.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setInspectingApp(null)}
                                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-5 text-xs">
                            {/* Current Stage Card */}
                            <div className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        Current Recruitment Stage
                                    </span>
                                    <p className="mt-0.5 text-sm font-bold text-zinc-900 capitalize">
                                        {inspectingApp.status.replace('_', ' ')}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full border px-3 py-1 font-semibold ${employerStatusConfig[inspectingApp.status]?.badgeClass ??
                                        'bg-zinc-100 text-zinc-700'
                                        }`}
                                >
                                    {employerStatusConfig[inspectingApp.status]?.label ??
                                        inspectingApp.status}
                                </span>
                            </div>

                            {/* Cover Letter */}
                            {inspectingApp.cover_letter ? (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                        Cover Letter / Applicant Pitch
                                    </h3>
                                    <div className="mt-1.5 rounded-2xl border border-zinc-200/60 bg-zinc-50/70 p-4 leading-relaxed text-zinc-700 whitespace-pre-line text-xs">
                                        {inspectingApp.cover_letter}
                                    </div>
                                </div>
                            ) : null}

                            {/* Verified Educational Credentials */}
                            {inspectingApp.profile_snapshot?.education?.length ? (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                        Registrar-Verified Academic Records (RA 10173)
                                    </h3>
                                    <div className="mt-1.5 space-y-2">
                                        {inspectingApp.profile_snapshot.education.map(
                                            (edu: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-bold text-zinc-900 text-sm">
                                                                {edu.program ?? edu.degree}
                                                            </p>
                                                            <p className="text-xs text-zinc-600 mt-0.5">
                                                                Student ID: {edu.student_number ?? 'Verified'}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            {edu.graduation_year && (
                                                                <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-[10px] font-bold text-zinc-800">
                                                                    Class of {edu.graduation_year}
                                                                </span>
                                                            )}
                                                            {edu.honors && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                                                                    <Award className="size-3 text-amber-700" />
                                                                    {edu.honors}
                                                                </span>
                                                            )}
                                                            {edu.gwa && (
                                                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-300">
                                                                    GWA {edu.gwa}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {/* Verified Career Experience */}
                            {inspectingApp.profile_snapshot?.employment?.length ? (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                        Reported Career Milestones
                                    </h3>
                                    <div className="mt-1.5 space-y-2">
                                        {inspectingApp.profile_snapshot.employment.map(
                                            (exp: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3.5"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-bold text-zinc-900">
                                                            {exp.job_title}
                                                        </p>
                                                        {exp.is_related_to_degree && (
                                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                                                Degree-aligned
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-zinc-600 mt-0.5">
                                                        {exp.employer_name}{' '}
                                                        {exp.industry ? `· ${exp.industry}` : ''}
                                                    </p>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {/* Resume Snapshot Download & View */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4">
                                <div className="flex items-center gap-2.5">
                                    <FileText className="size-4 text-[#001c17]" />
                                    <div>
                                        <span className="block font-semibold text-zinc-800 text-xs">
                                            {inspectingApp.resume_snapshot_path
                                                ? inspectingApp.resume_snapshot_path.toLowerCase().endsWith('.docx')
                                                    ? 'Transmitted Word Resume (.docx)'
                                                    : inspectingApp.resume_snapshot_path.toLowerCase().endsWith('.doc')
                                                    ? 'Transmitted Word Document (.doc)'
                                                    : 'Transmitted Candidate Resume (PDF)'
                                                : 'Verified Academic & Career Dossier'}
                                        </span>
                                        <span className="block text-[10px] text-zinc-400">
                                            {inspectingApp.resume_snapshot_path
                                                ? inspectingApp.resume_snapshot_path.toLowerCase().endsWith('.docx')
                                                    ? 'Submitted as Microsoft Word document'
                                                    : 'Verified PDF credential document'
                                                : 'Generated from RA 10173 verified registrar records'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <a
                                        href={`/api/applications/${inspectingApp.id}/resume?inline=1`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                                        title="View verified PDF resume in browser"
                                    >
                                        <Eye className="size-3.5 text-zinc-500" />
                                        View Online (PDF)
                                    </a>
                                    <a
                                        href={`/api/applications/${inspectingApp.id}/resume?download=1`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#001c17] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b382f]"
                                        title="Download candidate resume"
                                    >
                                        <Download className="size-3.5" />
                                        {inspectingApp.resume_snapshot_path?.toLowerCase().endsWith('.docx')
                                            ? 'Download (.docx)'
                                            : 'Download (.pdf)'}
                                    </a>
                                </div>
                            </div>

                            {/* Stage Progression Actions */}
                            <div className="border-t border-zinc-100 pt-4">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
                                    Update Candidate Stage
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                    {[
                                        { id: 'submitted', label: 'Reset to New', color: 'border-zinc-200 hover:bg-zinc-50 text-zinc-700' },
                                        { id: 'reviewing', label: 'Under Review', color: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100' },
                                        { id: 'shortlisted', label: 'Shortlist for Interview', color: 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100' },
                                        { id: 'hired', label: 'Offer / Hired', color: 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100' },
                                        { id: 'rejected', label: 'Not Selected', color: 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100' },
                                    ].map((btn) => (
                                        <button
                                            key={btn.id}
                                            type="button"
                                            disabled={updating === inspectingApp.id || inspectingApp.status === btn.id}
                                            onClick={() => updateStatus(inspectingApp.id, btn.id)}
                                            className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-40 ${btn.color} ${inspectingApp.status === btn.id ? 'ring-2 ring-offset-1 ring-[#001c17]' : ''
                                                }`}
                                        >
                                            {updating === inspectingApp.id ? 'Updating…' : btn.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-zinc-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setInspectingApp(null)}
                                className="h-10 rounded-xl bg-zinc-100 px-5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                            >
                                Close Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function RegistrationAssistanceQueue() {
    const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewed' | 'needs_more_information' | 'rejected' | 'all'>('pending');
    const [search, setSearch] = useState('');
    const resource = useApiResource<PaginatedApiResponse<RegistrationAssistanceRequest>>(
        `/api/registration-assistance?status=${statusFilter}`,
    );
    const programsResource = useApiResource<ApiEnvelope<AcademicProgram[]>>('/api/programs');
    const programs = programsResource.data?.data ?? [];

    const [selectedRequest, setSelectedRequest] = useState<RegistrationAssistanceRequest | null>(null);
    const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'needs_more_information' | 'rejected'>('reviewed');
    const [resolutionAction, setResolutionAction] = useState<'sync_record' | 'create_record' | 'provision_account' | 'manual_review'>('sync_record');
    const [overrideProgramId, setOverrideProgramId] = useState<string>('');
    const [overrideGradYear, setOverrideGradYear] = useState<string>('');
    const [provisionPassword, setProvisionPassword] = useState<string>('AlumniClaim2026!');
    const [reviewNote, setReviewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function openReviewModal(
        request: RegistrationAssistanceRequest,
        defaultStatus: 'reviewed' | 'needs_more_information' | 'rejected',
    ) {
        setSelectedRequest(request);
        setReviewStatus(defaultStatus);
        const recommended = request.registrar_match?.recommended_action ?? 'sync_record';
        setResolutionAction(recommended);
        setOverrideProgramId(request.academic_program_id ? String(request.academic_program_id) : '');
        setOverrideGradYear(
            request.graduation_year
                ? String(request.graduation_year)
                : request.registrar_match?.profile?.graduation_year
                    ? String(request.registrar_match.profile.graduation_year)
                    : '',
        );
        setProvisionPassword('AlumniClaim2026!');
        if (defaultStatus === 'reviewed') {
            setReviewNote(
                request.review_note ||
                (recommended === 'create_record'
                    ? 'Created official alumni profile from verified claim request. You may now complete registration.'
                    : recommended === 'sync_record'
                        ? 'Synchronized official registrar record with verified claim details. You may now complete registration.'
                        : 'Verified with official registrar records. Account approved.'),
            );
        } else {
            setReviewNote(request.review_note || '');
        }
    }

    async function handleReviewSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedRequest) return;

        setSubmitting(true);
        try {
            await apiRequest(`/api/registration-assistance/${selectedRequest.id}`, {
                method: 'PATCH',
                body: {
                    status: reviewStatus,
                    resolution_action: reviewStatus === 'reviewed' ? resolutionAction : 'manual_review',
                    academic_program_id: overrideProgramId ? Number(overrideProgramId) : null,
                    graduation_year: overrideGradYear ? Number(overrideGradYear) : null,
                    temporary_password:
                        reviewStatus === 'reviewed' && resolutionAction === 'provision_account'
                            ? provisionPassword || undefined
                            : undefined,
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

    const rawPayload = resource.data?.data as
        | RegistrationAssistanceRequest[]
        | { data?: RegistrationAssistanceRequest[] }
        | undefined;
    const allItems: RegistrationAssistanceRequest[] = Array.isArray(rawPayload)
        ? rawPayload
        : Array.isArray(rawPayload?.data)
            ? rawPayload.data
            : [];
    const items = allItems.filter((item) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
            item.name.toLowerCase().includes(q) ||
            item.student_number.toLowerCase().includes(q) ||
            item.email.toLowerCase().includes(q)
        );
    });

    function getMatchBadge(match?: RegistrationAssistanceRequest['registrar_match']) {
        if (!match) return null;
        switch (match.match_status) {
            case 'not_found':
                return {
                    label: 'No Registrar Record Found',
                    className: 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]',
                };
            case 'already_claimed':
                return {
                    label: 'Account Already Claimed',
                    className: 'bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]',
                };
            case 'dob_mismatch':
                return {
                    label: 'Birthdate Mismatch',
                    className: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]',
                };
            case 'name_mismatch':
                return {
                    label: 'Name Discrepancy',
                    className: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]',
                };
            case 'multiple_mismatches':
                return {
                    label: 'Name & Birthdate Mismatch',
                    className: 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]',
                };
            case 'ready_to_claim':
                return {
                    label: 'Exact Match · Ready to Claim',
                    className: 'bg-[#edf7ee] text-[#1f5130] border-[#bbf7d0]',
                };
            default:
                return null;
        }
    }

    function getStatusPill(status: RegistrationAssistanceRequest['status']) {
        switch (status) {
            case 'pending':
                return { label: 'Pending Review', className: 'bg-[#fffbeb] text-[#92400e]' };
            case 'reviewed':
                return { label: 'Approved & Resolved', className: 'bg-[#edf7ee] text-[#1f5130]' };
            case 'needs_more_information':
                return { label: 'Needs More Info', className: 'bg-[#eff6ff] text-[#1e40af]' };
            case 'rejected':
                return { label: 'Rejected', className: 'bg-[#fef2f2] text-[#991b1b]' };
        }
    }

    return (
        <div className="space-y-4">
            {/* Filter & Search Toolbar */}
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-1.5">
                    {(
                        [
                            { value: 'pending', label: 'Pending' },
                            { value: 'needs_more_information', label: 'Needs Info' },
                            { value: 'reviewed', label: 'Resolved' },
                            { value: 'rejected', label: 'Rejected' },
                            { value: 'all', label: 'All History' },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => setStatusFilter(tab.value)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${statusFilter === tab.value
                                    ? 'bg-[#2b5139] text-white shadow-xs'
                                    : 'bg-[#f4f6f2] text-[#526051] hover:bg-[#e9ede6]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="w-full sm:w-64">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, student #, email…"
                        className="h-9 w-full rounded-xl border border-[#dfe5dc] bg-[#fafbf9] px-3 text-xs text-[#29382e] outline-none focus:border-[#2b5139]"
                    />
                </div>
            </div>

            {resource.loading ? (
                <LoadingState />
            ) : resource.error ? (
                <ErrorState message={resource.error} />
            ) : !items.length ? (
                <EmptyState>
                    {`No ${statusFilter === 'all' ? '' : `${statusFilter.replace(/_/g, ' ')} `}registration assistance requests found.`}
                </EmptyState>
            ) : (
                <div className="grid gap-3">
                    {items.map((request) => {
                        const matchBadge = getMatchBadge(request.registrar_match);
                        const statusPill = getStatusPill(request.status);
                        const officialProfile = request.registrar_match?.profile;

                        return (
                            <article
                                key={request.id}
                                className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5"
                            >
                                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                    <div className="flex-1 space-y-2.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded bg-[#f4f6f2] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#526051]">
                                                #{request.id}
                                            </span>
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
                                            {request.graduation_year && (
                                                <span className="rounded bg-[#f0f4ee] px-2 py-0.5 text-[10px] font-medium text-[#465a49]">
                                                    Batch {request.graduation_year}
                                                </span>
                                            )}
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusPill.className}`}>
                                                {statusPill.label}
                                            </span>
                                            {matchBadge && (
                                                <span
                                                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${matchBadge.className}`}
                                                >
                                                    {matchBadge.label}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#70796e]">
                                            <p>
                                                Email: <span className="font-medium text-[#3b473d]">{request.email}</span>
                                            </p>
                                            <p>
                                                Submitted DOB: <span className="font-medium text-[#3b473d]">{String(request.date_of_birth ?? '').slice(0, 10)}</span>
                                            </p>
                                            <p>
                                                Requested: <span className="text-[#3b473d]">{new Date(request.created_at).toLocaleDateString()}</span>
                                            </p>
                                        </div>

                                        {/* Registrar Diagnostic & Side-by-Side Comparison */}
                                        {request.registrar_match && (
                                            <div className="rounded-xl border border-[#e5ebe2] bg-[#f9fbf8] p-3 text-xs">
                                                <p className="font-medium text-[#2c3d30]">
                                                    Registrar Diagnostic: <span className="font-normal text-[#4f5d50]">{request.registrar_match.summary}</span>
                                                </p>
                                                {officialProfile && (
                                                    <div className="mt-2 grid gap-2 border-t border-[#e5ebe2] pt-2 sm:grid-cols-2">
                                                        <div>
                                                            <p className="text-[10px] font-semibold tracking-wider text-[#6e7b6e] uppercase">
                                                                Submitted Claim Details
                                                            </p>
                                                            <p className="mt-0.5 text-[#29382e]">
                                                                Name: <span className="font-medium">{request.name}</span>
                                                            </p>
                                                            <p className="text-[#29382e]">
                                                                Birthdate: <span className="font-medium">{String(request.date_of_birth ?? '').slice(0, 10)}</span>
                                                            </p>
                                                            <p className="text-[#29382e]">
                                                                Email: <span className="font-medium">{request.email}</span>
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-semibold tracking-wider text-[#6e7b6e] uppercase">
                                                                Official Registrar Record (#{officialProfile.id})
                                                            </p>
                                                            <p className="mt-0.5 text-[#29382e]">
                                                                Name:{' '}
                                                                <span
                                                                    className={`font-medium ${officialProfile.name.toLowerCase() !== request.name.toLowerCase()
                                                                            ? 'text-[#b45309] underline'
                                                                            : ''
                                                                        }`}
                                                                >
                                                                    {officialProfile.name}
                                                                </span>
                                                            </p>
                                                            <p className="text-[#29382e]">
                                                                Birthdate:{' '}
                                                                <span
                                                                    className={`font-medium ${String(officialProfile.date_of_birth ?? '').slice(0, 10) !== String(request.date_of_birth ?? '').slice(0, 10)
                                                                            ? 'text-[#b45309] underline'
                                                                            : ''
                                                                        }`}
                                                                >
                                                                    {officialProfile.date_of_birth ?? 'Not set in registrar record'}
                                                                </span>
                                                            </p>
                                                            <p className="text-[#29382e]">
                                                                Program/Batch:{' '}
                                                                <span className="font-medium">
                                                                    {officialProfile.program_code ?? 'Unassigned'}{' '}
                                                                    {officialProfile.graduation_year ? `(${officialProfile.graduation_year})` : ''}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {request.message && (
                                            <p className="rounded-xl bg-[#fafbf9] p-3 text-xs leading-5 text-[#526051]">
                                                <span className="font-semibold text-[#3b473d]">Applicant note:</span> "{request.message}"
                                            </p>
                                        )}

                                        {request.reviewed_at && (
                                            <div className="rounded-xl border border-[#e3eae0] bg-[#f4f7f3] px-3 py-2 text-xs text-[#435245]">
                                                <p className="font-semibold text-[#29382e]">
                                                    Reviewed {new Date(request.reviewed_at).toLocaleString()}
                                                    {request.reviewed_by ? ` by ${request.reviewed_by.name}` : ''}
                                                    {request.resolution_action ? ` · Action: ${request.resolution_action.replace(/_/g, ' ')}` : ''}
                                                </p>
                                                {request.review_note && <p className="mt-0.5 text-[#526051]">{request.review_note}</p>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openReviewModal(request, 'reviewed')}
                                            className="rounded-xl bg-[#2b5139] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#22442e]"
                                        >
                                            {request.status === 'reviewed' ? 'Update resolution' : 'Resolve & approve'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openReviewModal(request, 'needs_more_information')}
                                            className="rounded-xl border border-[#d2ddd0] bg-white px-3 py-1.5 text-xs font-medium text-[#435245] hover:bg-[#f4f6f2]"
                                        >
                                            Review / Ask info
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-[#29382e]">
                                    Resolve Registration Claim #{selectedRequest.id}
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

                        {selectedRequest.registrar_match && (
                            <div className="mt-3 rounded-xl border border-[#e5ebe2] bg-[#f9fbf8] p-3 text-xs text-[#3b473d]">
                                <p className="font-semibold text-[#29382e]">Diagnostic Summary</p>
                                <p className="mt-0.5">{selectedRequest.registrar_match.summary}</p>
                            </div>
                        )}

                        <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3">
                            <label className="block text-xs font-medium text-[#4d5a4f]">
                                Decision outcome
                                <select
                                    value={reviewStatus}
                                    onChange={(e) => setReviewStatus(e.target.value as any)}
                                    className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                                >
                                    <option value="reviewed">Approve & resolve claim (Reviewed)</option>
                                    <option value="needs_more_information">Request more information from applicant</option>
                                    <option value="rejected">Reject claim</option>
                                </select>
                            </label>

                            {reviewStatus === 'reviewed' && (
                                <div className="space-y-3 rounded-xl border border-[#dfe7dc] bg-[#f8faf7] p-3.5">
                                    <label className="block text-xs font-semibold text-[#29382e]">
                                        Registrar Record Resolution Action
                                        <select
                                            value={resolutionAction}
                                            onChange={(e) => setResolutionAction(e.target.value as any)}
                                            className="mt-1 h-9 w-full rounded-lg border border-[#d6dfd2] bg-white px-3 text-xs font-normal"
                                        >
                                            <option value="sync_record">
                                                Sync Official Record with Submitted Details (Unblocks self-registration)
                                            </option>
                                            <option value="create_record">
                                                Create Official Alumni Record (If missing from registrar list)
                                            </option>
                                            <option value="provision_account">
                                                Sync/Create Record & Provision User Account Immediately
                                            </option>
                                            <option value="manual_review">
                                                Mark Reviewed Only (Do not modify alumni profile)
                                            </option>
                                        </select>
                                    </label>

                                    {resolutionAction !== 'manual_review' && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <label className="block text-xs font-medium text-[#4d5a4f]">
                                                Academic Program
                                                <select
                                                    value={overrideProgramId}
                                                    onChange={(e) => setOverrideProgramId(e.target.value)}
                                                    className="mt-1 h-9 w-full rounded-lg border border-[#d6dfd2] bg-white px-2.5 text-xs"
                                                >
                                                    <option value="">Keep existing / unassigned</option>
                                                    {programs.map((prog) => (
                                                        <option key={prog.id} value={prog.id}>
                                                            {prog.code} — {prog.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="block text-xs font-medium text-[#4d5a4f]">
                                                Graduation Year
                                                <input
                                                    type="number"
                                                    min={1950}
                                                    max={2100}
                                                    value={overrideGradYear}
                                                    onChange={(e) => setOverrideGradYear(e.target.value)}
                                                    placeholder="e.g. 2024"
                                                    className="mt-1 h-9 w-full rounded-lg border border-[#d6dfd2] bg-white px-2.5 text-xs"
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {resolutionAction === 'provision_account' && (
                                        <label className="block text-xs font-medium text-[#4d5a4f]">
                                            Temporary Account Password (include in review note so applicant can sign in)
                                            <input
                                                type="text"
                                                value={provisionPassword}
                                                onChange={(e) => setProvisionPassword(e.target.value)}
                                                className="mt-1 h-9 w-full rounded-lg border border-[#d6dfd2] bg-white px-2.5 font-mono text-xs"
                                            />
                                        </label>
                                    )}
                                </div>
                            )}

                            <label className="block text-xs font-medium text-[#4d5a4f]">
                                Review note (visible to applicant via Reference Status Checker)
                                <textarea
                                    rows={3}
                                    value={reviewNote}
                                    onChange={(e) => setReviewNote(e.target.value)}
                                    placeholder="Enter review explanation or next steps for the applicant..."
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

const EVENT_TYPE_OPTIONS = [
    {
        value: 'homecoming',
        label: 'Homecoming',
        badgeClass: 'bg-[#edf2eb] text-[#2b5139]',
    },
    {
        value: 'career_fair',
        label: 'Career Fair',
        badgeClass: 'bg-[#e8eff4] text-[#2c5270]',
    },
    {
        value: 'networking',
        label: 'Networking',
        badgeClass: 'bg-[#f4efe6] text-[#7a5828]',
    },
    {
        value: 'webinar',
        label: 'Webinar / Talk',
        badgeClass: 'bg-[#efeaf4] text-[#583b78]',
    },
    {
        value: 'workshop',
        label: 'Workshop',
        badgeClass: 'bg-[#f2f4f0] text-[#556256]',
    },
    {
        value: 'reunion',
        label: 'Batch Reunion',
        badgeClass: 'bg-[#faeae8] text-[#9e382b]',
    },
] as const;

const EVENT_FORMAT_OPTIONS = [
    { value: 'in_person', label: 'In-person' },
    { value: 'online', label: 'Online' },
    { value: 'hybrid', label: 'Hybrid' },
] as const;

export function EventCenter({
    role,
    createOpen,
    onCloseCreate,
}: {
    role: WorkspaceRole;
    createOpen: boolean;
    onCloseCreate: () => void;
}) {
    const canManage =
        role === 'Administrator' || role === 'Alumni coordinator';
    const meRes = useApiResource<ApiEnvelope<AlumniProfile>>(
        role === 'Alumni' ? '/api/me/alumni' : null,
    );
    const alumniProfile = meRes.data?.data;
    const isProfileComplete = Boolean(alumniProfile?.is_complete);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const { data, loading, error, reload } = useApiResource<
        ApiEnvelope<RawPagination<AlumniEvent>>
    >(canManage ? '/api/events/manage' : '/api/events');
    const departmentsRes = useApiResource<ApiEnvelope<AcademicDepartment[]>>(
        canManage ? '/api/departments' : null,
    );
    const programsRes = useApiResource<ApiEnvelope<AcademicProgram[]>>(
        canManage ? '/api/programs' : null,
    );

    const [editingId, setEditingId] = useState<number | null>(null);
    const [composerOpen, setComposerOpen] = useState(false);
    const [showCohortTargeting, setShowCohortTargeting] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        event_type: 'homecoming',
        format: 'in_person',
        venue: '',
        meeting_url: '',
        starts_at: '',
        ends_at: '',
        registration_deadline: '',
        capacity: '',
        is_featured: false,
        is_public: true,
        publish_now: false,
        notify_audience: true,
        audience_roles: [] as string[],
        target_department_ids: [] as number[],
        target_program_ids: [] as number[],
        graduation_years_text: '',
    });

    const [saving, setSaving] = useState(false);
    const [publishingId, setPublishingId] = useState<number | null>(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(
        null,
    );
    const [featuringId, setFeaturingId] = useState<number | null>(null);
    const [rsvpUpdatingId, setRsvpUpdatingId] = useState<number | null>(null);

    // Attendee Roster State
    const [activeAttendeesEventId, setActiveAttendeesEventId] = useState<
        number | null
    >(null);
    const [attendeesLoading, setAttendeesLoading] = useState(false);
    const [attendeesMap, setAttendeesMap] = useState<
        Record<number, AlumniEventAttendee[]>
    >({});

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [viewFilter, setViewFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const isFormVisible = canManage && (createOpen || composerOpen);

    function resetForm() {
        setEditingId(null);
        setComposerOpen(false);
        setShowCohortTargeting(false);
        setForm({
            title: '',
            description: '',
            event_type: 'homecoming',
            format: 'in_person',
            venue: '',
            meeting_url: '',
            starts_at: '',
            ends_at: '',
            registration_deadline: '',
            capacity: '',
            is_featured: false,
            is_public: true,
            publish_now: false,
            notify_audience: true,
            audience_roles: [],
            target_department_ids: [],
            target_program_ids: [],
            graduation_years_text: '',
        });
        onCloseCreate();
    }

    function toDatetimeLocalValue(iso: string | null): string {
        if (!iso) return '';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function openEdit(eventItem: AlumniEvent) {
        setEditingId(eventItem.id);
        const hasCohort = Boolean(
            eventItem.target_department_ids?.length ||
            eventItem.target_program_ids?.length ||
            eventItem.target_graduation_years?.length,
        );
        setShowCohortTargeting(hasCohort);
        setForm({
            title: eventItem.title,
            description: eventItem.description,
            event_type: eventItem.event_type ?? 'homecoming',
            format: eventItem.format ?? 'in_person',
            venue: eventItem.venue ?? '',
            meeting_url: eventItem.meeting_url ?? '',
            starts_at: toDatetimeLocalValue(eventItem.starts_at),
            ends_at: toDatetimeLocalValue(eventItem.ends_at),
            registration_deadline: toDatetimeLocalValue(
                eventItem.registration_deadline,
            ),
            capacity:
                eventItem.capacity !== null && eventItem.capacity !== undefined
                    ? String(eventItem.capacity)
                    : '',
            is_featured: Boolean(eventItem.is_featured),
            is_public: eventItem.is_public ?? true,
            publish_now: false,
            notify_audience: false,
            audience_roles: eventItem.audience_roles ?? [],
            target_department_ids: eventItem.target_department_ids ?? [],
            target_program_ids: eventItem.target_program_ids ?? [],
            graduation_years_text: (
                eventItem.target_graduation_years ?? []
            ).join(', '),
        });
        setComposerOpen(true);
    }

    async function saveEvent(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);

        const parsedYears = form.graduation_years_text
            .split(',')
            .map((s) => Number.parseInt(s.trim(), 10))
            .filter((n) => !Number.isNaN(n) && n >= 1950 && n <= 2100);

        const payload = {
            title: form.title,
            description: form.description,
            event_type: form.event_type,
            format: form.format,
            venue: form.venue.trim() || null,
            meeting_url: form.meeting_url.trim() || null,
            starts_at: form.starts_at,
            ends_at: form.ends_at || null,
            registration_deadline: form.registration_deadline || null,
            capacity: form.capacity ? Number(form.capacity) : null,
            is_featured: form.is_featured,
            is_public: form.is_public,
            audience_roles: form.audience_roles.length
                ? form.audience_roles
                : null,
            target_department_ids: form.target_department_ids.length
                ? form.target_department_ids
                : null,
            target_program_ids: form.target_program_ids.length
                ? form.target_program_ids
                : null,
            target_graduation_years: parsedYears.length ? parsedYears : null,
            ...(editingId === null
                ? {
                    publish_now: form.publish_now,
                    notify_audience: form.notify_audience,
                }
                : {}),
        };

        try {
            if (editingId !== null) {
                await apiRequest<ApiEnvelope<AlumniEvent>>(
                    `/api/events/${editingId}`,
                    {
                        method: 'PATCH',
                        body: payload,
                    },
                );
                toast.success('Event updated.');
            } else {
                await apiRequest<ApiEnvelope<AlumniEvent>>('/api/events', {
                    method: 'POST',
                    body: payload,
                });
                toast.success(
                    form.publish_now
                        ? 'Event created and published.'
                        : 'Event saved as a draft.',
                );
            }
            resetForm();
            reload();
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Event could not be saved.',
            );
        } finally {
            setSaving(false);
        }
    }

    async function publishEvent(id: number) {
        setPublishingId(id);
        try {
            await apiRequest<ApiEnvelope<AlumniEvent>>(
                `/api/events/${id}/publish`,
                { method: 'POST' },
            );
            reload();
            toast.success('Event published.');
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Event could not be published.',
            );
        } finally {
            setPublishingId(null);
        }
    }

    async function updateEventStatus(
        id: number,
        nextStatus: 'draft' | 'cancelled' | 'completed',
    ) {
        setStatusUpdatingId(id);
        try {
            await apiRequest<ApiEnvelope<AlumniEvent>>(
                `/api/events/${id}/status`,
                {
                    method: 'POST',
                    body: { status: nextStatus },
                },
            );
            reload();
            toast.success(`Event marked as ${nextStatus}.`);
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Event status could not be updated.',
            );
        } finally {
            setStatusUpdatingId(null);
        }
    }

    async function toggleFeatureEvent(eventItem: AlumniEvent) {
        setFeaturingId(eventItem.id);
        try {
            await apiRequest<ApiEnvelope<AlumniEvent>>(
                `/api/events/${eventItem.id}`,
                {
                    method: 'PATCH',
                    body: { is_featured: !eventItem.is_featured },
                },
            );
            reload();
            toast.success(
                eventItem.is_featured
                    ? 'Removed from featured events.'
                    : 'Marked as featured event.',
            );
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Feature status could not be updated.',
            );
        } finally {
            setFeaturingId(null);
        }
    }

    async function handleRsvp(
        eventId: number,
        status: 'going' | 'interested' | 'cancelled',
    ) {
        if (role === 'Alumni' && !isProfileComplete) {
            toast.error(
                'Please complete your profile (gender, civil status, contact number, current address, and permanent address) before participating in events.',
            );
            setProfileModalOpen(true);
            return;
        }
        setRsvpUpdatingId(eventId);
        try {
            await apiRequest<ApiEnvelope<AlumniEvent>>(
                `/api/events/${eventId}/rsvp`,
                {
                    method: 'POST',
                    body: { status },
                },
            );
            reload();
            toast.success(
                status === 'going'
                    ? 'You are registered as Going!'
                    : status === 'interested'
                        ? 'Marked as Interested.'
                        : 'Your RSVP has been cancelled.',
            );
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'RSVP could not be updated.',
            );
        } finally {
            setRsvpUpdatingId(null);
        }
    }

    async function toggleAttendees(eventId: number) {
        if (activeAttendeesEventId === eventId) {
            setActiveAttendeesEventId(null);
            return;
        }
        setActiveAttendeesEventId(eventId);
        setAttendeesLoading(true);
        try {
            const res = await apiRequest<ApiEnvelope<AlumniEventAttendee[]>>(
                `/api/events/${eventId}/attendees`,
            );
            setAttendeesMap((prev) => ({
                ...prev,
                [eventId]: res.data ?? [],
            }));
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Attendee list could not be loaded.',
            );
        } finally {
            setAttendeesLoading(false);
        }
    }

    async function deleteEvent(id: number): Promise<boolean> {
        try {
            await apiRequest(`/api/events/${id}`, {
                method: 'DELETE',
            });
            reload();
            toast.success('Event deleted.');
            return true;
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Event could not be deleted.',
            );
            return false;
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const events = data?.data.data ?? [];
    const departmentsList = departmentsRes.data?.data ?? [];
    const programsList = programsRes.data?.data ?? [];

    const nowMs = Date.now();
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredEvents = events.filter((item) => {
        const startsMs = new Date(item.starts_at).getTime();
        const isUpcoming = startsMs >= nowMs - 86400000;

        if (viewFilter === 'upcoming' && !isUpcoming) return false;
        if (viewFilter === 'past' && isUpcoming) return false;
        if (viewFilter === 'featured' && !item.is_featured) return false;
        if (
            viewFilter === 'my_rsvp' &&
            item.my_registration_status !== 'going' &&
            item.my_registration_status !== 'interested'
        ) {
            return false;
        }
        if (viewFilter === 'draft' && item.status !== 'draft') return false;

        if (typeFilter !== 'all' && item.event_type !== typeFilter) {
            return false;
        }

        if (!normalizedQuery) return true;
        return (
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.description.toLowerCase().includes(normalizedQuery) ||
            (item.venue?.toLowerCase().includes(normalizedQuery) ?? false)
        );
    });

    const upcomingCount = events.filter(
        (e) =>
            e.status === 'published' &&
            new Date(e.starts_at).getTime() >= nowMs - 86400000,
    ).length;
    const featuredCount = events.filter((e) => e.is_featured).length;
    const myRsvpCount = events.filter(
        (e) =>
            e.my_registration_status === 'going' ||
            e.my_registration_status === 'interested',
    ).length;
    const draftCount = events.filter((e) => e.status === 'draft').length;

    return (
        <div className="space-y-4">
            {/* Summary, Search & Filter Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#edf2eb] px-3 py-1 text-xs font-semibold text-[#2b5139]">
                            📅 {upcomingCount} Upcoming
                        </span>
                        {featuredCount > 0 && (
                            <span className="rounded-full bg-[#f4efe6] px-3 py-1 text-xs font-semibold text-[#7a5828]">
                                🌟 {featuredCount} Featured
                            </span>
                        )}
                        <span className="rounded-full bg-[#e8eff4] px-3 py-1 text-xs font-semibold text-[#2c5270]">
                            {myRsvpCount} My RSVPs
                        </span>
                        {canManage && (
                            <span className="rounded-full bg-[#f3f5f1] px-3 py-1 text-xs font-medium text-[#5d685e]">
                                {draftCount} Drafts
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-[#eff0ec] pt-3 lg:flex-row lg:items-center lg:justify-between">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events by title, venue, or topic…"
                        className="h-9 w-full rounded-xl border border-[#dfe5dd] bg-[#fafbf9] px-3 text-xs text-[#29382e] outline-none focus:border-[#6d8b72] lg:max-w-xs"
                    />

                    <div className="flex flex-wrap items-center gap-1.5">
                        {(
                            [
                                ['all', 'All'],
                                ['upcoming', 'Upcoming'],
                                ['featured', '🌟 Featured'],
                                ['my_rsvp', 'My RSVPs'],
                                ...(canManage
                                    ? ([
                                        ['draft', 'Drafts'],
                                        ['past', 'Past'],
                                    ] as const)
                                    : ([['past', 'Past']] as const)),
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setViewFilter(key)}
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${viewFilter === key
                                        ? 'bg-[#2b5139] text-white'
                                        : 'border border-[#e2e7df] bg-[#fafbf9] text-[#5e6a5f] hover:bg-[#eff2ed]'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}

                        <select
                            aria-label="Filter by event type"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-7 rounded-full border border-[#dce2d9] bg-white px-2.5 text-[11px] font-medium text-[#4d5a4f] outline-none"
                        >
                            <option value="all">All Event Types</option>
                            {EVENT_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Create / Edit Event Composer */}
            {isFormVisible ? (
                <form
                    onSubmit={saveEvent}
                    className="space-y-4 rounded-2xl border border-[#cfe0cc] bg-white p-4 shadow-2xs sm:p-5"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eff0ec] pb-3">
                        <div>
                            <h3 className="text-sm font-semibold text-[#29382e]">
                                {editingId !== null
                                    ? 'Edit Event'
                                    : 'Create Alumni Event'}
                            </h3>
                            <p className="text-xs text-[#737c72]">
                                Schedule homecomings, career fairs, webinars, or
                                cohort reunions with built-in RSVP tracking.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setShowCohortTargeting((prev) => !prev)
                            }
                            className="rounded-lg border border-[#cfe0cc] bg-[#edf2eb] px-3 py-1.5 text-[11px] font-semibold text-[#2b5139] hover:bg-[#e1ebe0]"
                        >
                            {showCohortTargeting
                                ? 'Hide cohort targeting'
                                : '🎯 Target specific department / program / batch'}
                        </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                        <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                            Event title
                            <input
                                required
                                maxLength={180}
                                value={form.title}
                                onChange={(e) =>
                                    setForm({ ...form, title: e.target.value })
                                }
                                placeholder="e.g., Grand Alumni Homecoming 2026"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Event type
                            <select
                                value={form.event_type}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        event_type: e.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                            >
                                {EVENT_TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Format
                            <select
                                value={form.format}
                                onChange={(e) =>
                                    setForm({ ...form, format: e.target.value })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                            >
                                {EVENT_FORMAT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Starts at
                            <input
                                required
                                type="datetime-local"
                                value={form.starts_at}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        starts_at: e.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Ends at (optional)
                            <input
                                type="datetime-local"
                                value={form.ends_at}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        ends_at: e.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            RSVP deadline (optional)
                            <input
                                type="datetime-local"
                                value={form.registration_deadline}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        registration_deadline: e.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Max capacity (optional)
                            <input
                                type="number"
                                min={1}
                                value={form.capacity}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        capacity: e.target.value,
                                    })
                                }
                                placeholder="Unlimited"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Venue / Campus location
                            <input
                                maxLength={200}
                                value={form.venue}
                                onChange={(e) =>
                                    setForm({ ...form, venue: e.target.value })
                                }
                                placeholder="e.g., Northfield Grand Hall, Building A"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Online meeting or registration link (optional)
                            <input
                                maxLength={500}
                                value={form.meeting_url}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        meeting_url: e.target.value,
                                    })
                                }
                                placeholder="https://meet.google.com/… or Zoom link"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    </div>

                    <label className="block text-xs font-medium text-[#4d5a4f]">
                        Event description & agenda
                        <textarea
                            required
                            value={form.description}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Share the event agenda, speakers, dress code, or special instructions…"
                            className="mt-1.5 min-h-24 w-full rounded-lg border border-[#e3e7df] p-3 text-xs"
                        />
                    </label>

                    {/* Audience Roles */}
                    <fieldset className="flex flex-wrap gap-4 rounded-xl border border-[#eff0ec] bg-[#fafbf9] p-3 text-xs text-[#687267]">
                        <legend className="px-1 font-semibold text-[#4d5a4f]">
                            Audience roles (leave blank for all authenticated
                            users)
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
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            audience_roles: e.target.checked
                                                ? [
                                                    ...form.audience_roles,
                                                    value,
                                                ]
                                                : form.audience_roles.filter(
                                                    (item) => item !== value,
                                                ),
                                        })
                                    }
                                    className="size-3.5 accent-[#2b5139]"
                                />
                                {label}
                            </label>
                        ))}
                    </fieldset>

                    {/* Cohort Targeting Panel */}
                    {showCohortTargeting && (
                        <div className="space-y-3 rounded-xl border border-[#dce4d9] bg-[#f8faf7] p-4">
                            <div>
                                <h4 className="text-xs font-semibold text-[#2b5139]">
                                    Cohort Targeting (Optional)
                                </h4>
                                <p className="text-[11px] text-[#6d776c]">
                                    Restrict event visibility to specific
                                    academic colleges, degree programs, or
                                    graduating batches.
                                </p>
                            </div>

                            {departmentsList.length > 0 && (
                                <div>
                                    <p className="mb-1.5 text-[11px] font-medium text-[#4d5a4f]">
                                        Target Departments
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {departmentsList.map((dept) => {
                                            const active =
                                                form.target_department_ids.includes(
                                                    dept.id,
                                                );
                                            return (
                                                <button
                                                    key={dept.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setForm({
                                                            ...form,
                                                            target_department_ids:
                                                                active
                                                                    ? form.target_department_ids.filter(
                                                                        (
                                                                            id,
                                                                        ) =>
                                                                            id !==
                                                                            dept.id,
                                                                    )
                                                                    : [
                                                                        ...form.target_department_ids,
                                                                        dept.id,
                                                                    ],
                                                        })
                                                    }
                                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${active
                                                            ? 'bg-[#2b5139] text-white'
                                                            : 'border border-[#dce2d9] bg-white text-[#526053]'
                                                        }`}
                                                >
                                                    {dept.code} · {dept.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {programsList.length > 0 && (
                                <div>
                                    <p className="mb-1.5 text-[11px] font-medium text-[#4d5a4f]">
                                        Target Academic Programs
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {programsList.map((prog) => {
                                            const active =
                                                form.target_program_ids.includes(
                                                    prog.id,
                                                );
                                            return (
                                                <button
                                                    key={prog.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setForm({
                                                            ...form,
                                                            target_program_ids:
                                                                active
                                                                    ? form.target_program_ids.filter(
                                                                        (
                                                                            id,
                                                                        ) =>
                                                                            id !==
                                                                            prog.id,
                                                                    )
                                                                    : [
                                                                        ...form.target_program_ids,
                                                                        prog.id,
                                                                    ],
                                                        })
                                                    }
                                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${active
                                                            ? 'bg-[#2b5139] text-white'
                                                            : 'border border-[#dce2d9] bg-white text-[#526053]'
                                                        }`}
                                                >
                                                    {prog.code}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <label className="block text-xs font-medium text-[#4d5a4f]">
                                Target Graduation Years (comma-separated,
                                optional)
                                <input
                                    value={form.graduation_years_text}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            graduation_years_text:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="e.g., 2016, 2021, 2026"
                                    className="mt-1 h-9 w-full max-w-sm rounded-lg border border-[#dce2d9] bg-white px-3 text-xs"
                                />
                            </label>
                        </div>
                    )}

                    {/* Display & Publishing Options */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eff0ec] pt-3">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#4d5a4f]">
                            <label className="flex items-center gap-2 font-medium">
                                <input
                                    type="checkbox"
                                    checked={form.is_featured}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            is_featured: e.target.checked,
                                        })
                                    }
                                    className="size-3.5 accent-[#2b5139]"
                                />
                                🌟 Feature event
                            </label>

                            <label className="flex items-center gap-2 font-medium">
                                <input
                                    type="checkbox"
                                    checked={form.is_public}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            is_public: e.target.checked,
                                        })
                                    }
                                    className="size-3.5 accent-[#2b5139]"
                                />
                                🌐 Show on public homepage
                            </label>

                            {editingId === null && (
                                <label className="flex items-center gap-2 font-semibold text-[#2b5139]">
                                    <input
                                        type="checkbox"
                                        checked={form.publish_now}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                publish_now: e.target.checked,
                                            })
                                        }
                                        className="size-3.5 accent-[#2b5139]"
                                    />
                                    Publish immediately
                                </label>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="h-9 rounded-lg border border-[#e8eae4] px-3 text-xs font-medium text-[#687267]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white disabled:opacity-60"
                            >
                                {saving
                                    ? 'Saving…'
                                    : editingId !== null
                                        ? 'Save changes'
                                        : form.publish_now
                                            ? 'Create & publish'
                                            : 'Create event'}
                            </button>
                        </div>
                    </div>
                </form>
            ) : null}

            {/* Events Feed */}
            {filteredEvents.length ? (
                <div className="space-y-3">
                    {filteredEvents.map((eventItem) => {
                        const startDate = new Date(eventItem.starts_at);
                        const monthShort = startDate
                            .toLocaleString('en-US', { month: 'short' })
                            .toUpperCase();
                        const dayNum = String(startDate.getDate()).padStart(
                            2,
                            '0',
                        );
                        const typeMeta =
                            EVENT_TYPE_OPTIONS.find(
                                (t) => t.value === eventItem.event_type,
                            ) ?? EVENT_TYPE_OPTIONS[0];
                        const formatLabel =
                            EVENT_FORMAT_OPTIONS.find(
                                (f) => f.value === eventItem.format,
                            )?.label ?? 'In-person';
                        const hasCohort = Boolean(
                            eventItem.target_department_ids?.length ||
                            eventItem.target_program_ids?.length ||
                            eventItem.target_graduation_years?.length,
                        );
                        const goingCount = eventItem.going_count ?? 0;
                        const interestedCount = eventItem.interested_count ?? 0;
                        const myRsvp = eventItem.my_registration_status;
                        const attendeesList = attendeesMap[eventItem.id] ?? [];

                        return (
                            <article
                                key={eventItem.id}
                                className={`rounded-2xl border p-4 sm:p-5 ${eventItem.is_featured
                                        ? 'border-[#cfe0cc] bg-[#fbfcfa]'
                                        : 'border-[#e9ebe5] bg-white'
                                    }`}
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                    {/* Calendar Badge */}
                                    <div
                                        className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border text-center ${eventItem.is_featured
                                                ? 'border-[#2b5139] bg-[#2b5139] text-white'
                                                : 'border-[#dfe5dc] bg-[#f4f7f3] text-[#2b5139]'
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold tracking-wider uppercase">
                                            {monthShort}
                                        </span>
                                        <span className="text-lg leading-none font-bold">
                                            {dayNum}
                                        </span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {eventItem.is_featured && (
                                                <span className="rounded-full bg-[#2b5139] px-2.5 py-0.5 text-[10px] font-bold text-white">
                                                    🌟 Featured
                                                </span>
                                            )}
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${typeMeta.badgeClass}`}
                                            >
                                                {typeMeta.label}
                                            </span>
                                            <span className="rounded-full bg-[#f2f4f0] px-2.5 py-0.5 text-[10px] font-medium text-[#526053]">
                                                {formatLabel}
                                            </span>
                                            <span className="rounded-full bg-[#f2f3ef] px-2.5 py-0.5 text-[10px] font-medium text-[#697367] capitalize">
                                                {eventItem.status}
                                            </span>
                                            {myRsvp && (
                                                <span className="rounded-full bg-[#e3efe4] px-2.5 py-0.5 text-[10px] font-bold text-[#245232]">
                                                    ✓ RSVP:{' '}
                                                    {myRsvp === 'going'
                                                        ? 'Going'
                                                        : 'Interested'}
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="mt-2 text-base font-semibold text-[#29382e]">
                                            {eventItem.title}
                                        </h2>

                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5d685e]">
                                            <span className="inline-flex items-center gap-1">
                                                <Calendar className="size-3.5 text-[#516e55]" />
                                                {startDate.toLocaleDateString(
                                                    undefined,
                                                    {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    },
                                                )}{' '}
                                                ·{' '}
                                                {startDate.toLocaleTimeString(
                                                    [],
                                                    {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                    },
                                                )}
                                            </span>
                                            {eventItem.venue && (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="size-3.5 text-[#516e55]" />
                                                    {eventItem.venue}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 font-medium text-[#2b5139]">
                                                <UsersRound className="size-3.5" />
                                                {goingCount} going
                                                {eventItem.capacity
                                                    ? ` / ${eventItem.capacity} seats`
                                                    : ''}
                                                {interestedCount > 0
                                                    ? ` · ${interestedCount} interested`
                                                    : ''}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-xs leading-5 whitespace-pre-line text-[#6f786e]">
                                            {eventItem.description}
                                        </p>

                                        {eventItem.meeting_url && (
                                            <div className="mt-3">
                                                <a
                                                    href={eventItem.meeting_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#edf2eb] px-3 py-1.5 text-xs font-semibold text-[#2b5139] transition hover:bg-[#dfe8dc]"
                                                >
                                                    Join / Event Link{' '}
                                                    <ArrowRight className="size-3" />
                                                </a>
                                            </div>
                                        )}

                                        {/* Footer Metadata */}
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#858b82]">
                                            {eventItem.registration_deadline && (
                                                <span>
                                                    RSVP by{' '}
                                                    {new Date(
                                                        eventItem.registration_deadline,
                                                    ).toLocaleDateString()}
                                                </span>
                                            )}
                                            {eventItem.author?.name && (
                                                <span>
                                                    · Organized by{' '}
                                                    {eventItem.author.name}
                                                </span>
                                            )}
                                            {hasCohort && (
                                                <span className="rounded bg-[#edf2eb] px-2 py-0.5 font-medium text-[#2b5139]">
                                                    🎯{' '}
                                                    {[
                                                        eventItem
                                                            .target_department_ids
                                                            ?.length
                                                            ? `${eventItem.target_department_ids.length} dept(s)`
                                                            : null,
                                                        eventItem
                                                            .target_program_ids
                                                            ?.length
                                                            ? `${eventItem.target_program_ids.length} program(s)`
                                                            : null,
                                                        eventItem
                                                            .target_graduation_years
                                                            ?.length
                                                            ? `Batch ${eventItem.target_graduation_years.join(', ')}`
                                                            : null,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right-Side RSVP & Manager Controls */}
                                    <div className="flex flex-col items-start gap-2 sm:shrink-0 sm:items-end">
                                        {eventItem.status === 'published' && (
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        rsvpUpdatingId ===
                                                        eventItem.id
                                                    }
                                                    onClick={() =>
                                                        void handleRsvp(
                                                            eventItem.id,
                                                            myRsvp === 'going'
                                                                ? 'cancelled'
                                                                : 'going',
                                                        )
                                                    }
                                                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${myRsvp === 'going'
                                                            ? 'bg-[#2b5139] text-white'
                                                            : 'border border-[#cfe0cc] bg-[#edf2eb] text-[#2b5139] hover:bg-[#dfe8dc]'
                                                        }`}
                                                >
                                                    {myRsvp === 'going'
                                                        ? '✓ Going'
                                                        : 'RSVP Going'}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        rsvpUpdatingId ===
                                                        eventItem.id
                                                    }
                                                    onClick={() =>
                                                        void handleRsvp(
                                                            eventItem.id,
                                                            myRsvp ===
                                                                'interested'
                                                                ? 'cancelled'
                                                                : 'interested',
                                                        )
                                                    }
                                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${myRsvp === 'interested'
                                                            ? 'bg-[#2c5270] text-white'
                                                            : 'border border-[#e3e7df] bg-white text-[#526054] hover:bg-[#f6f7f4]'
                                                        }`}
                                                >
                                                    {myRsvp === 'interested'
                                                        ? '★ Interested'
                                                        : 'Interested'}
                                                </button>
                                            </div>
                                        )}

                                        {canManage && (
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void toggleAttendees(
                                                            eventItem.id,
                                                        )
                                                    }
                                                    className="rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-2.5 py-1.5 text-[11px] font-semibold text-[#3f5242] hover:bg-[#eff2ed]"
                                                >
                                                    {activeAttendeesEventId ===
                                                        eventItem.id
                                                        ? 'Hide attendees'
                                                        : `Attendees (${goingCount + interestedCount})`}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        featuringId ===
                                                        eventItem.id
                                                    }
                                                    onClick={() =>
                                                        void toggleFeatureEvent(
                                                            eventItem,
                                                        )
                                                    }
                                                    className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#526054] hover:bg-[#f6f7f4]"
                                                >
                                                    {eventItem.is_featured
                                                        ? 'Unfeature'
                                                        : 'Feature'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(eventItem)
                                                    }
                                                    className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#526054] hover:bg-[#f6f7f4]"
                                                >
                                                    Edit
                                                </button>

                                                {eventItem.status !==
                                                    'published' ? (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            publishingId ===
                                                            eventItem.id
                                                        }
                                                        onClick={() =>
                                                            void publishEvent(
                                                                eventItem.id,
                                                            )
                                                        }
                                                        className="rounded-lg bg-[#2b5139] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                                                    >
                                                        {publishingId ===
                                                            eventItem.id
                                                            ? 'Publishing…'
                                                            : 'Publish'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            statusUpdatingId ===
                                                            eventItem.id
                                                        }
                                                        onClick={() =>
                                                            void updateEventStatus(
                                                                eventItem.id,
                                                                'draft',
                                                            )
                                                        }
                                                        className="rounded-lg border border-[#e5dfd3] bg-[#faf8f4] px-2.5 py-1.5 text-[11px] font-semibold text-[#7a6338] disabled:opacity-60"
                                                    >
                                                        Unpublish
                                                    </button>
                                                )}

                                                <ConfirmationDialog
                                                    title="Delete event?"
                                                    description={`This will permanently delete "${eventItem.title}" and its RSVP records.`}
                                                    confirmLabel="Delete event"
                                                    onConfirm={() =>
                                                        deleteEvent(
                                                            eventItem.id,
                                                        )
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        className="rounded-lg border border-[#ecd8d2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#8b4e43] hover:bg-[#fdf7f5]"
                                                    >
                                                        Delete
                                                    </button>
                                                </ConfirmationDialog>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Collapsible Attendee Roster for Managers */}
                                {canManage &&
                                    activeAttendeesEventId === eventItem.id && (
                                        <div className="mt-4 rounded-xl border border-[#dfe6dc] bg-[#f8faf7] p-4">
                                            <div className="mb-2.5 flex items-center justify-between border-b border-[#e5eae2] pb-2">
                                                <h3 className="text-xs font-bold text-[#2b5139] uppercase">
                                                    Event RSVP Roster ·{' '}
                                                    {goingCount} Going ·{' '}
                                                    {interestedCount} Interested
                                                </h3>
                                            </div>
                                            {attendeesLoading ? (
                                                <p className="text-xs text-[#6e776d]">
                                                    Loading attendee list…
                                                </p>
                                            ) : attendeesList.length > 0 ? (
                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {attendeesList.map(
                                                        (attendee) => (
                                                            <div
                                                                key={
                                                                    attendee.id
                                                                }
                                                                className="flex items-center justify-between rounded-lg border border-[#e5eae2] bg-white px-3 py-2 text-xs"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate font-semibold text-[#29382e]">
                                                                        {
                                                                            attendee.name
                                                                        }
                                                                    </p>
                                                                    <p className="truncate text-[11px] text-[#737c72]">
                                                                        {
                                                                            attendee.email
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <span
                                                                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${attendee.status ===
                                                                            'going'
                                                                            ? 'bg-[#edf2eb] text-[#2b5139]'
                                                                            : 'bg-[#e8eff4] text-[#2c5270]'
                                                                        }`}
                                                                >
                                                                    {
                                                                        attendee.status
                                                                    }
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[#7a8278]">
                                                    No RSVPs recorded for this
                                                    event yet.
                                                </p>
                                            )}
                                        </div>
                                    )}
                            </article>
                        );
                    })}
                </div>
            ) : (
                <EmptyState>
                    {canManage
                        ? 'No events match your current filter. Click "+ Create event" above to schedule one.'
                        : 'No upcoming events are scheduled for your cohort right now.'}
                </EmptyState>
            )}

            <AlumniProfileCompletionModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                profile={alumniProfile}
                onSuccess={() => meRes.reload()}
            />
        </div>
    );
}