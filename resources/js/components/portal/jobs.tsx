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
