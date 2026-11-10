import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    Bell,
    BriefcaseBusiness,
    Building2,
    Calendar,
    ChevronDown,
    ChevronRight,
    CircleHelp,
    ClipboardList,
    FileSpreadsheet,
    GraduationCap,
    LayoutDashboard,
    Lock,
    LogOut,
    Menu,
    MessageSquareText,
    Pencil,
    Plus,
    Search,
    Settings2,
    ShieldCheck,
    UsersRound,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { logout } from '@/routes';
import { edit as profileSettings } from '@/routes/profile';
import ConfirmationDialog from '@/components/confirmation-dialog';
import { UserMenuContent } from '@/components/user-menu-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ActivityLog,
    AcademicCatalog,
    AcademicRecords,
    AlumniDirectory,
    AlumniProfileSummary,
    AlumniApplications,
    AssignedRoles,
    AnnouncementCenter,
    CompanyProfileCenter,
    EmploymentReports,
    EmploymentTracer,
    EmployerApplicants,
    EmployerDirectory,
    EmployerJobs,
    EventCenter,
    exportEmploymentOutcomes,
    LiveOverview,
    Notifications,
    PublicJobs,
    RegistrationAssistanceQueue,
    SurveyCenter,
    UnreadNotificationIndicator,
    AlumniProfileCompletionModal,
} from '@/components/alumni-portal-data';
import { useApiResource } from '@/hooks/use-api-resource';
import { type ApiEnvelope } from '@/lib/api';
import type { AlumniProfile } from '@/types/alumni';
import type { Auth } from '@/types/auth';

type Role =
    | 'Administrator'
    | 'Alumni coordinator'
    | 'Department coordinator'
    | 'Alumni'
    | 'Employer';
type NavigationItem = {
    label: string;
    icon: typeof LayoutDashboard;
    section?: string;
};

const roleCodes: Record<Role, string> = {
    Administrator: 'system-administrator',
    'Alumni coordinator': 'alumni-coordinator',
    'Department coordinator': 'department-coordinator',
    Alumni: 'alumni',
    Employer: 'employer',
};

const rolePriority: Role[] = [
    'Administrator',
    'Alumni coordinator',
    'Department coordinator',
    'Employer',
    'Alumni',
];

const navigation: Record<Role, NavigationItem[]> = {
    Administrator: [
        { label: 'Overview', icon: LayoutDashboard, section: 'Core & Insights' },
        { label: 'Notifications', icon: Bell, section: 'Core & Insights' },
        { label: 'Reports', icon: Activity, section: 'Core & Insights' },
        { label: 'Alumni directory', icon: UsersRound, section: 'Records & Catalog' },
        { label: 'Claim assistance', icon: ShieldCheck, section: 'Records & Catalog' },
        { label: 'Academic programs', icon: GraduationCap, section: 'Records & Catalog' },
        { label: 'Surveys', icon: ClipboardList, section: 'Engagement & Career' },
        { label: 'Announcements', icon: MessageSquareText, section: 'Engagement & Career' },
        { label: 'Events', icon: Calendar, section: 'Engagement & Career' },
        { label: 'Employers & jobs', icon: BriefcaseBusiness, section: 'Engagement & Career' },
        { label: 'Users & roles', icon: ShieldCheck, section: 'Governance' },
        { label: 'Activity log', icon: FileSpreadsheet, section: 'Governance' },
    ],
    'Alumni coordinator': [
        { label: 'Overview', icon: LayoutDashboard, section: 'Core & Insights' },
        { label: 'Notifications', icon: Bell, section: 'Core & Insights' },
        { label: 'Reports', icon: Activity, section: 'Core & Insights' },
        { label: 'Alumni directory', icon: UsersRound, section: 'Records & Verification' },
        { label: 'Claim assistance', icon: ShieldCheck, section: 'Records & Verification' },
        { label: 'Surveys', icon: ClipboardList, section: 'Engagement & Career' },
        { label: 'Announcements', icon: MessageSquareText, section: 'Engagement & Career' },
        { label: 'Events', icon: Calendar, section: 'Engagement & Career' },
        { label: 'Employers & jobs', icon: BriefcaseBusiness, section: 'Engagement & Career' },
    ],
    'Department coordinator': [
        { label: 'Overview', icon: LayoutDashboard, section: 'Core & Insights' },
        { label: 'Notifications', icon: Bell, section: 'Core & Insights' },
        { label: 'Employment outcomes', icon: Activity, section: 'Core & Insights' },
        { label: 'Department reports', icon: FileSpreadsheet, section: 'Core & Insights' },
        { label: 'Program alumni', icon: UsersRound, section: 'Scoped Records' },
        { label: 'Claim assistance', icon: ShieldCheck, section: 'Scoped Records' },
        { label: 'Surveys', icon: ClipboardList, section: 'Cohort Engagement' },
        { label: 'Announcements', icon: MessageSquareText, section: 'Cohort Engagement' },
        { label: 'Events', icon: Calendar, section: 'Cohort Engagement' },
    ],
    Alumni: [
        { label: 'My dashboard', icon: LayoutDashboard, section: 'Overview' },
        { label: 'Notifications', icon: Bell, section: 'Overview' },
        { label: 'My profile', icon: UsersRound, section: 'Graduate Record' },
        { label: 'Academic records', icon: GraduationCap, section: 'Graduate Record' },
        { label: 'Employment tracer', icon: Activity, section: 'Graduate Record' },
        { label: 'Surveys', icon: ClipboardList, section: 'Community & Career' },
        { label: 'Announcements', icon: MessageSquareText, section: 'Community & Career' },
        { label: 'Events', icon: Calendar, section: 'Community & Career' },
        { label: 'Career opportunities', icon: BriefcaseBusiness, section: 'Community & Career' },
        { label: 'My applications', icon: FileSpreadsheet, section: 'Community & Career' },
    ],
    Employer: [
        { label: 'Overview', icon: LayoutDashboard, section: 'Overview' },
        { label: 'Notifications', icon: Bell, section: 'Overview' },
        { label: 'Company profile', icon: Building2, section: 'Recruitment' },
        { label: 'Job postings', icon: BriefcaseBusiness, section: 'Recruitment' },
        { label: 'Applicants', icon: UsersRound, section: 'Recruitment' },
        { label: 'Events', icon: Calendar, section: 'Community & Insights' },
        { label: 'Recruitment analytics', icon: Activity, section: 'Community & Insights' },
    ],
};

const roleDetails: Record<Role, { context: string; scope: string }> = {
    Administrator: {
        context: 'System administrator',
        scope: 'SEAIT Institution-wide',
    },
    'Alumni coordinator': {
        context: 'Alumni coordinator',
        scope: 'SEAIT Alumni Services',
    },
    'Department coordinator': {
        context: 'Department coordinator',
        scope: 'Assigned Academic Programs',
    },
    Alumni: {
        context: 'SEAIT Alumni Member',
        scope: 'Your Alumni Portal',
    },
    Employer: {
        context: 'Employer Partner',
        scope: 'Employer Workspace',
    },
};

const pageCopy: Record<
    string,
    { title: string; description: string; action?: string }
> = {
    Overview: {
        title: 'Good morning',
        description:
            'Here’s what’s happening across the SEAIT alumni community.',
    },
    'My dashboard': {
        title: 'Welcome back',
        description:
            'Keep your SEAIT graduate profile and employment tracer current.',
    },
    'Alumni directory': {
        title: 'Alumni directory',
        description:
            'Explore SEAIT graduate records and their latest CHED GTS tracer updates.',
        action: 'Add alumni',
    },
    'Program alumni': {
        title: 'Assigned program alumni',
        description:
            'SEAIT alumni and employment outcomes scoped to your assigned academic programs.',
    },
    'Academic programs': {
        title: 'Academic programs',
        description:
            'Manage SEAIT academic units, degree programs, and graduating cohorts.',
        action: 'Add program',
    },
    Surveys: {
        title: 'Surveys',
        description:
            'Conduct CHED Graduate Tracer Study questionnaires and cohort surveys.',
        action: 'Create survey',
    },
    Announcements: {
        title: 'Announcements',
        description:
            'Share institutional bulletins and updates with targeted SEAIT alumni cohorts.',
        action: 'New announcement',
    },
    Events: {
        title: 'Events',
        description:
            'Discover upcoming SEAIT homecomings, career fairs, webinars, and networking gatherings.',
        action: 'Create event',
    },
    'Employers & jobs': {
        title: 'Employers & jobs',
        description:
            'Review partner companies and career opportunities shared with SEAIT alumni.',
        action: 'Review employers',
    },
    Reports: {
        title: 'Reports & insights',
        description:
            'Analyze CHED GTS graduate outcomes across all SEAIT academic units.',
        action: 'Export report',
    },
    'Employment outcomes': {
        title: 'Employment outcomes',
        description:
            'A focused view of graduate employability and degree alignment for your programs.',
    },
    'Department reports': {
        title: 'Department reports',
        description:
            'Employment and engagement trends scoped to your assigned SEAIT programs.',
        action: 'Export report',
    },
    'My profile': {
        title: 'My profile',
        description:
            'Your official alumni profile helps SEAIT stay connected with your career milestones.',
        action: 'Edit profile',
    },
    'Academic records': {
        title: 'Academic records',
        description: 'Your SEAIT degree programs and graduation history.',
    },
    'Employment tracer': {
        title: 'Employment tracer',
        description:
            'Report your employment history and curriculum alignment for the CHED Graduate Tracer Study.',
        action: 'Update my status',
    },
    'Career opportunities': {
        title: 'Career opportunities',
        description:
            'Verified roles shared by partner employers in the SEAIT community.',
    },
    'My applications': {
        title: 'My applications',
        description:
            'Track your submitted job applications and RA 10173 frozen profile snapshots.',
    },
    Notifications: {
        title: 'Notifications',
        description: 'Updates and reminders from the SEAIT alumni community.',
    },
    'Company profile': {
        title: 'Company profile',
        description:
            'Tell SEAIT alumni about your organization and recruitment mission.',
        action: 'Edit company profile',
    },
    'Job postings': {
        title: 'Job postings',
        description: 'Manage your open roles and reach verified SEAIT graduates.',
        action: 'Create job posting',
    },
    Applicants: {
        title: 'Applicants',
        description: 'Review SEAIT candidates who applied to your job postings.',
    },
    'Recruitment analytics': {
        title: 'Recruitment analytics',
        description:
            'A snapshot of your hiring activity across the SEAIT alumni community.',
        action: 'Export report',
    },
    'Users & roles': {
        title: 'Users & roles',
        description:
            'Manage role assignments, program scoping, and permissions across SEAIT ATMS.',
        action: 'Invite user',
    },
    'Activity log': {
        title: 'Activity log',
        description: 'A recent audit record of administrative and security events.',
    },
    'Claim assistance': {
        title: 'Registration claim assistance',
        description:
            'Diagnose and resolve alumni registration verification requests for your academic programs.',
    },
};

function extractFirstName(fullName: string): string {
    const cleaned = fullName.trim();
    if (!cleaned) {
        return 'Alumnus';
    }
    if (cleaned.includes(',')) {
        const afterComma = cleaned.split(',')[1]?.trim() ?? '';
        const firstToken = afterComma.split(/\s+/)[0]?.replace(/[^a-zA-Z0-9-]/g, '');
        if (firstToken) {
            return firstToken;
        }
    }
    return cleaned.split(/\s+/)[0]?.replace(/,+$/, '') || 'Alumnus';
}

export default function AlumniPortal({
    children,
    activeNavOverride,
    pageTitle,
    pageDescription,
}: {
    children?: React.ReactNode;
    activeNavOverride?: string;
    pageTitle?: string;
    pageDescription?: string;
} = {}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const isCustomChildPage = Boolean(children);
    const availableRoles = rolePriority.filter((role) =>
        user?.roles?.includes(roleCodes[role]),
    );
    const resolvePortalStateFromUrl = (): { role: Role; page: string } => {
        let defaultRole: Role = availableRoles[0] ?? 'Alumni';
        if (typeof window !== 'undefined') {
            const storedRole = window.sessionStorage.getItem(
                'seait_workspace_role',
            ) as Role | null;
            if (storedRole && availableRoles.includes(storedRole)) {
                defaultRole = storedRole;
            }
            const params = new URLSearchParams(window.location.search);
            const requestedRole = params.get('role') as Role | null;
            const requestedPage = params.get('page');

            if (requestedRole && availableRoles.includes(requestedRole)) {
                const validPage = navigation[requestedRole].find(
                    (item) =>
                        item.label.toLowerCase() ===
                        (requestedPage ?? '').toLowerCase(),
                );
                return {
                    role: requestedRole,
                    page: validPage?.label ?? navigation[requestedRole][0].label,
                };
            }

            if (requestedPage) {
                for (const candidateRole of availableRoles) {
                    const match = navigation[candidateRole].find(
                        (item) =>
                            item.label.toLowerCase() ===
                            requestedPage.toLowerCase(),
                    );
                    if (match) {
                        return { role: candidateRole, page: match.label };
                    }
                }
            }
        }
        return {
            role: defaultRole,
            page: navigation[defaultRole][0].label,
        };
    };
    const [role, setRole] = useState<Role>(() => resolvePortalStateFromUrl().role);
    const [activePage, setActivePage] = useState(
        () => resolvePortalStateFromUrl().page,
    );
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [profileCompletionModalOpen, setProfileCompletionModalOpen] =
        useState(false);

    const alumniProfileRes = useApiResource<ApiEnvelope<AlumniProfile>>(
        role === 'Alumni' ? '/api/me/alumni' : null,
    );
    const alumniProfile = alumniProfileRes.data?.data ?? null;
    const isProfileComplete =
        role !== 'Alumni'
            ? true
            : (alumniProfile?.is_complete ?? user.is_profile_complete ?? false);
    const missingProfileFields =
        role !== 'Alumni'
            ? []
            : (alumniProfile?.missing_fields ??
              user.missing_profile_fields ??
              []);

    useEffect(() => {
        if (typeof window !== 'undefined' && role) {
            window.sessionStorage.setItem('seait_workspace_role', role);
        }
    }, [role]);

    const syncUrlState = (nextRole: Role, nextPage: string) => {
        if (typeof window === 'undefined' || isCustomChildPage) {
            return;
        }
        const url = new URL(window.location.href);
        url.searchParams.set('role', nextRole);
        url.searchParams.set('page', nextPage);
        window.history.replaceState({}, '', url.toString());
    };

    useEffect(() => {
        if (typeof window === 'undefined' || isCustomChildPage) {
            return;
        }
        const handlePopState = () => {
            const next = resolvePortalStateFromUrl();
            setRole(next.role);
            setActivePage(next.page);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isCustomChildPage]);

    const navigateToPage = (nextPage: string) => {
        if (isCustomChildPage) {
            router.visit(
                `/dashboard?role=${encodeURIComponent(role)}&page=${encodeURIComponent(nextPage)}`,
            );
            return;
        }
        setActivePage(nextPage);
        syncUrlState(role, nextPage);
    };

    const profile = {
        ...roleDetails[role],
        name: user?.name ?? '',
        initials: (user?.name ?? '')
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
    };
    const pageDefinition =
        activePage === 'Overview' || activePage === 'My dashboard'
            ? {
                  ...(pageCopy[activePage] ?? pageCopy.Overview),
                  title: `${activePage === 'My dashboard' ? 'Welcome back' : 'Good morning'}, ${extractFirstName(profile.name)}`,
              }
            : (pageCopy[activePage] ?? pageCopy.Overview);
    const canManageContent = ['Administrator', 'Alumni coordinator'].includes(
        role,
    );
    const hideAction =
        (['Surveys', 'Announcements', 'Events'].includes(activePage) &&
            !canManageContent) ||
        [
            'Academic programs',
            'Employers & jobs',
            'Recruitment analytics',
            'Users & roles',
        ].includes(activePage);
    const currentPage = {
        ...pageDefinition,
        action: hideAction ? undefined : pageDefinition.action,
    };
    const navItems = availableRoles.length ? navigation[role] : [];
    const isOverview =
        activePage === 'Overview' || activePage === 'My dashboard';

    function handleAction() {
        if (currentPage.action?.startsWith('Export')) {
            void exportEmploymentOutcomes();
        } else {
            setDialogOpen(true);
        }
    }

    function handleLogout(): Promise<boolean> {
        setAccountMenuOpen(false);
        setMobileNavOpen(false);
        return new Promise((resolve) => {
            router.flushAll();
            router.post(
                logout().url,
                {},
                {
                    onSuccess: () => resolve(true),
                    onError: () => resolve(false),
                },
            );
        });
    }

    const content = isCustomChildPage ? (
        children
    ) : !availableRoles.length ? (
        <section
            role="alert"
            className="rounded-2xl border border-[#e9ebe5] bg-white p-6 text-sm text-[#687267]"
        >
            This account does not have an assigned workspace role. Contact an
            administrator to request access.
        </section>
    ) : isOverview ? (
        <LiveOverview role={role} onNavigate={(page) => navigateToPage(page)} />
    ) : ['Alumni directory', 'Program alumni'].includes(activePage) ? (
        <AlumniDirectory
            createOpen={dialogOpen}
            onCloseCreate={() => setDialogOpen(false)}
            query={search}
            onQueryChange={setSearch}
        />
    ) : activePage === 'Academic programs' ? (
        <AcademicCatalog
            createOpen={dialogOpen}
            onCloseCreate={() => setDialogOpen(false)}
        />
    ) : activePage === 'Academic records' ? (
        <AcademicRecords />
    ) : activePage === 'My profile' ? (
        <AlumniProfileSummary
            editOpen={dialogOpen}
            onCloseEdit={() => setDialogOpen(false)}
            userAvatar={user?.avatar ?? null}
            onNavigate={(page) => navigateToPage(page)}
        />
    ) : activePage === 'Employment tracer' ? (
        <EmploymentTracer
            createOpen={dialogOpen}
            onCloseCreate={() => setDialogOpen(false)}
        />
    ) : activePage === 'Career opportunities' ? (
        <PublicJobs onNavigate={(page) => navigateToPage(page)} />
    ) : activePage === 'My applications' ? (
        <AlumniApplications onNavigate={(page) => navigateToPage(page)} />
    ) : activePage === 'Applicants' ? (
        <EmployerApplicants onNavigate={(page) => navigateToPage(page)} />
    ) : activePage === 'Job postings' ? (
        <EmployerJobs
            createOpen={dialogOpen}
            onCloseCreate={() => setDialogOpen(false)}
            onNavigate={(page) => navigateToPage(page)}
        />
    ) : activePage === 'Company profile' ? (
        <CompanyProfileCenter
            editOpen={dialogOpen}
            onCloseEdit={() => setDialogOpen(false)}
        />
    ) : activePage === 'Employers & jobs' ? (
        <EmployerDirectory />
    ) : activePage === 'Announcements' ? (
        <AnnouncementCenter
            role={role}
            createOpen={dialogOpen}
            onCloseCreate={() => setDialogOpen(false)}
        />
    ) : activePage === 'Events' ? (
        <EventCenter
            role={role}
            createOpen={dialogOpen}
            onCloseCreate={() => setDialogOpen(false)}
        />
    ) : activePage === 'Surveys' ? (
        <SurveyCenter
            role={role}
            createOpen={dialogOpen}
            onCloseCreate={() => setDialogOpen(false)}
        />
    ) : ['Reports', 'Employment outcomes', 'Department reports'].includes(
        activePage,
    ) ? (
        <EmploymentReports />
    ) : activePage === 'Notifications' ? (
        <Notifications />
    ) : activePage === 'Claim assistance' ? (
        <RegistrationAssistanceQueue />
    ) : activePage === 'Activity log' ? (
        <ActivityLog />
    ) : activePage === 'Users & roles' ? (
        <AssignedRoles roleCodes={user.roles ?? []} currentUserId={user.id} />
    ) : activePage === 'Recruitment analytics' ? (
        <LiveOverview role={role} onNavigate={(page) => navigateToPage(page)} />
    ) : (
        <section
            role="alert"
            className="rounded-2xl border border-[#e9ebe5] bg-white p-6 text-sm text-[#687267]"
        >
            This workspace module is not available for your assigned role.
        </section>
    );

    return (
        <div
            className="min-h-screen bg-[#F5F4EE] text-zinc-900"
            style={
                {
                    '--background': 'oklch(1 0 0)',
                    '--foreground': 'oklch(0.145 0 0)',
                    '--card': 'oklch(1 0 0)',
                    '--card-foreground': 'oklch(0.145 0 0)',
                    '--popover': 'oklch(1 0 0)',
                    '--popover-foreground': 'oklch(0.145 0 0)',
                    '--primary': '#E47818',
                    '--primary-foreground': '#ffffff',
                    '--secondary': 'oklch(0.97 0 0)',
                    '--secondary-foreground': 'oklch(0.205 0 0)',
                    '--muted': 'oklch(0.97 0 0)',
                    '--muted-foreground': 'oklch(0.556 0 0)',
                    '--accent': 'oklch(0.97 0 0)',
                    '--accent-foreground': 'oklch(0.205 0 0)',
                    '--border': 'oklch(0.922 0 0)',
                    '--input': 'oklch(0.922 0 0)',
                    '--ring': '#E47818',
                    colorScheme: 'light',
                } as React.CSSProperties
            }
        >
            <button
                aria-label="Close navigation"
                type="button"
                tabIndex={mobileNavOpen ? 0 : -1}
                onClick={() => setMobileNavOpen(false)}
                className={`fixed inset-0 z-30 bg-[#001c17]/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out md:hidden ${
                    mobileNavOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                }`}
            />
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[min(272px,85vw)] flex-col border-r border-zinc-200/90 bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:w-[256px] md:translate-x-0 md:shadow-none ${
                    mobileNavOpen
                        ? 'translate-x-0 shadow-2xl'
                        : '-translate-x-full shadow-none'
                }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-zinc-200/80 px-4">
                    <Link
                        href="/dashboard"
                        onClick={(event) => {
                            if (!isCustomChildPage) {
                                event.preventDefault();
                                navigateToPage(navigation[role][0]?.label ?? 'Overview');
                                setMobileNavOpen(false);
                                setDialogOpen(false);
                                setSearch('');
                            }
                        }}
                        className="group flex items-center gap-3"
                    >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white p-1 shadow-2xs transition group-hover:border-[#E47818]/60">
                            <img
                                src="/images/seait-logo.png"
                                alt="SEAIT Official Seal"
                                className="size-full object-contain"
                            />
                        </span>
                        <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                                <span className="font-heading text-sm font-extrabold tracking-tight text-zinc-900">
                                    SEAIT
                                </span>
                                <span className="rounded border border-orange-300/80 bg-orange-50 px-1.5 py-0.5 font-heading text-[9px] font-bold tracking-wider text-[#E47818] uppercase">
                                    ATMS
                                </span>
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                                Alumni Tracer Portal
                            </span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setMobileNavOpen(false)}
                        className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 md:hidden"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <nav
                    aria-label={`${role} navigation`}
                    className="portal-sidebar-nav mt-2 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2.5 pb-3"
                >
                    {navItems.map(({ label, icon: Icon, section }, index) => {
                        const selected =
                            !isCustomChildPage && activePage === label;
                        const prevSection =
                            index > 0 ? navItems[index - 1]?.section : undefined;
                        const showSectionHeader =
                            section && section !== prevSection;
                        const isGatedInteraction =
                            role === 'Alumni' &&
                            !isProfileComplete &&
                            [
                                'Surveys',
                                'Career opportunities',
                                'Employment tracer',
                                'Events',
                            ].includes(label);

                        return (
                            <div key={label}>
                                {showSectionHeader && (
                                    <div className="px-2 pt-3 pb-1 text-[10px] font-bold tracking-[0.12em] text-zinc-400 uppercase">
                                        {section}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigateToPage(label);
                                        setMobileNavOpen(false);
                                        setDialogOpen(false);
                                        setSearch('');
                                    }}
                                    aria-current={selected ? 'page' : undefined}
                                    className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-semibold transition ${
                                        selected
                                            ? 'bg-[#001c17] text-white shadow-2xs'
                                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                    }`}
                                >
                                    <Icon
                                        className={`size-4 shrink-0 ${
                                            selected
                                                ? 'text-[#E47818]'
                                                : 'text-zinc-500'
                                        }`}
                                    />
                                    <span className="truncate">{label}</span>
                                    {isGatedInteraction && (
                                        <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-amber-300/80 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-900">
                                            <Lock className="size-2.5" /> Required
                                        </span>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                    <div className="my-3 border-t border-zinc-200/80" />
                    <button
                        type="button"
                        onClick={() => {
                            setNotificationsOpen(true);
                            setMobileNavOpen(false);
                        }}
                        className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                        <CircleHelp className="size-4 text-zinc-500" /> Activity & help
                    </button>
                    <Link
                        href={profileSettings()}
                        onClick={() => setMobileNavOpen(false)}
                        aria-current={
                            activeNavOverride === 'Account settings'
                                ? 'page'
                                : undefined
                        }
                        className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-semibold transition ${
                            activeNavOverride === 'Account settings'
                                ? 'bg-[#001c17] text-white shadow-2xs'
                                : 'font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                        }`}
                    >
                        <Settings2
                            className={`size-4 shrink-0 ${
                                activeNavOverride === 'Account settings'
                                    ? 'text-[#E47818]'
                                    : 'text-zinc-500'
                            }`}
                        />{' '}
                        Account settings
                    </Link>
                </nav>
                <div className="relative border-t border-zinc-200/80 p-2.5">
                    {user && (
                        <div
                            role="menu"
                            aria-label="Account menu"
                            aria-hidden={!accountMenuOpen}
                            className={`absolute right-2 bottom-full left-2 z-30 mb-2 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg transition-all ${
                                accountMenuOpen
                                    ? 'pointer-events-auto visible translate-y-0 opacity-100'
                                    : 'pointer-events-none invisible translate-y-1 opacity-0'
                            }`}
                        >
                            <Link
                                href={profileSettings()}
                                role="menuitem"
                                onClick={() => setAccountMenuOpen(false)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                                data-test="workspace-account-settings"
                            >
                                <Settings2 className="size-3.5 text-zinc-500" />
                                Account settings
                            </Link>
                            <ConfirmationDialog
                                title="Log out?"
                                description="Are you sure you want to log out of your account?"
                                confirmLabel="Log out"
                                pendingLabel="Logging out…"
                                variant="default"
                                onConfirm={handleLogout}
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => setAccountMenuOpen(false)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                                    data-test="workspace-logout-button"
                                >
                                    <LogOut className="size-3.5 text-rose-600" />
                                    Log out
                                </button>
                            </ConfirmationDialog>
                        </div>
                    )}
                    <div
                        onClick={() =>
                            setAccountMenuOpen((isOpen) => !isOpen)
                        }
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-[#F5F4EE] p-2 transition hover:bg-[#eceae1]"
                    >
                        <Avatar className="size-8 shrink-0 overflow-hidden rounded-full bg-[#001c17] text-[10px] font-bold text-white">
                            <AvatarImage
                                src={user?.avatar ?? undefined}
                                alt={profile.name}
                                className="object-cover"
                            />
                            <AvatarFallback className="rounded-full bg-[#001c17] text-[10px] font-bold text-white">
                                {profile.initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                            <span
                                className="block truncate text-xs font-semibold text-zinc-900"
                                title={profile.name}
                            >
                                {profile.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
                                {profile.context}
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                setAccountMenuOpen((isOpen) => !isOpen);
                            }}
                            aria-label="Open account menu"
                            aria-haspopup="menu"
                            aria-expanded={accountMenuOpen}
                            className="grid size-7 place-items-center rounded-lg text-zinc-500 hover:bg-white"
                        >
                            <ChevronDown
                                className={`size-3.5 transition-transform duration-200 ${
                                    accountMenuOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </aside>

            <div className="min-h-screen min-w-0 overflow-x-hidden md:pl-[256px]">
                <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-zinc-200/80 bg-white/95 px-3 backdrop-blur sm:h-16 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            aria-label="Open navigation"
                            onClick={() => setMobileNavOpen(true)}
                            className="grid size-9 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 md:hidden"
                        >
                            <Menu className="size-4" />
                        </button>
                        <div className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
                            <span>SEAIT Workspace</span>
                            <ChevronRight className="size-3" />
                        </div>
                        <span className="truncate text-xs font-bold text-zinc-900 sm:text-sm">
                            {activeNavOverride ?? activePage}
                        </span>
                        <span className="hidden rounded-full border border-teal-600/25 bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-teal-800 lg:inline-flex">
                            {profile.scope}
                        </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                        {[
                            'Administrator',
                            'Alumni coordinator',
                            'Department coordinator',
                        ].includes(role) && (
                            <label className="hidden h-9 w-52 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2.5 lg:flex">
                                <Search className="size-3.5 text-zinc-400" />
                                <input
                                    value={search}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setSearch(value);
                                        if (value.trim()) {
                                            const directoryPage = navigation[
                                                role
                                            ].find((item) =>
                                                [
                                                    'Alumni directory',
                                                    'Program alumni',
                                                ].includes(item.label),
                                            );
                                            if (directoryPage) {
                                                navigateToPage(
                                                    directoryPage.label,
                                                );
                                            }
                                        }
                                    }}
                                    aria-label="Search alumni records"
                                    placeholder="Search graduate records..."
                                    className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-400"
                                />
                                <kbd className="rounded border border-zinc-200 px-1 py-0.5 text-[9px] text-zinc-400">
                                    ⌘ K
                                </kbd>
                            </label>
                        )}
                        <button
                            type="button"
                            aria-label="Notifications"
                            onClick={() => setNotificationsOpen(true)}
                            className="relative grid size-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                            data-test="notifications-button"
                        >
                            <Bell className="size-4" />
                            <UnreadNotificationIndicator
                                key={notificationRefreshKey}
                            />
                        </button>
                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="Open account menu"
                                        className="grid size-9 place-items-center rounded-full ring-offset-2 transition hover:ring-2 hover:ring-orange-200 focus-visible:ring-2 focus-visible:ring-[#E47818] focus-visible:outline-none"
                                        data-test="header-account-menu-button"
                                    >
                                        <Avatar className="size-8 overflow-hidden rounded-full bg-[#001c17] text-[10px] font-bold text-white">
                                            <AvatarImage
                                                src={user.avatar ?? undefined}
                                                alt={user.name}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="rounded-full bg-[#001c17] text-[10px] font-bold text-white">
                                                {profile.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-56"
                                    align="end"
                                    sideOffset={8}
                                >
                                    <UserMenuContent user={user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </header>

                <main className="mx-auto w-full min-w-0 max-w-[1500px] px-3.5 py-4 pb-20 sm:px-6 sm:py-6 sm:pb-12 lg:px-8">
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-[0.16em] text-[#E47818] uppercase">
                                SEAIT · {role} Workspace
                            </p>
                            <h1 className="mt-1.5 font-heading text-xl leading-tight font-bold tracking-tight break-words text-zinc-900 sm:text-[28px]">
                                {pageTitle ?? currentPage.title}
                            </h1>
                            <p className="mt-1.5 text-xs leading-5 text-zinc-600 sm:text-sm">
                                {pageDescription ?? currentPage.description}
                            </p>
                        </div>
                        {isCustomChildPage ? (
                            <Link
                                href={`/dashboard?role=${encodeURIComponent(role)}&page=${encodeURIComponent(activePage)}`}
                                className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-800 shadow-2xs transition hover:border-[#E47818] hover:text-[#E47818] sm:w-auto"
                            >
                                <LayoutDashboard className="size-3.5 text-[#E47818]" />
                                Back to {role} workspace
                            </Link>
                        ) : (
                            currentPage.action && (
                                <button
                                    type="button"
                                    onClick={handleAction}
                                    className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#E47818] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#F36C21] sm:w-auto"
                                >
                                    {currentPage.action.startsWith('Export') ? (
                                        <FileSpreadsheet className="size-3.5" />
                                    ) : (
                                        <Plus className="size-3.5" />
                                    )}
                                    {currentPage.action}
                                </button>
                            )
                        )}
                    </div>

                    {search && !isOverview && !isCustomChildPage && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl border border-teal-600/25 bg-teal-500/10 px-3 py-2 text-xs text-teal-900">
                            <Search className="size-3.5" />
                            Searching records for “{search}”
                            <button
                                type="button"
                                aria-label="Clear search"
                                onClick={() => setSearch('')}
                                className="ml-auto"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>
                    )}

                    {role === 'Alumni' && !isProfileComplete && !isCustomChildPage && (
                        <div className="mb-6 rounded-2xl border border-amber-300/80 bg-linear-to-r from-amber-50 via-orange-50 to-amber-50 p-4 sm:p-5 shadow-xs">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3.5">
                                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
                                        <AlertCircle className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-heading text-sm font-bold text-zinc-900 sm:text-base">
                                                Profile Completion Required
                                            </h2>
                                            <span className="rounded-full border border-amber-300 bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                                                Action Required
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                                            To answer surveys, apply for career opportunities, submit tracer updates, or RSVP to events, please complete your profile information.
                                        </p>
                                        {missingProfileFields.length > 0 && (
                                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-amber-950">
                                                <span className="font-semibold text-zinc-700">Missing fields:</span>
                                                {missingProfileFields.map((field) => (
                                                    <span
                                                        key={field}
                                                        className="rounded border border-amber-200 bg-white/80 px-1.5 py-0.5 font-medium text-amber-900 shadow-2xs"
                                                    >
                                                        {field}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setProfileCompletionModalOpen(true)}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#001c17] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#002e26] sm:w-auto"
                                    >
                                        <Pencil className="size-3.5 text-[#E47818]" />
                                        Complete Profile Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isCustomChildPage ? children : content}

                    <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-zinc-200/80 pt-4 text-xs text-zinc-500 sm:flex-row">
                        <span>
                            South East Asian Institute of Technology, Inc. (SEAIT) · Alumni Tracer Management System
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500" />{' '}
                            CHED GTS & RA 10173 Compliant Portal
                        </span>
                    </footer>
                </main>
            </div>

            <Link
                href="/"
                className="fixed right-4 bottom-4 z-20 inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white/95 px-3.5 text-xs font-semibold text-zinc-800 shadow-lg backdrop-blur transition hover:border-[#E47818] hover:text-[#E47818] sm:right-6 sm:bottom-5"
            >
                <ArrowDownRight className="size-3.5 rotate-[-135deg]" /> Public
                website
            </Link>

            <Dialog
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
            >
                <DialogContent
                    className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
                    data-test="notifications-dialog"
                >
                    <DialogHeader>
                        <DialogTitle>Notifications</DialogTitle>
                        <DialogDescription>
                            Recent updates and account activity.
                        </DialogDescription>
                    </DialogHeader>
                    <Notifications
                        onUpdated={() =>
                            setNotificationRefreshKey((key) => key + 1)
                        }
                    />
                </DialogContent>
            </Dialog>

            {role === 'Alumni' && (
                <AlumniProfileCompletionModal
                    isOpen={profileCompletionModalOpen}
                    onClose={() => setProfileCompletionModalOpen(false)}
                    profile={alumniProfile}
                    onSuccess={() => {
                        void alumniProfileRes.reload();
                        router.reload({ only: ['auth'] });
                    }}
                />
            )}
        </div>
    );
}
