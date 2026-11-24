import { useApiResource } from '@/hooks/use-api-resource';
import type { UserNotification } from '@/types/alumni';

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

