import { useEffect, useState, type FormEvent } from 'react';
import { AlumniProfileCompletionModal } from './alumni-profile';
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
