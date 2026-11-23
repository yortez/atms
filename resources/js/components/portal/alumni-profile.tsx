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
