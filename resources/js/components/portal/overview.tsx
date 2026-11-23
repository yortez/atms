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

import {
    EmptyState,
    ErrorState,
    LoadingState,
    formatBytes,
    formatSalary,
    initials,
    isEmployedOutcome,
    statusClass,
    type RawPagination,
    type WorkspaceRole,
} from './shared';

type OverviewProps = {
    role: WorkspaceRole;
    onNavigate: (page: string) => void;
};

export function DemoQuickLoginToggleCard() {
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
