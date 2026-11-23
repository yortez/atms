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

type NotificationPage = {
    data: UserNotification[];
    current_page: number;
    last_page: number;
    total: number;
};

type NotificationResponse = {
    data: NotificationPage;
    meta?: {
        unread_count: number;
    };
};

export function UnreadNotificationIndicator() {
    const { data } = useApiResource<NotificationResponse>('/api/notifications');
    const unreadCount =
        data?.meta?.unread_count ??
        data?.data.data.filter((notification) => !notification.read_at)
            .length ??
        0;

    return unreadCount ? (
        <span className="absolute -top-1 -right-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#c57657] px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
        </span>
    ) : null;
}

export function Notifications({ onUpdated }: { onUpdated?: () => void } = {}) {
    const { data, loading, error, reload } =
        useApiResource<NotificationResponse>('/api/notifications');
    const notifications = data?.data.data ?? [];
    const unreadCount =
        data?.meta?.unread_count ??
        notifications.filter((notification) => !notification.read_at).length;
    const [updating, setUpdating] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);

    async function markAsRead(id: string) {
        setUpdating(id);
        try {
            await apiRequest<ApiEnvelope<{ id: string; read_at: string }>>(
                `/api/notifications/${encodeURIComponent(id)}/read`,
                { method: 'PATCH' },
            );
            reload();
            onUpdated?.();
            toast.success('Notification marked as read.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Notification could not be updated.',
            );
        } finally {
            setUpdating(null);
        }
    }

    async function markAllAsRead() {
        setMarkingAll(true);
        try {
            await apiRequest<
                ApiEnvelope<{ marked_count: number; read_at: string }>
            >('/api/notifications/read-all', { method: 'PATCH' });
            reload();
            onUpdated?.();
            toast.success('All notifications marked as read.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Notifications could not be updated.',
            );
        } finally {
            setMarkingAll(false);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    return notifications.length ? (
        <div className="grid gap-3">
            {unreadCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#e9ebe5] bg-[#fafbf9] px-4 py-2.5">
                    <span className="text-xs font-medium text-[#495a4f]">
                        {unreadCount} unread{' '}
                        {unreadCount === 1 ? 'notification' : 'notifications'}
                    </span>
                    <button
                        type="button"
                        disabled={markingAll}
                        onClick={() => void markAllAsRead()}
                        className="rounded-lg border border-[#d2ddd0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#2c5339] hover:bg-[#edf2ea] disabled:opacity-60"
                    >
                        {markingAll ? 'Updating…' : 'Mark all as read'}
                    </button>
                </div>
            )}
            {notifications.map((notification) => {
                const title =
                    typeof notification.data.title === 'string'
                        ? notification.data.title
                        : (notification.type.split('\\').pop() ??
                            'Notification');
                const message =
                    typeof notification.data.message === 'string'
                        ? notification.data.message
                        : 'You have a new update.';

                return (
                    <article
                        key={notification.id}
                        className="flex flex-col gap-4 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:flex-row sm:items-center"
                    >
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold text-[#39463b]">
                                {title}
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-[#7a8278]">
                                {message}
                            </p>
                            <p className="mt-2 text-[10px] text-[#858b82]">
                                {new Date(
                                    notification.created_at,
                                ).toLocaleString()}
                            </p>
                        </div>
                        {notification.read_at ? (
                            <span className="text-[10px] font-medium text-[#687267]">
                                Read
                            </span>
                        ) : (
                            <button
                                type="button"
                                disabled={updating === notification.id}
                                onClick={() => void markAsRead(notification.id)}
                                className="rounded-lg border border-[#e8eae4] px-3 py-2 text-[11px] font-semibold text-[#526754] disabled:opacity-60"
                            >
                                {updating === notification.id
                                    ? 'Updating…'
                                    : 'Mark as read'}
                            </button>
                        )}
                    </article>
                );
            })}
        </div>
    ) : (
        <EmptyState>You do not have any notifications yet.</EmptyState>
    );
}

export function ActivityLog() {
    const { data, loading, error } =
        useApiResource<ApiEnvelope<RawPagination<ActivityLogEntry>>>(
            '/api/activity-logs',
        );

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const entries = data?.data.data ?? [];
    return entries.length ? (
        <div className="overflow-hidden rounded-2xl border border-[#e9ebe5] bg-white">
            {entries.map((entry) => (
                <article
                    key={entry.id}
                    className="flex flex-col gap-2 border-b border-[#eff0ec] p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                    <div>
                        <h2 className="text-xs font-semibold text-[#39463b]">
                            {entry.action.replaceAll('.', ' ')}
                        </h2>
                        <p className="mt-1 text-[10px] text-[#858b82]">
                            {entry.actor?.name ?? 'System'}
                            {entry.subject_type
                                ? ` · ${entry.subject_type.split('\\').pop()}`
                                : ''}
                            {entry.subject_id ? ` #${entry.subject_id}` : ''}
                        </p>
                    </div>
                    <time className="text-[10px] text-[#858b82]">
                        {new Date(entry.created_at).toLocaleString()}
                    </time>
                </article>
            ))}
        </div>
    ) : (
        <EmptyState>No activity has been recorded yet.</EmptyState>
    );
}
