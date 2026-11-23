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
