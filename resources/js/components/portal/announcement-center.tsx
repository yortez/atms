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
