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
    const [resolutionAction, setResolutionAction] = useState<'sync_record' | 'create_record' | 'provision_account' | 'manual_review'>('provision_account');
    const [overrideProgramId, setOverrideProgramId] = useState<string>('');
    const [overrideGradYear, setOverrideGradYear] = useState<string>('');
    const [studentNumberInput, setStudentNumberInput] = useState<string>('');
    const [credentialDeliveryMethod, setCredentialDeliveryMethod] = useState<'status' | 'email' | 'both'>('both');
    const [provisionPassword, setProvisionPassword] = useState<string>('');
    const [reviewNote, setReviewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function openReviewModal(
        request: RegistrationAssistanceRequest,
        defaultStatus: 'reviewed' | 'needs_more_information' | 'rejected',
    ) {
        setSelectedRequest(request);
        setReviewStatus(defaultStatus);
        const recommended = request.registrar_match?.recommended_action ?? 'provision_account';
        setResolutionAction(recommended);
        setOverrideProgramId(
            request.academic_program_id
                ? String(request.academic_program_id)
                : request.registrar_match?.profile?.program_id
                    ? String(request.registrar_match.profile.program_id)
                    : '',
        );
        setOverrideGradYear(
            request.graduation_year
                ? String(request.graduation_year)
                : request.registrar_match?.profile?.graduation_year
                    ? String(request.registrar_match.profile.graduation_year)
                    : '',
        );
        const existingSn = request.student_number || request.registrar_match?.profile?.student_number || '';
        setStudentNumberInput(existingSn);
        setCredentialDeliveryMethod(request.credential_delivery_method ?? 'both');
        setProvisionPassword('');
        if (defaultStatus === 'reviewed') {
            setReviewNote(
                request.review_note ||
                (recommended === 'create_record'
                    ? 'Created official alumni profile from verified assistance request and released login credentials.'
                    : recommended === 'sync_record'
                        ? 'Synchronized official registrar record with verified details and released login credentials.'
                        : 'Verified with official registrar records. Login credentials have been released.'),
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
                    student_number: studentNumberInput.trim() || undefined,
                    credential_delivery_method: reviewStatus === 'reviewed' ? credentialDeliveryMethod : undefined,
                    temporary_password:
                        reviewStatus === 'reviewed' && resolutionAction === 'provision_account' && provisionPassword.trim()
                            ? provisionPassword.trim()
                            : undefined,
                    review_note: reviewNote || null,
                },
            });
            toast.success('Record assistance request updated.');
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
            (item.student_number ?? '').toLowerCase().includes(q) ||
            (item.last_name ?? '').toLowerCase().includes(q) ||
            (item.first_name ?? '').toLowerCase().includes(q) ||
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
                                            {(request.student_number || officialProfile?.student_number) && (
                                                <span className="rounded bg-[#edf2eb] px-2 py-0.5 text-[10px] font-semibold text-[#305338]">
                                                    {request.student_number || officialProfile?.student_number}
                                                </span>
                                            )}
                                            {request.released_username && (
                                                <span className="rounded bg-[#e6f4ea] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#1f5130]">
                                                    @{request.released_username}
                                                </span>
                                            )}
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
                                                                Submitted Assistance Details
                                                            </p>
                                                            <p className="mt-0.5 text-[#29382e]">
                                                                Name: <span className="font-medium">{request.last_name ? `${request.last_name}, ${request.first_name ?? ''} ${request.middle_name ?? ''}`.trim() : request.name}</span>
                                                            </p>
                                                            <p className="text-[#29382e]">
                                                                Birthdate: <span className="font-medium">{String(request.date_of_birth ?? '').slice(0, 10)}</span>
                                                            </p>
                                                            <p className="text-[#29382e]">
                                                                Program/Batch: <span className="font-medium">{request.program?.code ?? 'Unassigned'}{request.graduation_year ? ` (${request.graduation_year})` : ''}</span>
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
                                                                Student No. / Username:{' '}
                                                                <span className="font-mono font-semibold text-[#1f5130]">
                                                                    {officialProfile.student_number ?? '—'}
                                                                    {officialProfile.username ? ` · ${officialProfile.username}` : ''}
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
                                                    {request.credential_delivery_method ? ` · Delivery: ${request.credential_delivery_method}` : ''}
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
                                    {selectedRequest.name}
                                    {selectedRequest.student_number || selectedRequest.registrar_match?.profile?.student_number
                                        ? ` (${selectedRequest.student_number || selectedRequest.registrar_match?.profile?.student_number})`
                                        : ` · ${selectedRequest.email}`}
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
                                            <option value="provision_account">
                                                Verify / Sync Record & Release Login Credentials
                                            </option>
                                            <option value="sync_record">
                                                Sync Official Record with Submitted Details
                                            </option>
                                            <option value="create_record">
                                                Create Official Alumni Record (If missing from registrar list)
                                            </option>
                                            <option value="manual_review">
                                                Mark Reviewed Only (Do not modify alumni profile)
                                            </option>
                                        </select>
                                    </label>

                                    {resolutionAction !== 'manual_review' && (
                                        <>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <label className="block text-xs font-medium text-[#4d5a4f]">
                                                    Student Number
                                                    <input
                                                        type="text"
                                                        required={resolutionAction === 'create_record' && !studentNumberInput.trim()}
                                                        value={studentNumberInput}
                                                        onChange={(e) => setStudentNumberInput(e.target.value)}
                                                        placeholder="e.g. 2020-00123"
                                                        className="mt-1 h-9 w-full rounded-lg border border-[#d6dfd2] bg-white px-2.5 font-mono text-xs uppercase"
                                                    />
                                                </label>
                                                <label className="block text-xs font-medium text-[#4d5a4f]">
                                                    Where to send credentials
                                                    <select
                                                        value={credentialDeliveryMethod}
                                                        onChange={(e) => setCredentialDeliveryMethod(e.target.value as 'status' | 'email' | 'both')}
                                                        className="mt-1 h-9 w-full rounded-lg border border-[#d6dfd2] bg-white px-2.5 text-xs"
                                                    >
                                                        <option value="both">Both (Email &amp; Check Request Status)</option>
                                                        <option value="email">Send via Email only</option>
                                                        <option value="status">Show in Check Request Status only</option>
                                                    </select>
                                                </label>
                                            </div>
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
                                            <div className="rounded-lg border border-[#d6dfd2] bg-white px-3 py-2 text-[11px] text-[#3b473d]">
                                                <span className="font-semibold text-[#29382e]">Credentials Preview:</span>{' '}
                                                Username{' '}
                                                <code className="font-mono font-bold text-[#1f5130]">
                                                    {selectedRequest.registrar_match?.profile?.username ?? 'auto-generated'}
                                                </code>{' '}
                                                · Password{' '}
                                                <code className="font-mono font-bold text-[#1f5130]">
                                                    {provisionPassword.trim() || studentNumberInput.trim().toUpperCase() || 'Student Number'}
                                                </code>
                                            </div>
                                        </>
                                    )}

                                    {resolutionAction === 'provision_account' && (
                                        <label className="block text-xs font-medium text-[#4d5a4f]">
                                            Custom Password Override (optional — defaults to Student Number)
                                            <input
                                                type="text"
                                                value={provisionPassword}
                                                onChange={(e) => setProvisionPassword(e.target.value)}
                                                placeholder="Leave blank to use Student Number"
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
