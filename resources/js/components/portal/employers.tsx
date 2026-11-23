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
