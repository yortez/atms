import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowDownRight,
    Bell,
    BriefcaseBusiness,
    Building2,
    ChevronDown,
    ChevronRight,
    CircleHelp,
    ClipboardList,
    FileSpreadsheet,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageSquareText,
    Plus,
    Search,
    Settings2,
    ShieldCheck,
    UsersRound,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
    exportEmploymentOutcomes,
    LiveOverview,
    Notifications,
    PublicJobs,
    SurveyCenter,
    UnreadNotificationIndicator,
} from '@/components/alumni-portal-data';
import type { Auth } from '@/types/auth';

type Role =
    | 'Administrator'
    | 'Alumni coordinator'
    | 'Department coordinator'
    | 'Alumni'
    | 'Employer';
type NavigationItem = { label: string; icon: typeof LayoutDashboard };

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
        { label: 'Overview', icon: LayoutDashboard },
        { label: 'Notifications', icon: Bell },
        { label: 'Alumni directory', icon: UsersRound },
        { label: 'Academic programs', icon: GraduationCap },
        { label: 'Surveys', icon: ClipboardList },
        { label: 'Announcements', icon: MessageSquareText },
        { label: 'Employers & jobs', icon: BriefcaseBusiness },
        { label: 'Reports', icon: Activity },
        { label: 'Users & roles', icon: ShieldCheck },
        { label: 'Activity log', icon: FileSpreadsheet },
    ],
    'Alumni coordinator': [
        { label: 'Overview', icon: LayoutDashboard },
        { label: 'Notifications', icon: Bell },
        { label: 'Alumni directory', icon: UsersRound },
        { label: 'Surveys', icon: ClipboardList },
        { label: 'Announcements', icon: MessageSquareText },
        { label: 'Employers & jobs', icon: BriefcaseBusiness },
        { label: 'Reports', icon: Activity },
    ],
    'Department coordinator': [
        { label: 'Overview', icon: LayoutDashboard },
        { label: 'Notifications', icon: Bell },
        { label: 'Program alumni', icon: UsersRound },
        { label: 'Employment outcomes', icon: Activity },
        { label: 'Surveys', icon: ClipboardList },
        { label: 'Announcements', icon: MessageSquareText },
        { label: 'Department reports', icon: FileSpreadsheet },
    ],
    Alumni: [
        { label: 'My dashboard', icon: LayoutDashboard },
        { label: 'Notifications', icon: Bell },
        { label: 'My profile', icon: UsersRound },
        { label: 'Academic records', icon: GraduationCap },
        { label: 'Employment tracer', icon: Activity },
        { label: 'Surveys', icon: ClipboardList },
        { label: 'Announcements', icon: MessageSquareText },
        { label: 'Career opportunities', icon: BriefcaseBusiness },
        { label: 'My applications', icon: FileSpreadsheet },
    ],
    Employer: [
        { label: 'Overview', icon: LayoutDashboard },
        { label: 'Notifications', icon: Bell },
        { label: 'Company profile', icon: Building2 },
        { label: 'Job postings', icon: BriefcaseBusiness },
        { label: 'Applicants', icon: UsersRound },
        { label: 'Recruitment analytics', icon: Activity },
    ],
};

const roleDetails: Record<Role, { context: string; scope: string }> = {
    Administrator: {
        context: 'System administrator',
        scope: 'Institution-wide overview',
    },
    'Alumni coordinator': {
        context: 'Alumni coordinator',
        scope: 'Alumni services',
    },
    'Department coordinator': {
        context: 'Department coordinator',
        scope: 'Assigned programs',
    },
    Alumni: {
        context: 'Alumni member',
        scope: 'Your alumni portal',
    },
    Employer: {
        context: 'Employer workspace',
        scope: 'Employer workspace',
    },
};

const pageCopy: Record<
    string,
    { title: string; description: string; action?: string }
> = {
    Overview: {
        title: 'Good morning, Jordan',
        description: 'Here’s what’s happening across your alumni community.',
    },
    'My dashboard': {
        title: 'Welcome back',
        description: 'Keep your profile current and stay close to what’s next.',
    },
    'Alumni directory': {
        title: 'Alumni directory',
        description:
            'Explore graduate records and their latest tracer updates.',
        action: 'Add alumni',
    },
    'Program alumni': {
        title: 'School of Computing',
        description: 'Alumni and outcomes for your assigned academic programs.',
    },
    'Academic programs': {
        title: 'Academic programs',
        description: 'Manage departments, programs, and graduating cohorts.',
        action: 'Add program',
    },
    Surveys: {
        title: 'Surveys',
        description: 'Keep graduates engaged and make every response count.',
        action: 'Create survey',
    },
    Announcements: {
        title: 'Announcements',
        description:
            'Share news and updates with the right alumni communities.',
        action: 'New announcement',
    },
    'Employers & jobs': {
        title: 'Employers & jobs',
        description:
            'Review employer partners and opportunities shared with alumni.',
        action: 'Review employers',
    },
    Reports: {
        title: 'Reports & insights',
        description: 'Understand graduate outcomes across the institution.',
        action: 'Export report',
    },
    'Employment outcomes': {
        title: 'Employment outcomes',
        description: 'A focused view of graduate outcomes for your programs.',
    },
    'Department reports': {
        title: 'Department reports',
        description:
            'Employment and engagement trends for your assigned programs.',
        action: 'Export report',
    },
    'My profile': {
        title: 'My profile',
        description: 'Your alumni profile helps Northfield stay connected.',
        action: 'Edit profile',
    },
    'Academic records': {
        title: 'Academic records',
        description: 'Your Northfield programs and graduation history.',
    },
    'Employment tracer': {
        title: 'Employment tracer',
        description: 'Tell us where your professional journey has taken you.',
        action: 'Update my status',
    },
    'Career opportunities': {
        title: 'Career opportunities',
        description: 'Roles shared by employers in the Northfield community.',
    },
    'My applications': {
        title: 'My applications',
        description: 'Keep track of your applications and next steps.',
    },
    Notifications: {
        title: 'Notifications',
        description: 'Updates and reminders from your alumni community.',
    },
    'Company profile': {
        title: 'Company profile',
        description: 'Tell alumni about your company and the people behind it.',
        action: 'Edit company profile',
    },
    'Job postings': {
        title: 'Job postings',
        description: 'Manage your open roles and reach Northfield graduates.',
        action: 'Create job posting',
    },
    Applicants: {
        title: 'Applicants',
        description: 'Review candidates who applied to your job postings.',
    },
    'Recruitment analytics': {
        title: 'Recruitment analytics',
        description:
            'A snapshot of your hiring activity in the alumni community.',
        action: 'Export report',
    },
    'Users & roles': {
        title: 'Users & roles',
        description: 'Manage access for the people who support your community.',
        action: 'Invite user',
    },
    'Activity log': {
        title: 'Activity log',
        description: 'A recent record of important updates across the system.',
    },
};

function toastDemo(message: string) {
    toast.info(message);
}

export default function AlumniPortal() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const availableRoles = rolePriority.filter((role) =>
        user?.roles?.includes(roleCodes[role]),
    );
    const [role, setRole] = useState<Role>(() => availableRoles[0] ?? 'Alumni');
    const [activePage, setActivePage] = useState(
        () => navigation[availableRoles[0] ?? 'Alumni'][0].label,
    );
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
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
                  title: `${activePage === 'My dashboard' ? 'Welcome back' : 'Good morning'}, ${profile.name.split(' ')[0]}`,
              }
            : (pageCopy[activePage] ?? pageCopy.Overview);
    const canManageContent = ['Administrator', 'Alumni coordinator'].includes(
        role,
    );
    const hideAction =
        (['Surveys', 'Announcements'].includes(activePage) &&
            !canManageContent) ||
        [
            'Employment tracer',
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

    function changeRole(value: Role) {
        if (!availableRoles.includes(value)) {
            return;
        }

        setRole(value);
        setActivePage(navigation[value][0].label);
        setMobileNavOpen(false);
        setDialogOpen(false);
        setSearch('');
    }

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

    const content = !availableRoles.length ? (
        <section
            role="alert"
            className="rounded-2xl border border-[#e9ebe5] bg-white p-6 text-sm text-[#687267]"
        >
            This account does not have an assigned workspace role. Contact an
            administrator to request access.
        </section>
    ) : isOverview ? (
        <LiveOverview role={role} onNavigate={(page) => setActivePage(page)} />
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
        />
    ) : activePage === 'Employment tracer' ? (
        <EmploymentTracer />
    ) : activePage === 'Career opportunities' ? (
        <PublicJobs />
    ) : activePage === 'My applications' ? (
        <AlumniApplications />
    ) : activePage === 'Applicants' ? (
        <EmployerApplicants />
    ) : activePage === 'Job postings' ? (
        <EmployerJobs
            createOpen={dialogOpen}
            onCloseCreate={() => setDialogOpen(false)}
            onNavigate={(page) => setActivePage(page)}
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
    ) : activePage === 'Activity log' ? (
        <ActivityLog />
    ) : activePage === 'Users & roles' ? (
        <AssignedRoles roleCodes={user.roles ?? []} currentUserId={user.id} />
    ) : activePage === 'Recruitment analytics' ? (
        <LiveOverview role={role} onNavigate={(page) => setActivePage(page)} />
    ) : (
        <section
            role="alert"
            className="rounded-2xl border border-[#e9ebe5] bg-white p-6 text-sm text-[#687267]"
        >
            This workspace module is not available for your assigned role.
        </section>
    );

    return (
        <div className="min-h-screen bg-[#f7f8f5] text-[#29362c]">
            {mobileNavOpen && (
                <button
                    aria-label="Close navigation"
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="fixed inset-0 z-30 bg-[#17241a]/30 md:hidden"
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#e7e9e3] bg-white transition-transform duration-200 md:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex h-16 items-center justify-between border-b border-[#eff0ec] px-4">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="grid size-8 place-items-center rounded-xl bg-[#284c36] text-white">
                            <GraduationCap className="size-[18px]" />
                        </span>
                        <span>
                            <span className="block text-xs font-bold tracking-tight text-[#2c3d30]">
                                Northfield College
                            </span>
                            <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.15em] text-[#849083] uppercase">
                                Alumni portal
                            </span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setMobileNavOpen(false)}
                        className="grid size-8 place-items-center rounded-lg text-[#7f877e] hover:bg-[#f4f5f2] md:hidden"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <div className="px-3 pt-4">
                    <label
                        htmlFor="role-preview"
                        className="mb-1.5 block px-1 text-[9px] font-bold tracking-[0.14em] text-[#9aa097] uppercase"
                    >
                        Workspace role
                    </label>
                    <div className="relative">
                        <select
                            id="role-preview"
                            value={role}
                            onChange={(event) => {
                                const selectedRole = availableRoles.find(
                                    (item) => item === event.target.value,
                                );
                                if (selectedRole) changeRole(selectedRole);
                            }}
                            className="h-9 w-full appearance-none rounded-xl border border-[#e9ebe5] bg-[#fafbf9] pr-9 pl-3 text-xs font-semibold text-[#48564a] outline-none focus:border-[#9eb29e]"
                        >
                            {availableRoles.map((item) => (
                                <option key={item}>{item}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-3 right-3 size-3.5 text-[#80897e]" />
                    </div>
                </div>
                <div className="px-4 pt-4 pb-1.5 text-[9px] font-bold tracking-[0.14em] text-[#9aa097] uppercase">
                    Workspace
                </div>
                <nav
                    aria-label={`${role} navigation`}
                    className="portal-sidebar-nav flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2.5 pb-3"
                >
                    {navItems.map(({ label, icon: Icon }) => {
                        const selected = activePage === label;
                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => {
                                    setActivePage(label);
                                    setMobileNavOpen(false);
                                    setDialogOpen(false);
                                    setSearch('');
                                }}
                                aria-current={selected ? 'page' : undefined}
                                className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium transition ${selected ? 'bg-[#edf2eb] text-[#33583b]' : 'text-[#6e786d] hover:bg-[#f6f7f4] hover:text-[#3e5542]'}`}
                            >
                                <Icon className="size-4 shrink-0" />
                                {label}
                                {label === 'Surveys' && role === 'Alumni' && (
                                    <span className="ml-auto grid size-5 place-items-center rounded-full bg-[#e2eadf] text-[9px] font-bold text-[#4f6b51]">
                                        2
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    <div className="my-3 border-t border-[#eff0ec]" />
                    <button
                        type="button"
                        onClick={() => toastDemo('Help center opened')}
                        className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium text-[#6e786d] hover:bg-[#f6f7f4]"
                    >
                        <CircleHelp className="size-4" /> Help center
                    </button>
                    <button
                        type="button"
                        onClick={() => toastDemo('Settings opened')}
                        className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium text-[#6e786d] hover:bg-[#f6f7f4]"
                    >
                        <Settings2 className="size-4" /> Settings
                    </button>
                </nav>
                <div className="relative border-t border-[#eff0ec] p-2.5">
                    {accountMenuOpen && user && (
                        <div
                            role="menu"
                            aria-label="Account menu"
                            className="absolute right-2 bottom-full z-30 mb-2 min-w-40 rounded-xl border border-[#e9ebe5] bg-white p-1.5 shadow-lg"
                        >
                            <Link
                                href={profileSettings()}
                                role="menuitem"
                                onClick={() => setAccountMenuOpen(false)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#4d5a4f] transition hover:bg-[#f4f6f2]"
                                data-test="workspace-account-settings"
                            >
                                <Settings2 className="size-3.5" />
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
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#8b4e43] transition hover:bg-[#f8f2f0]"
                                    data-test="workspace-logout-button"
                                >
                                    <LogOut className="size-3.5" />
                                    Log out
                                </button>
                            </ConfirmationDialog>
                        </div>
                    )}
                    <div className="flex items-center gap-2 rounded-xl bg-[#f7f8f5] p-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e4ece2] text-[10px] font-bold text-[#49664c]">
                            {profile.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-semibold text-[#435044]">
                                {profile.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-[#858c83]">
                                {profile.context}
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                setAccountMenuOpen((isOpen) => !isOpen)
                            }
                            aria-label="Open account menu"
                            aria-haspopup="menu"
                            aria-expanded={accountMenuOpen}
                            className="grid size-7 place-items-center rounded-lg text-[#818980] hover:bg-white"
                        >
                            <ChevronDown className="size-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            <div className="min-h-screen md:pl-[248px]">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e7e9e3] bg-[#ffffff]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            aria-label="Open navigation"
                            onClick={() => setMobileNavOpen(true)}
                            className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#e9ebe5] bg-white text-[#667166] hover:bg-[#f8f9f6] md:hidden"
                        >
                            <Menu className="size-4" />
                        </button>
                        <div className="hidden items-center gap-2 text-xs text-[#969c94] sm:flex">
                            <span>Workspace</span>
                            <ChevronRight className="size-3" />
                        </div>
                        <span className="truncate text-xs font-semibold text-[#4c584e]">
                            {activePage}
                        </span>
                        <span className="hidden rounded-full bg-[#f0f2ed] px-2 py-1 text-[9px] font-medium text-[#7a8278] lg:inline-flex">
                            {profile.scope}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {[
                            'Administrator',
                            'Alumni coordinator',
                            'Department coordinator',
                        ].includes(role) && (
                            <label className="hidden h-9 w-48 items-center gap-2 rounded-xl border border-[#e8eae4] bg-white px-2.5 lg:flex">
                                <Search className="size-3.5 text-[#929990]" />
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
                                                setActivePage(
                                                    directoryPage.label,
                                                );
                                            }
                                        }
                                    }}
                                    aria-label="Search alumni records"
                                    placeholder="Search anything..."
                                    className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#9ca198]"
                                />
                                <kbd className="rounded border border-[#e8eae4] px-1 py-0.5 text-[9px] text-[#929990]">
                                    ⌘ K
                                </kbd>
                            </label>
                        )}
                        <button
                            type="button"
                            aria-label="Notifications"
                            onClick={() => setNotificationsOpen(true)}
                            className="relative grid size-9 place-items-center rounded-xl border border-[#e8eae4] bg-white text-[#687367] hover:bg-[#f8f9f6]"
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
                                        className="grid size-9 place-items-center rounded-full ring-offset-2 transition hover:ring-2 hover:ring-[#dce6d9] focus-visible:ring-2 focus-visible:ring-[#7e9a7a] focus-visible:outline-none"
                                        data-test="header-account-menu-button"
                                    >
                                        <Avatar className="size-8 overflow-hidden rounded-full bg-[#e4ece2] text-[10px] font-bold text-[#49664c]">
                                            <AvatarImage
                                                src={user.avatar ?? undefined}
                                                alt={user.name}
                                            />
                                            <AvatarFallback className="rounded-full bg-[#e4ece2] text-[10px] font-bold text-[#49664c]">
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

                <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.16em] text-[#829080] uppercase">
                                {role} workspace
                            </p>
                            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-[#2c3c30] sm:text-[28px]">
                                {currentPage.title}
                            </h1>
                            <p className="mt-1.5 text-xs leading-5 text-[#7c847a] sm:text-sm">
                                {currentPage.description}
                            </p>
                        </div>
                        {currentPage.action && (
                            <button
                                type="button"
                                onClick={handleAction}
                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2b5139] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#234530]"
                            >
                                {currentPage.action.startsWith('Export') ? (
                                    <FileSpreadsheet className="size-3.5" />
                                ) : (
                                    <Plus className="size-3.5" />
                                )}
                                {currentPage.action}
                            </button>
                        )}
                    </div>

                    {search && !isOverview && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#dfe8dc] bg-[#f0f5ee] px-3 py-2 text-xs text-[#536c55]">
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

                    {content}

                    <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#e8eae4] pt-4 text-[10px] text-[#929990] sm:flex-row">
                        <span>
                            Northfield College · Alumni Tracer Management System
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-[#8da68a]" />{' '}
                            Alumni management system
                        </span>
                    </footer>
                </main>
            </div>

            <Link
                href="/"
                className="fixed right-4 bottom-4 z-20 inline-flex h-9 items-center gap-2 rounded-full border border-[#e3e7df] bg-white/95 px-3 text-[10px] font-semibold text-[#58665a] shadow-lg backdrop-blur transition hover:bg-white sm:right-6 sm:bottom-5"
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
        </div>
    );
}
