import AlumniPortal from '@/components/alumni-portal';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const activeTitle =
        breadcrumbs[breadcrumbs.length - 1]?.title ?? 'Account settings';

    return (
        <AlumniPortal
            activeNavOverride="Account settings"
            pageTitle={activeTitle}
            pageDescription="Manage your SEAIT account profile, security credentials, two-factor authentication, passkeys, and portal appearance."
        >
            {children}
        </AlumniPortal>
    );
}
