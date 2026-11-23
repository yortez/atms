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
    const [credentialsOpen, setCredentialsOpen] = useState(false);
    const [credentialsForm, setCredentialsForm] = useState({
        username: '',
        mode: 'student_number' as 'student_number' | 'custom',
        password: '',
    });
    const [savingCredentials, setSavingCredentials] = useState(false);

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
            setCredentialsForm((current) => ({
                ...current,
                username: profile.username ?? '',
            }));
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

    async function handleUpdateCredentials(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSavingCredentials(true);
        try {
            const res = await apiRequest<{
                message?: string;
                data: AlumniProfile;
            }>(`/api/alumni/${profileId}/credentials`, {
                method: 'PATCH',
                body: {
                    username: credentialsForm.username.trim() || undefined,
                    reset_to_student_number:
                        credentialsForm.mode === 'student_number',
                    password:
                        credentialsForm.mode === 'custom' &&
                            credentialsForm.password.trim()
                            ? credentialsForm.password.trim()
                            : undefined,
                },
            });
            toast.success(
                res.message ?? 'Alumni login credentials updated.',
            );
            setCredentialsOpen(false);
            setCredentialsForm((current) => ({ ...current, password: '' }));
            reload();
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Could not update alumni login credentials.',
            );
        } finally {
            setSavingCredentials(false);
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
                                        {profile.is_complete ? (
                                            <span
                                                title="All required profile fields completed"
                                                className="rounded-full bg-[#e3eee0] px-2 py-0.5 text-[10px] font-medium text-[#2f5a37]"
                                            >
                                                Completed
                                            </span>
                                        ) : (
                                            <span
                                                title={
                                                    profile.missing_fields
                                                        ?.length
                                                        ? `Missing: ${profile.missing_fields.map((f) => f.replaceAll('_', ' ')).join(', ')}`
                                                        : 'Profile has missing required fields'
                                                }
                                                className="rounded-full bg-[#f3efe6] px-2 py-0.5 text-[10px] font-medium text-[#8a6a35]"
                                            >
                                                Incomplete profile
                                            </span>
                                        )}
                                        <span className="rounded-full bg-[#f0f1ed] px-2 py-0.5 text-[10px] font-medium text-[#6d746a] capitalize">
                                            {profile.profile_status}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {profile.can_update_credentials && (
                                <section className="rounded-2xl border border-[#dfe6dc] bg-[#f8faf7] p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[#2b5139] uppercase">
                                                Login Credentials & Account Recovery
                                            </h3>
                                            <p className="mt-0.5 text-[11px] text-[#6d766b]">
                                                Update username or reset password when an alumnus cannot sign in.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCredentialsOpen((prev) => {
                                                    const next = !prev;
                                                    if (next) {
                                                        setCredentialsForm({
                                                            username:
                                                                profile.username ??
                                                                '',
                                                            mode: 'student_number',
                                                            password: '',
                                                        });
                                                    }
                                                    return next;
                                                });
                                            }}
                                            className="inline-flex items-center gap-1 rounded-lg border border-[#cfe0cc] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2b5139] transition hover:bg-[#edf2eb] cursor-pointer"
                                        >
                                            <Lock className="size-3" />
                                            {credentialsOpen
                                                ? 'Close'
                                                : 'Update credentials'}
                                        </button>
                                    </div>

                                    <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                        {detail(
                                            'Username',
                                            profile.username ?? 'Not provisioned',
                                        )}
                                        {detail('Login Email', profile.email)}
                                        {detail(
                                            'Student Number',
                                            profile.education_records?.[0]
                                                ?.student_number,
                                        )}
                                    </dl>

                                    {credentialsOpen && (
                                        <form
                                            onSubmit={handleUpdateCredentials}
                                            className="mt-3.5 space-y-3 border-t border-[#e1e7de] pt-3.5"
                                        >
                                            <label className="block text-xs font-medium text-[#495a4f]">
                                                Username
                                                <input
                                                    required
                                                    maxLength={64}
                                                    pattern="[a-zA-Z0-9_.-]+"
                                                    value={
                                                        credentialsForm.username
                                                    }
                                                    onChange={(e) =>
                                                        setCredentialsForm({
                                                            ...credentialsForm,
                                                            username:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="e.g., santos_m"
                                                    className="mt-1 h-9 w-full rounded-lg border border-[#d6dfd2] bg-white px-3 font-mono text-xs lowercase"
                                                />
                                            </label>

                                            <fieldset className="space-y-2">
                                                <legend className="text-xs font-medium text-[#495a4f]">
                                                    Password recovery action
                                                </legend>
                                                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                                                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#36443a]">
                                                        <input
                                                            type="radio"
                                                            name={`recovery-mode-${profileId}`}
                                                            checked={
                                                                credentialsForm.mode ===
                                                                'student_number'
                                                            }
                                                            onChange={() =>
                                                                setCredentialsForm(
                                                                    {
                                                                        ...credentialsForm,
                                                                        mode: 'student_number',
                                                                        password:
                                                                            '',
                                                                    },
                                                                )
                                                            }
                                                            className="accent-[#2b5139]"
                                                        />
                                                        Reset password to
                                                        Student Number
                                                    </label>
                                                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#36443a]">
                                                        <input
                                                            type="radio"
                                                            name={`recovery-mode-${profileId}`}
                                                            checked={
                                                                credentialsForm.mode ===
                                                                'custom'
                                                            }
                                                            onChange={() =>
                                                                setCredentialsForm(
                                                                    {
                                                                        ...credentialsForm,
                                                                        mode: 'custom',
                                                                    },
                                                                )
                                                            }
                                                            className="accent-[#2b5139]"
                                                        />
                                                        Set a new temporary
                                                        password
                                                    </label>
                                                </div>
                                            </fieldset>

                                            {credentialsForm.mode ===
                                                'custom' && (
                                                    <label className="block text-xs font-medium text-[#495a4f]">
                                                        New temporary password
                                                        <input
                                                            type="password"
                                                            required
                                                            minLength={8}
                                                            maxLength={255}
                                                            value={
                                                                credentialsForm.password
                                                            }
                                                            onChange={(e) =>
                                                                setCredentialsForm({
                                                                    ...credentialsForm,
                                                                    password:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="Minimum 8 characters"
                                                            className="mt-1 h-9 w-full rounded-lg border border-[#d6dfd2] bg-white px-3 text-xs"
                                                        />
                                                    </label>
                                                )}

                                            <div className="flex items-center justify-end gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCredentialsOpen(
                                                            false,
                                                        )
                                                    }
                                                    className="h-8 rounded-lg border border-[#dce2d9] bg-white px-3 text-xs font-medium text-[#687267] hover:bg-[#f6f7f4]"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={savingCredentials}
                                                    className="h-8 rounded-lg bg-[#2b5139] px-3.5 text-xs font-semibold text-white transition hover:bg-[#22422d] disabled:opacity-60"
                                                >
                                                    {savingCredentials
                                                        ? 'Saving…'
                                                        : 'Save credentials'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </section>
                            )}

                            <section className="rounded-2xl border border-[#e9ebe5] p-4">
                                <h3 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-[#495a4f] uppercase">
                                    Personal information
                                </h3>
                                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {detail('First name', profile.first_name)}
                                    {detail('Middle name', profile.middle_name)}
                                    {detail('Last name', profile.last_name)}
                                    {detail('Suffix', profile.suffix)}
                                    {detail('Username', profile.username)}
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
    const [programFilter, setProgramFilter] = useState('');
    const [graduationYearFilter, setGraduationYearFilter] = useState('');
    const [employmentStatusFilter, setEmploymentStatusFilter] = useState('');
    const [profileCompletionFilter, setProfileCompletionFilter] = useState('');
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
    const programsRes =
        useApiResource<ApiEnvelope<AcademicProgram[]>>('/api/programs');
    const employmentStatusesRes = useApiResource<
        ApiEnvelope<EmploymentStatus[]>
    >('/api/employment-statuses');
    const programsList = programsRes.data?.data ?? [];
    const employmentStatusesList = employmentStatusesRes.data?.data ?? [];
    const currentYear = new Date().getFullYear();
    const graduationYears = Array.from(
        { length: 27 },
        (_, index) => currentYear - index,
    );

    const params = new URLSearchParams({ page: String(page) });

    if (query.trim()) {
        params.set('search', query.trim());
    }
    if (programFilter) {
        params.set('program_id', programFilter);
    }
    if (graduationYearFilter) {
        params.set('graduation_year', graduationYearFilter);
    }
    if (employmentStatusFilter) {
        params.set('employment_status', employmentStatusFilter);
    }
    if (profileCompletionFilter) {
        params.set('profile_completion', profileCompletionFilter);
    }

    const hasActiveFilters = Boolean(
        query.trim() ||
        programFilter ||
        graduationYearFilter ||
        employmentStatusFilter ||
        profileCompletionFilter,
    );

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
                    student_number: form.student_number || null,
                    graduation_year: form.batch_year
                        ? Number(form.batch_year)
                        : null,
                    honors: form.latin_honors || null,
                    gwa: form.gwa ? Number(form.gwa) : null,
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
            <div className="space-y-2.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-[#e7e9e3] bg-white px-3">
                        <span
                            aria-hidden="true"
                            className="text-sm text-[#899087]"
                        >
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
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        aria-label="Filter by program"
                        value={programFilter}
                        onChange={(event) => {
                            setProgramFilter(event.target.value);
                            setPage(1);
                        }}
                        className="h-9 rounded-xl border border-[#e7e9e3] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                    >
                        <option value="">All programs</option>
                        {programsList.map((prog) => (
                            <option key={prog.id} value={String(prog.id)}>
                                {prog.code} · {prog.name}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="Filter by class year"
                        value={graduationYearFilter}
                        onChange={(event) => {
                            setGraduationYearFilter(event.target.value);
                            setPage(1);
                        }}
                        className="h-9 rounded-xl border border-[#e7e9e3] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                    >
                        <option value="">All classes</option>
                        {graduationYears.map((yr) => (
                            <option key={yr} value={String(yr)}>
                                Class of {yr}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="Filter by employment status"
                        value={employmentStatusFilter}
                        onChange={(event) => {
                            setEmploymentStatusFilter(event.target.value);
                            setPage(1);
                        }}
                        className="h-9 rounded-xl border border-[#e7e9e3] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                    >
                        <option value="">All employment</option>
                        {employmentStatusesList.map((st) => (
                            <option key={st.id} value={String(st.id)}>
                                {st.label}
                            </option>
                        ))}
                        <option value="not_reported">Not reported</option>
                    </select>
                    <select
                        aria-label="Filter by profile status"
                        value={profileCompletionFilter}
                        onChange={(event) => {
                            setProfileCompletionFilter(event.target.value);
                            setPage(1);
                        }}
                        className="h-9 rounded-xl border border-[#e7e9e3] bg-white px-3 text-xs text-[#32413a] outline-none transition focus:border-[#819981]"
                    >
                        <option value="">All profiles</option>
                        <option value="completed">Completed</option>
                        <option value="incomplete">Incomplete profile</option>
                    </select>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => {
                                onQueryChange('');
                                setProgramFilter('');
                                setGraduationYearFilter('');
                                setEmploymentStatusFilter('');
                                setProfileCompletionFilter('');
                                setPage(1);
                            }}
                            className="h-9 rounded-xl border border-[#e2e7df] bg-[#f8faf7] px-3 text-xs font-medium text-[#5c685b] transition hover:bg-[#edf2ea]"
                        >
                            Reset filters
                        </button>
                    )}
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
                    <div className="relative overflow-x-auto">
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
                                    <th className="px-4 py-3">Profile status</th>
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
                                                                {alumnus.username
                                                                    ? ` · ${alumnus.username}`
                                                                    : ''}
                                                                {alumnus.contact_number
                                                                    ? ` · ${alumnus.contact_number}`
                                                                    : ''}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {education?.program_code ||
                                                        education?.program ? (
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            <span
                                                                title={
                                                                    education?.program ??
                                                                    undefined
                                                                }
                                                                className="rounded bg-[#edf2eb] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#2b5139] uppercase"
                                                            >
                                                                {education?.program_code ??
                                                                    education?.program}
                                                            </span>
                                                            {(alumnus
                                                                .education_records
                                                                ?.length ?? 0) >
                                                                1 && (
                                                                    <span
                                                                        title={alumnus.education_records
                                                                            ?.map(
                                                                                (
                                                                                    rec,
                                                                                ) =>
                                                                                    rec.program_code ??
                                                                                    rec.program ??
                                                                                    rec.degree,
                                                                            )
                                                                            .filter(
                                                                                Boolean,
                                                                            )
                                                                            .join(
                                                                                ', ',
                                                                            )}
                                                                        className="rounded-full bg-[#f0f3ee] px-1.5 py-0.5 text-[10px] font-semibold text-[#4d5a4f]"
                                                                    >
                                                                        +
                                                                        {(alumnus
                                                                            .education_records
                                                                            ?.length ??
                                                                            1) - 1}
                                                                    </span>
                                                                )}
                                                        </div>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div>
                                                        <span>
                                                            {education?.graduation_year ??
                                                                '—'}
                                                        </span>
                                                        {education?.honors && (
                                                            <span className="mt-1 block w-fit rounded-full bg-[#fdf6e9] px-2 py-0.5 text-[10px] font-medium text-[#8a6116] capitalize">
                                                                {education.honors.replaceAll(
                                                                    '-',
                                                                    ' ',
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            {status ? (
                                                                <span
                                                                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass[status] ?? 'bg-[#f0f1ed] text-[#6d746a]'}`}
                                                                >
                                                                    {status}
                                                                </span>
                                                            ) : (
                                                                <span>
                                                                    Not reported
                                                                </span>
                                                            )}
                                                            {employment?.is_related_to_degree && (
                                                                <span className="rounded-full bg-[#edf2eb] px-2 py-0.5 text-[10px] font-semibold text-[#2b5139]">
                                                                    Degree-aligned
                                                                </span>
                                                            )}
                                                        </div>
                                                        {employment?.reported_at && (
                                                            <span
                                                                title={`Reported on ${new Date(employment.reported_at).toLocaleDateString()}`}
                                                                className="block text-[10px] text-[#92978f]"
                                                            >
                                                                Updated{' '}
                                                                {new Date(
                                                                    employment.reported_at,
                                                                ).toLocaleDateString(
                                                                    undefined,
                                                                    {
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                    },
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {employment?.job_title ||
                                                        employment?.employer_name ||
                                                        employment?.work_location ? (
                                                        <div>
                                                            <p className="font-medium text-[#39463b]">
                                                                {employment?.job_title ||
                                                                    employment?.employer_name}
                                                            </p>
                                                            {(employment?.job_title &&
                                                                employment?.employer_name) ||
                                                                employment?.work_location ? (
                                                                <p className="mt-0.5 text-[10px] text-[#848a81]">
                                                                    {[
                                                                        employment?.job_title
                                                                            ? employment?.employer_name
                                                                            : null,
                                                                        employment?.work_location,
                                                                    ]
                                                                        .filter(
                                                                            Boolean,
                                                                        )
                                                                        .join(
                                                                            ' · ',
                                                                        )}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {alumnus.is_complete ? (
                                                        <span
                                                            title="All required profile fields completed"
                                                            className="inline-flex items-center whitespace-nowrap rounded-full bg-[#e3eee0] px-2.5 py-1 text-[10px] font-medium text-[#2f5a37]"
                                                        >
                                                            Completed
                                                        </span>
                                                    ) : (
                                                        <span
                                                            title={
                                                                alumnus
                                                                    .missing_fields
                                                                    ?.length
                                                                    ? `Missing: ${alumnus.missing_fields.map((f) => f.replaceAll('_', ' ')).join(', ')}`
                                                                    : 'Profile has missing required fields'
                                                            }
                                                            className="inline-flex items-center whitespace-nowrap rounded-full bg-[#f3efe6] px-2.5 py-1 text-[10px] font-medium text-[#8a6a35]"
                                                        >
                                                            Incomplete profile
                                                            {alumnus
                                                                .missing_fields
                                                                ?.length
                                                                ? ` (${alumnus.missing_fields.length} missing)`
                                                                : ''}
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
