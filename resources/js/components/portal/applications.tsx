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
