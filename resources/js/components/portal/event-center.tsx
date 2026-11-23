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

const EVENT_TYPE_OPTIONS = [
    {
        value: 'homecoming',
        label: 'Homecoming',
        badgeClass: 'bg-[#edf2eb] text-[#2b5139]',
    },
    {
        value: 'career_fair',
        label: 'Career Fair',
        badgeClass: 'bg-[#e8eff4] text-[#2c5270]',
    },
    {
        value: 'networking',
        label: 'Networking',
        badgeClass: 'bg-[#f4efe6] text-[#7a5828]',
    },
    {
        value: 'webinar',
        label: 'Webinar / Talk',
        badgeClass: 'bg-[#efeaf4] text-[#583b78]',
    },
    {
        value: 'workshop',
        label: 'Workshop',
        badgeClass: 'bg-[#f2f4f0] text-[#556256]',
    },
    {
        value: 'reunion',
        label: 'Batch Reunion',
        badgeClass: 'bg-[#faeae8] text-[#9e382b]',
    },
] as const;

const EVENT_FORMAT_OPTIONS = [
    { value: 'in_person', label: 'In-person' },
    { value: 'online', label: 'Online' },
    { value: 'hybrid', label: 'Hybrid' },
] as const;

export function EventCenter({
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
    const meRes = useApiResource<ApiEnvelope<AlumniProfile>>(
        role === 'Alumni' ? '/api/me/alumni' : null,
    );
    const alumniProfile = meRes.data?.data;
    const isProfileComplete = Boolean(alumniProfile?.is_complete);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const { data, loading, error, reload } = useApiResource<
        ApiEnvelope<RawPagination<AlumniEvent>>
    >(canManage ? '/api/events/manage' : '/api/events');
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
        description: '',
        event_type: 'homecoming',
        format: 'in_person',
        venue: '',
        meeting_url: '',
        starts_at: '',
        ends_at: '',
        registration_deadline: '',
        capacity: '',
        is_featured: false,
        is_public: true,
        publish_now: false,
        notify_audience: true,
        audience_roles: [] as string[],
        target_department_ids: [] as number[],
        target_program_ids: [] as number[],
        graduation_years_text: '',
    });

    const [saving, setSaving] = useState(false);
    const [publishingId, setPublishingId] = useState<number | null>(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(
        null,
    );
    const [featuringId, setFeaturingId] = useState<number | null>(null);
    const [rsvpUpdatingId, setRsvpUpdatingId] = useState<number | null>(null);

    // Attendee Roster State
    const [activeAttendeesEventId, setActiveAttendeesEventId] = useState<
        number | null
    >(null);
    const [attendeesLoading, setAttendeesLoading] = useState(false);
    const [attendeesMap, setAttendeesMap] = useState<
        Record<number, AlumniEventAttendee[]>
    >({});

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [viewFilter, setViewFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const isFormVisible = canManage && (createOpen || composerOpen);

    function resetForm() {
        setEditingId(null);
        setComposerOpen(false);
        setShowCohortTargeting(false);
        setForm({
            title: '',
            description: '',
            event_type: 'homecoming',
            format: 'in_person',
            venue: '',
            meeting_url: '',
            starts_at: '',
            ends_at: '',
            registration_deadline: '',
            capacity: '',
            is_featured: false,
            is_public: true,
            publish_now: false,
            notify_audience: true,
            audience_roles: [],
            target_department_ids: [],
            target_program_ids: [],
            graduation_years_text: '',
        });
        onCloseCreate();
    }

    function toDatetimeLocalValue(iso: string | null): string {
        if (!iso) return '';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function openEdit(eventItem: AlumniEvent) {
        setEditingId(eventItem.id);
        const hasCohort = Boolean(
            eventItem.target_department_ids?.length ||
            eventItem.target_program_ids?.length ||
            eventItem.target_graduation_years?.length,
        );
        setShowCohortTargeting(hasCohort);
        setForm({
            title: eventItem.title,
            description: eventItem.description,
            event_type: eventItem.event_type ?? 'homecoming',
            format: eventItem.format ?? 'in_person',
            venue: eventItem.venue ?? '',
            meeting_url: eventItem.meeting_url ?? '',
            starts_at: toDatetimeLocalValue(eventItem.starts_at),
            ends_at: toDatetimeLocalValue(eventItem.ends_at),
            registration_deadline: toDatetimeLocalValue(
                eventItem.registration_deadline,
            ),
            capacity:
                eventItem.capacity !== null && eventItem.capacity !== undefined
                    ? String(eventItem.capacity)
                    : '',
            is_featured: Boolean(eventItem.is_featured),
            is_public: eventItem.is_public ?? true,
            publish_now: false,
            notify_audience: false,
            audience_roles: eventItem.audience_roles ?? [],
            target_department_ids: eventItem.target_department_ids ?? [],
            target_program_ids: eventItem.target_program_ids ?? [],
            graduation_years_text: (
                eventItem.target_graduation_years ?? []
            ).join(', '),
        });
        setComposerOpen(true);
    }

    async function saveEvent(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);

        const parsedYears = form.graduation_years_text
            .split(',')
            .map((s) => Number.parseInt(s.trim(), 10))
            .filter((n) => !Number.isNaN(n) && n >= 1950 && n <= 2100);

        const payload = {
            title: form.title,
            description: form.description,
            event_type: form.event_type,
            format: form.format,
            venue: form.venue.trim() || null,
            meeting_url: form.meeting_url.trim() || null,
            starts_at: form.starts_at,
            ends_at: form.ends_at || null,
            registration_deadline: form.registration_deadline || null,
            capacity: form.capacity ? Number(form.capacity) : null,
            is_featured: form.is_featured,
            is_public: form.is_public,
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
                await apiRequest<ApiEnvelope<AlumniEvent>>(
                    `/api/events/${editingId}`,
                    {
                        method: 'PATCH',
                        body: payload,
                    },
                );
                toast.success('Event updated.');
            } else {
                await apiRequest<ApiEnvelope<AlumniEvent>>('/api/events', {
                    method: 'POST',
                    body: payload,
                });
                toast.success(
                    form.publish_now
                        ? 'Event created and published.'
                        : 'Event saved as a draft.',
                );
            }
            resetForm();
            reload();
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Event could not be saved.',
            );
        } finally {
            setSaving(false);
        }
    }

    async function publishEvent(id: number) {
        setPublishingId(id);
        try {
            await apiRequest<ApiEnvelope<AlumniEvent>>(
                `/api/events/${id}/publish`,
                { method: 'POST' },
            );
            reload();
            toast.success('Event published.');
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Event could not be published.',
            );
        } finally {
            setPublishingId(null);
        }
    }

    async function updateEventStatus(
        id: number,
        nextStatus: 'draft' | 'cancelled' | 'completed',
    ) {
        setStatusUpdatingId(id);
        try {
            await apiRequest<ApiEnvelope<AlumniEvent>>(
                `/api/events/${id}/status`,
                {
                    method: 'POST',
                    body: { status: nextStatus },
                },
            );
            reload();
            toast.success(`Event marked as ${nextStatus}.`);
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Event status could not be updated.',
            );
        } finally {
            setStatusUpdatingId(null);
        }
    }

    async function toggleFeatureEvent(eventItem: AlumniEvent) {
        setFeaturingId(eventItem.id);
        try {
            await apiRequest<ApiEnvelope<AlumniEvent>>(
                `/api/events/${eventItem.id}`,
                {
                    method: 'PATCH',
                    body: { is_featured: !eventItem.is_featured },
                },
            );
            reload();
            toast.success(
                eventItem.is_featured
                    ? 'Removed from featured events.'
                    : 'Marked as featured event.',
            );
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Feature status could not be updated.',
            );
        } finally {
            setFeaturingId(null);
        }
    }

    async function handleRsvp(
        eventId: number,
        status: 'going' | 'interested' | 'cancelled',
    ) {
        if (role === 'Alumni' && !isProfileComplete) {
            toast.error(
                'Please complete your profile (gender, civil status, contact number, current address, and permanent address) before participating in events.',
            );
            setProfileModalOpen(true);
            return;
        }
        setRsvpUpdatingId(eventId);
        try {
            await apiRequest<ApiEnvelope<AlumniEvent>>(
                `/api/events/${eventId}/rsvp`,
                {
                    method: 'POST',
                    body: { status },
                },
            );
            reload();
            toast.success(
                status === 'going'
                    ? 'You are registered as Going!'
                    : status === 'interested'
                        ? 'Marked as Interested.'
                        : 'Your RSVP has been cancelled.',
            );
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'RSVP could not be updated.',
            );
        } finally {
            setRsvpUpdatingId(null);
        }
    }

    async function toggleAttendees(eventId: number) {
        if (activeAttendeesEventId === eventId) {
            setActiveAttendeesEventId(null);
            return;
        }
        setActiveAttendeesEventId(eventId);
        setAttendeesLoading(true);
        try {
            const res = await apiRequest<ApiEnvelope<AlumniEventAttendee[]>>(
                `/api/events/${eventId}/attendees`,
            );
            setAttendeesMap((prev) => ({
                ...prev,
                [eventId]: res.data ?? [],
            }));
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Attendee list could not be loaded.',
            );
        } finally {
            setAttendeesLoading(false);
        }
    }

    async function deleteEvent(id: number): Promise<boolean> {
        try {
            await apiRequest(`/api/events/${id}`, {
                method: 'DELETE',
            });
            reload();
            toast.success('Event deleted.');
            return true;
        } catch (err) {
            toast.error(
                err instanceof ApiError
                    ? err.message
                    : 'Event could not be deleted.',
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

    const events = data?.data.data ?? [];
    const departmentsList = departmentsRes.data?.data ?? [];
    const programsList = programsRes.data?.data ?? [];

    const nowMs = Date.now();
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredEvents = events.filter((item) => {
        const startsMs = new Date(item.starts_at).getTime();
        const isUpcoming = startsMs >= nowMs - 86400000;

        if (viewFilter === 'upcoming' && !isUpcoming) return false;
        if (viewFilter === 'past' && isUpcoming) return false;
        if (viewFilter === 'featured' && !item.is_featured) return false;
        if (
            viewFilter === 'my_rsvp' &&
            item.my_registration_status !== 'going' &&
            item.my_registration_status !== 'interested'
        ) {
            return false;
        }
        if (viewFilter === 'draft' && item.status !== 'draft') return false;

        if (typeFilter !== 'all' && item.event_type !== typeFilter) {
            return false;
        }

        if (!normalizedQuery) return true;
        return (
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.description.toLowerCase().includes(normalizedQuery) ||
            (item.venue?.toLowerCase().includes(normalizedQuery) ?? false)
        );
    });

    const upcomingCount = events.filter(
        (e) =>
            e.status === 'published' &&
            new Date(e.starts_at).getTime() >= nowMs - 86400000,
    ).length;
    const featuredCount = events.filter((e) => e.is_featured).length;
    const myRsvpCount = events.filter(
        (e) =>
            e.my_registration_status === 'going' ||
            e.my_registration_status === 'interested',
    ).length;
    const draftCount = events.filter((e) => e.status === 'draft').length;

    return (
        <div className="space-y-4">
            {/* Summary, Search & Filter Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#edf2eb] px-3 py-1 text-xs font-semibold text-[#2b5139]">
                            📅 {upcomingCount} Upcoming
                        </span>
                        {featuredCount > 0 && (
                            <span className="rounded-full bg-[#f4efe6] px-3 py-1 text-xs font-semibold text-[#7a5828]">
                                🌟 {featuredCount} Featured
                            </span>
                        )}
                        <span className="rounded-full bg-[#e8eff4] px-3 py-1 text-xs font-semibold text-[#2c5270]">
                            {myRsvpCount} My RSVPs
                        </span>
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
                        placeholder="Search events by title, venue, or topic…"
                        className="h-9 w-full rounded-xl border border-[#dfe5dd] bg-[#fafbf9] px-3 text-xs text-[#29382e] outline-none focus:border-[#6d8b72] lg:max-w-xs"
                    />

                    <div className="flex flex-wrap items-center gap-1.5">
                        {(
                            [
                                ['all', 'All'],
                                ['upcoming', 'Upcoming'],
                                ['featured', '🌟 Featured'],
                                ['my_rsvp', 'My RSVPs'],
                                ...(canManage
                                    ? ([
                                        ['draft', 'Drafts'],
                                        ['past', 'Past'],
                                    ] as const)
                                    : ([['past', 'Past']] as const)),
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setViewFilter(key)}
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${viewFilter === key
                                    ? 'bg-[#2b5139] text-white'
                                    : 'border border-[#e2e7df] bg-[#fafbf9] text-[#5e6a5f] hover:bg-[#eff2ed]'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}

                        <select
                            aria-label="Filter by event type"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-7 rounded-full border border-[#dce2d9] bg-white px-2.5 text-[11px] font-medium text-[#4d5a4f] outline-none"
                        >
                            <option value="all">All Event Types</option>
                            {EVENT_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Create / Edit Event Composer */}
            {isFormVisible ? (
                <form
                    onSubmit={saveEvent}
                    className="space-y-4 rounded-2xl border border-[#cfe0cc] bg-white p-4 shadow-2xs sm:p-5"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eff0ec] pb-3">
                        <div>
                            <h3 className="text-sm font-semibold text-[#29382e]">
                                {editingId !== null
                                    ? 'Edit Event'
                                    : 'Create Alumni Event'}
                            </h3>
                            <p className="text-xs text-[#737c72]">
                                Schedule homecomings, career fairs, webinars, or
                                cohort reunions with built-in RSVP tracking.
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

                    <div className="grid gap-3 sm:grid-cols-4">
                        <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                            Event title
                            <input
                                required
                                maxLength={180}
                                value={form.title}
                                onChange={(e) =>
                                    setForm({ ...form, title: e.target.value })
                                }
                                placeholder="e.g., Grand Alumni Homecoming 2026"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Event type
                            <select
                                value={form.event_type}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        event_type: e.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                            >
                                {EVENT_TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Format
                            <select
                                value={form.format}
                                onChange={(e) =>
                                    setForm({ ...form, format: e.target.value })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                            >
                                {EVENT_FORMAT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Starts at
                            <input
                                required
                                type="datetime-local"
                                value={form.starts_at}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        starts_at: e.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Ends at (optional)
                            <input
                                type="datetime-local"
                                value={form.ends_at}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        ends_at: e.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            RSVP deadline (optional)
                            <input
                                type="datetime-local"
                                value={form.registration_deadline}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        registration_deadline: e.target.value,
                                    })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Max capacity (optional)
                            <input
                                type="number"
                                min={1}
                                value={form.capacity}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        capacity: e.target.value,
                                    })
                                }
                                placeholder="Unlimited"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Venue / Campus location
                            <input
                                maxLength={200}
                                value={form.venue}
                                onChange={(e) =>
                                    setForm({ ...form, venue: e.target.value })
                                }
                                placeholder="e.g., Northfield Grand Hall, Building A"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>

                        <label className="text-xs font-medium text-[#4d5a4f]">
                            Online meeting or registration link (optional)
                            <input
                                maxLength={500}
                                value={form.meeting_url}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        meeting_url: e.target.value,
                                    })
                                }
                                placeholder="https://meet.google.com/… or Zoom link"
                                className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                            />
                        </label>
                    </div>

                    <label className="block text-xs font-medium text-[#4d5a4f]">
                        Event description & agenda
                        <textarea
                            required
                            value={form.description}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Share the event agenda, speakers, dress code, or special instructions…"
                            className="mt-1.5 min-h-24 w-full rounded-lg border border-[#e3e7df] p-3 text-xs"
                        />
                    </label>

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
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            audience_roles: e.target.checked
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

                    {/* Cohort Targeting Panel */}
                    {showCohortTargeting && (
                        <div className="space-y-3 rounded-xl border border-[#dce4d9] bg-[#f8faf7] p-4">
                            <div>
                                <h4 className="text-xs font-semibold text-[#2b5139]">
                                    Cohort Targeting (Optional)
                                </h4>
                                <p className="text-[11px] text-[#6d776c]">
                                    Restrict event visibility to specific
                                    academic colleges, degree programs, or
                                    graduating batches.
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
                                    placeholder="e.g., 2016, 2021, 2026"
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
                                    checked={form.is_featured}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            is_featured: e.target.checked,
                                        })
                                    }
                                    className="size-3.5 accent-[#2b5139]"
                                />
                                🌟 Feature event
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
                                            : 'Create event'}
                            </button>
                        </div>
                    </div>
                </form>
            ) : null}

            {/* Events Feed */}
            {filteredEvents.length ? (
                <div className="space-y-3">
                    {filteredEvents.map((eventItem) => {
                        const startDate = new Date(eventItem.starts_at);
                        const monthShort = startDate
                            .toLocaleString('en-US', { month: 'short' })
                            .toUpperCase();
                        const dayNum = String(startDate.getDate()).padStart(
                            2,
                            '0',
                        );
                        const typeMeta =
                            EVENT_TYPE_OPTIONS.find(
                                (t) => t.value === eventItem.event_type,
                            ) ?? EVENT_TYPE_OPTIONS[0];
                        const formatLabel =
                            EVENT_FORMAT_OPTIONS.find(
                                (f) => f.value === eventItem.format,
                            )?.label ?? 'In-person';
                        const hasCohort = Boolean(
                            eventItem.target_department_ids?.length ||
                            eventItem.target_program_ids?.length ||
                            eventItem.target_graduation_years?.length,
                        );
                        const goingCount = eventItem.going_count ?? 0;
                        const interestedCount = eventItem.interested_count ?? 0;
                        const myRsvp = eventItem.my_registration_status;
                        const attendeesList = attendeesMap[eventItem.id] ?? [];

                        return (
                            <article
                                key={eventItem.id}
                                className={`rounded-2xl border p-4 sm:p-5 ${eventItem.is_featured
                                    ? 'border-[#cfe0cc] bg-[#fbfcfa]'
                                    : 'border-[#e9ebe5] bg-white'
                                    }`}
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                    {/* Calendar Badge */}
                                    <div
                                        className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border text-center ${eventItem.is_featured
                                            ? 'border-[#2b5139] bg-[#2b5139] text-white'
                                            : 'border-[#dfe5dc] bg-[#f4f7f3] text-[#2b5139]'
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold tracking-wider uppercase">
                                            {monthShort}
                                        </span>
                                        <span className="text-lg leading-none font-bold">
                                            {dayNum}
                                        </span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {eventItem.is_featured && (
                                                <span className="rounded-full bg-[#2b5139] px-2.5 py-0.5 text-[10px] font-bold text-white">
                                                    🌟 Featured
                                                </span>
                                            )}
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${typeMeta.badgeClass}`}
                                            >
                                                {typeMeta.label}
                                            </span>
                                            <span className="rounded-full bg-[#f2f4f0] px-2.5 py-0.5 text-[10px] font-medium text-[#526053]">
                                                {formatLabel}
                                            </span>
                                            <span className="rounded-full bg-[#f2f3ef] px-2.5 py-0.5 text-[10px] font-medium text-[#697367] capitalize">
                                                {eventItem.status}
                                            </span>
                                            {myRsvp && (
                                                <span className="rounded-full bg-[#e3efe4] px-2.5 py-0.5 text-[10px] font-bold text-[#245232]">
                                                    ✓ RSVP:{' '}
                                                    {myRsvp === 'going'
                                                        ? 'Going'
                                                        : 'Interested'}
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="mt-2 text-base font-semibold text-[#29382e]">
                                            {eventItem.title}
                                        </h2>

                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5d685e]">
                                            <span className="inline-flex items-center gap-1">
                                                <Calendar className="size-3.5 text-[#516e55]" />
                                                {startDate.toLocaleDateString(
                                                    undefined,
                                                    {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    },
                                                )}{' '}
                                                ·{' '}
                                                {startDate.toLocaleTimeString(
                                                    [],
                                                    {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                    },
                                                )}
                                            </span>
                                            {eventItem.venue && (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="size-3.5 text-[#516e55]" />
                                                    {eventItem.venue}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 font-medium text-[#2b5139]">
                                                <UsersRound className="size-3.5" />
                                                {goingCount} going
                                                {eventItem.capacity
                                                    ? ` / ${eventItem.capacity} seats`
                                                    : ''}
                                                {interestedCount > 0
                                                    ? ` · ${interestedCount} interested`
                                                    : ''}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-xs leading-5 whitespace-pre-line text-[#6f786e]">
                                            {eventItem.description}
                                        </p>

                                        {eventItem.meeting_url && (
                                            <div className="mt-3">
                                                <a
                                                    href={eventItem.meeting_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#edf2eb] px-3 py-1.5 text-xs font-semibold text-[#2b5139] transition hover:bg-[#dfe8dc]"
                                                >
                                                    Join / Event Link{' '}
                                                    <ArrowRight className="size-3" />
                                                </a>
                                            </div>
                                        )}

                                        {/* Footer Metadata */}
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#858b82]">
                                            {eventItem.registration_deadline && (
                                                <span>
                                                    RSVP by{' '}
                                                    {new Date(
                                                        eventItem.registration_deadline,
                                                    ).toLocaleDateString()}
                                                </span>
                                            )}
                                            {eventItem.author?.name && (
                                                <span>
                                                    · Organized by{' '}
                                                    {eventItem.author.name}
                                                </span>
                                            )}
                                            {hasCohort && (
                                                <span className="rounded bg-[#edf2eb] px-2 py-0.5 font-medium text-[#2b5139]">
                                                    🎯{' '}
                                                    {[
                                                        eventItem
                                                            .target_department_ids
                                                            ?.length
                                                            ? `${eventItem.target_department_ids.length} dept(s)`
                                                            : null,
                                                        eventItem
                                                            .target_program_ids
                                                            ?.length
                                                            ? `${eventItem.target_program_ids.length} program(s)`
                                                            : null,
                                                        eventItem
                                                            .target_graduation_years
                                                            ?.length
                                                            ? `Batch ${eventItem.target_graduation_years.join(', ')}`
                                                            : null,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right-Side RSVP & Manager Controls */}
                                    <div className="flex flex-col items-start gap-2 sm:shrink-0 sm:items-end">
                                        {eventItem.status === 'published' && (
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        rsvpUpdatingId ===
                                                        eventItem.id
                                                    }
                                                    onClick={() =>
                                                        void handleRsvp(
                                                            eventItem.id,
                                                            myRsvp === 'going'
                                                                ? 'cancelled'
                                                                : 'going',
                                                        )
                                                    }
                                                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${myRsvp === 'going'
                                                        ? 'bg-[#2b5139] text-white'
                                                        : 'border border-[#cfe0cc] bg-[#edf2eb] text-[#2b5139] hover:bg-[#dfe8dc]'
                                                        }`}
                                                >
                                                    {myRsvp === 'going'
                                                        ? '✓ Going'
                                                        : 'RSVP Going'}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        rsvpUpdatingId ===
                                                        eventItem.id
                                                    }
                                                    onClick={() =>
                                                        void handleRsvp(
                                                            eventItem.id,
                                                            myRsvp ===
                                                                'interested'
                                                                ? 'cancelled'
                                                                : 'interested',
                                                        )
                                                    }
                                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${myRsvp === 'interested'
                                                        ? 'bg-[#2c5270] text-white'
                                                        : 'border border-[#e3e7df] bg-white text-[#526054] hover:bg-[#f6f7f4]'
                                                        }`}
                                                >
                                                    {myRsvp === 'interested'
                                                        ? '★ Interested'
                                                        : 'Interested'}
                                                </button>
                                            </div>
                                        )}

                                        {canManage && (
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void toggleAttendees(
                                                            eventItem.id,
                                                        )
                                                    }
                                                    className="rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-2.5 py-1.5 text-[11px] font-semibold text-[#3f5242] hover:bg-[#eff2ed]"
                                                >
                                                    {activeAttendeesEventId ===
                                                        eventItem.id
                                                        ? 'Hide attendees'
                                                        : `Attendees (${goingCount + interestedCount})`}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        featuringId ===
                                                        eventItem.id
                                                    }
                                                    onClick={() =>
                                                        void toggleFeatureEvent(
                                                            eventItem,
                                                        )
                                                    }
                                                    className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#526054] hover:bg-[#f6f7f4]"
                                                >
                                                    {eventItem.is_featured
                                                        ? 'Unfeature'
                                                        : 'Feature'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(eventItem)
                                                    }
                                                    className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#526054] hover:bg-[#f6f7f4]"
                                                >
                                                    Edit
                                                </button>

                                                {eventItem.status !==
                                                    'published' ? (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            publishingId ===
                                                            eventItem.id
                                                        }
                                                        onClick={() =>
                                                            void publishEvent(
                                                                eventItem.id,
                                                            )
                                                        }
                                                        className="rounded-lg bg-[#2b5139] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                                                    >
                                                        {publishingId ===
                                                            eventItem.id
                                                            ? 'Publishing…'
                                                            : 'Publish'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            statusUpdatingId ===
                                                            eventItem.id
                                                        }
                                                        onClick={() =>
                                                            void updateEventStatus(
                                                                eventItem.id,
                                                                'draft',
                                                            )
                                                        }
                                                        className="rounded-lg border border-[#e5dfd3] bg-[#faf8f4] px-2.5 py-1.5 text-[11px] font-semibold text-[#7a6338] disabled:opacity-60"
                                                    >
                                                        Unpublish
                                                    </button>
                                                )}

                                                <ConfirmationDialog
                                                    title="Delete event?"
                                                    description={`This will permanently delete "${eventItem.title}" and its RSVP records.`}
                                                    confirmLabel="Delete event"
                                                    onConfirm={() =>
                                                        deleteEvent(
                                                            eventItem.id,
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
                                    </div>
                                </div>

                                {/* Collapsible Attendee Roster for Managers */}
                                {canManage &&
                                    activeAttendeesEventId === eventItem.id && (
                                        <div className="mt-4 rounded-xl border border-[#dfe6dc] bg-[#f8faf7] p-4">
                                            <div className="mb-2.5 flex items-center justify-between border-b border-[#e5eae2] pb-2">
                                                <h3 className="text-xs font-bold text-[#2b5139] uppercase">
                                                    Event RSVP Roster ·{' '}
                                                    {goingCount} Going ·{' '}
                                                    {interestedCount} Interested
                                                </h3>
                                            </div>
                                            {attendeesLoading ? (
                                                <p className="text-xs text-[#6e776d]">
                                                    Loading attendee list…
                                                </p>
                                            ) : attendeesList.length > 0 ? (
                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {attendeesList.map(
                                                        (attendee) => (
                                                            <div
                                                                key={
                                                                    attendee.id
                                                                }
                                                                className="flex items-center justify-between rounded-lg border border-[#e5eae2] bg-white px-3 py-2 text-xs"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate font-semibold text-[#29382e]">
                                                                        {
                                                                            attendee.name
                                                                        }
                                                                    </p>
                                                                    <p className="truncate text-[11px] text-[#737c72]">
                                                                        {
                                                                            attendee.email
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <span
                                                                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${attendee.status ===
                                                                        'going'
                                                                        ? 'bg-[#edf2eb] text-[#2b5139]'
                                                                        : 'bg-[#e8eff4] text-[#2c5270]'
                                                                        }`}
                                                                >
                                                                    {
                                                                        attendee.status
                                                                    }
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[#7a8278]">
                                                    No RSVPs recorded for this
                                                    event yet.
                                                </p>
                                            )}
                                        </div>
                                    )}
                            </article>
                        );
                    })}
                </div>
            ) : (
                <EmptyState>
                    {canManage
                        ? 'No events match your current filter. Click "+ Create event" above to schedule one.'
                        : 'No upcoming events are scheduled for your cohort right now.'}
                </EmptyState>
            )}

            <AlumniProfileCompletionModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                profile={alumniProfile}
                onSuccess={() => meRes.reload()}
            />
        </div>
    );
}
