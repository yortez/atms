import { useEffect, useState, type FormEvent } from 'react';
import { DemoQuickLoginToggleCard } from './overview';
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

type UserRoleAssignment = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    roles: string[];
    assigned_program_ids?: number[];
    assigned_programs?: Array<{
        id: number;
        code: string;
        name: string;
    }>;
    alumni_profile_id?: number | null;
    is_verified?: boolean;
    is_suspended: boolean;
    created_at?: string | null;
};

type AdminRoleCatalogItem = {
    id: number;
    name: string;
    label: string;
    permissions: string[];
};

type AdminPermissionCatalogItem = {
    id: number;
    name: string;
    label: string;
};

type AdminProgramCatalogItem = {
    id: number;
    department_id: number;
    code: string;
    name: string;
};

type AdminUsersResponse = {
    data: UserRoleAssignment[];
    meta?: {
        roles_catalog?: AdminRoleCatalogItem[];
        permissions_catalog?: AdminPermissionCatalogItem[];
        programs_catalog?: AdminProgramCatalogItem[];
    };
};

const ADMIN_ROLE_LABELS: Record<string, string> = {
    'system-administrator': 'System administrator',
    'alumni-coordinator': 'Alumni coordinator',
    'department-coordinator': 'Department coordinator',
    alumni: 'Alumni',
    employer: 'Employer',
};

const ADMIN_ROLE_BADGE_CLASSES: Record<string, string> = {
    'system-administrator': 'bg-[#2b5139] text-white',
    'alumni-coordinator': 'bg-[#edf2eb] text-[#2b5139]',
    'department-coordinator': 'bg-[#edf2eb] text-[#2b5139]',
    alumni: 'bg-[#f3f5f1] text-[#4d5a4f]',
    employer: 'bg-[#f3f5f1] text-[#4d5a4f]',
};

const ASSIGNABLE_ROLE_OPTIONS = [
    'alumni-coordinator',
    'department-coordinator',
    'alumni',
    'employer',
] as const;

function RoleCheckboxPills({
    selectedRoles,
    onToggle,
    keyPrefix,
    disabled = false,
}: {
    selectedRoles: string[];
    onToggle: (roleCode: string) => void;
    keyPrefix: string;
    disabled?: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {ASSIGNABLE_ROLE_OPTIONS.map((code) => {
                const checked = selectedRoles.includes(code);
                return (
                    <label
                        key={`${keyPrefix}-${code}`}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${checked
                                ? 'border-[#2b5139] bg-[#edf2eb] text-[#2b5139]'
                                : 'border-[#dfe5dd] bg-white text-[#4d5a4f] hover:bg-[#f8faf7]'
                            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                        <input
                            type="checkbox"
                            disabled={disabled}
                            className="h-3.5 w-3.5 accent-[#2f4f3e]"
                            checked={checked}
                            onChange={() => onToggle(code)}
                        />
                        {ADMIN_ROLE_LABELS[code] ?? code}
                    </label>
                );
            })}
        </div>
    );
}

function ProgramScopeSelector({
    programsCatalog,
    selectedProgramIds,
    onChange,
    disabled = false,
}: {
    programsCatalog: AdminProgramCatalogItem[];
    selectedProgramIds: number[];
    onChange: (nextIds: number[]) => void;
    disabled?: boolean;
}) {
    if (!programsCatalog.length) {
        return null;
    }

    return (
        <fieldset className="rounded-xl border border-[#e2e7df] bg-[#fafbf9] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <legend className="text-[11px] font-semibold text-[#2b5139]">
                    Assigned Academic Programs ({selectedProgramIds.length}{' '}
                    selected)
                </legend>
                <div className="flex items-center gap-2 text-[11px]">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                            onChange(programsCatalog.map((prog) => prog.id))
                        }
                        className="font-semibold text-[#2b5139] hover:underline disabled:opacity-50"
                    >
                        Select all
                    </button>
                    <span className="text-[#cbd2c7]">·</span>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange([])}
                        className="font-medium text-[#687267] hover:underline disabled:opacity-50"
                    >
                        Clear all
                    </button>
                </div>
            </div>
            {selectedProgramIds.length === 0 && (
                <p className="mt-1.5 rounded-lg bg-[#fdf4e7] px-2.5 py-1 text-[10px] font-semibold text-[#9a6728]">
                    No programs assigned — select at least one program to grant
                    Department Coordinator record access.
                </p>
            )}
            <div className="mt-2.5 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
                {programsCatalog.map((prog) => {
                    const active = selectedProgramIds.includes(prog.id);
                    return (
                        <button
                            key={prog.id}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                                onChange(
                                    active
                                        ? selectedProgramIds.filter(
                                            (id) => id !== prog.id,
                                        )
                                        : [...selectedProgramIds, prog.id],
                                )
                            }
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${active
                                    ? 'bg-[#2b5139] text-white'
                                    : 'border border-[#dce2d9] bg-white text-[#4d5a4f] hover:bg-[#edf2eb]'
                                }`}
                        >
                            {prog.code} · {prog.name}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}

export function AssignedRoles({
    roleCodes,
    currentUserId,
}: {
    roleCodes: string[];
    currentUserId: number;
}) {
    const isSystemAdmin = roleCodes.includes('system-administrator');
    const { data, loading, error, reload } =
        useApiResource<AdminUsersResponse>(
            isSystemAdmin ? '/api/admin/users' : null,
        );
    const [activeTab, setActiveTab] = useState<'users' | 'permissions'>(
        'users',
    );
    const [userPage, setUserPage] = useState(1);
    const usersPerPage = 15;

    const [savingRolePermissions, setSavingRolePermissions] = useState<
        Record<number, boolean>
    >({});
    const [managing, setManaging] = useState<Record<number, boolean>>({});
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
        password: '',
        roles: [] as string[],
        assigned_program_ids: [] as number[],
    });

    // Manage User Access Modal State
    const [editingUser, setEditingUser] = useState<UserRoleAssignment | null>(
        null,
    );
    const [editRoles, setEditRoles] = useState<string[]>([]);
    const [editProgramIds, setEditProgramIds] = useState<number[]>([]);
    const [savingAccess, setSavingAccess] = useState(false);

    function openManageUserModal(user: UserRoleAssignment) {
        setEditingUser(user);
        setEditRoles([...user.roles]);
        setEditProgramIds([...(user.assigned_program_ids ?? [])]);
    }

    function closeManageUserModal() {
        if (savingAccess) return;
        setEditingUser(null);
        setEditRoles([]);
        setEditProgramIds([]);
    }

    function closeInviteModal() {
        if (inviting) return;
        setInviteOpen(false);
        setInviteForm({
            name: '',
            email: '',
            password: '',
            roles: [],
            assigned_program_ids: [],
        });
    }

    async function saveUserAccess(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editingUser) return;

        setSavingAccess(true);
        try {
            await apiRequest<ApiEnvelope<UserRoleAssignment>>(
                `/api/admin/users/${editingUser.id}/roles`,
                {
                    method: 'PATCH',
                    body: { roles: editRoles },
                },
            );

            if (editRoles.includes('department-coordinator')) {
                await apiRequest<ApiEnvelope<UserRoleAssignment>>(
                    `/api/admin/users/${editingUser.id}/programs`,
                    {
                        method: 'PATCH',
                        body: { assigned_program_ids: editProgramIds },
                    },
                );
            }

            reload();
            toast.success('User access updated.');
            setEditingUser(null);
            setEditRoles([]);
            setEditProgramIds([]);
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'User access could not be updated.',
            );
        } finally {
            setSavingAccess(false);
        }
    }

    async function toggleRolePermission(
        roleItem: AdminRoleCatalogItem,
        permissionName: string,
    ) {
        const nextPermissions = roleItem.permissions.includes(permissionName)
            ? roleItem.permissions.filter((p) => p !== permissionName)
            : [...roleItem.permissions, permissionName];

        setSavingRolePermissions((current) => ({
            ...current,
            [roleItem.id]: true,
        }));
        try {
            await apiRequest(`/api/admin/roles/${roleItem.id}/permissions`, {
                method: 'PATCH',
                body: { permissions: nextPermissions },
            });
            reload();
            toast.success(`Updated permissions for ${roleItem.label}.`);
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'Role permissions could not be updated.',
            );
        } finally {
            setSavingRolePermissions((current) => ({
                ...current,
                [roleItem.id]: false,
            }));
        }
    }

    async function inviteUser(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setInviting(true);

        try {
            const payload: Record<string, unknown> = {
                name: inviteForm.name,
                email: inviteForm.email,
                roles: inviteForm.roles,
            };
            if (inviteForm.password.trim()) {
                payload.password = inviteForm.password.trim();
            }
            if (
                inviteForm.roles.includes('department-coordinator') &&
                inviteForm.assigned_program_ids.length > 0
            ) {
                payload.assigned_program_ids = inviteForm.assigned_program_ids;
            }

            const response = await apiRequest<{
                data: UserRoleAssignment;
                message?: string;
            }>('/api/admin/users', {
                method: 'POST',
                body: payload,
            });
            setInviteForm({
                name: '',
                email: '',
                password: '',
                roles: [],
                assigned_program_ids: [],
            });
            setInviteOpen(false);
            reload();
            toast.success(response.message ?? 'Invitation sent.');
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'The invitation could not be sent.',
            );
        } finally {
            setInviting(false);
        }
    }

    async function updateUserSuspension(
        user: UserRoleAssignment,
    ): Promise<boolean> {
        setManaging((current) => ({ ...current, [user.id]: true }));

        try {
            await apiRequest<
                ApiEnvelope<{ id: number; is_suspended: boolean }>
            >(`/api/admin/users/${user.id}/suspension`, {
                method: 'PATCH',
                body: { suspended: !user.is_suspended },
            });
            reload();
            toast.success(
                user.is_suspended ? 'User reactivated.' : 'User suspended.',
            );
            return true;
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'The user status could not be updated.',
            );
            return false;
        } finally {
            setManaging((current) => ({ ...current, [user.id]: false }));
        }
    }

    async function deleteUser(user: UserRoleAssignment): Promise<boolean> {
        setManaging((current) => ({ ...current, [user.id]: true }));

        try {
            await apiRequest<ApiEnvelope<never>>(
                `/api/admin/users/${user.id}`,
                { method: 'DELETE' },
            );
            reload();
            toast.success('User deleted.');
            return true;
        } catch (requestError) {
            toast.error(
                requestError instanceof ApiError
                    ? requestError.message
                    : 'The user could not be deleted.',
            );
            return false;
        } finally {
            setManaging((current) => ({ ...current, [user.id]: false }));
        }
    }

    const users = data?.data ?? [];
    const rolesCatalog = data?.meta?.roles_catalog ?? [];
    const permissionsCatalog = data?.meta?.permissions_catalog ?? [];
    const programsCatalog = data?.meta?.programs_catalog ?? [];

    const totalUsers = users.length;
    const staffCount = users.filter((u) =>
        u.roles.some((r) =>
            [
                'system-administrator',
                'alumni-coordinator',
                'department-coordinator',
            ].includes(r),
        ),
    ).length;
    const portalUsersCount = users.filter((u) =>
        u.roles.some((r) => ['alumni', 'employer'].includes(r)),
    ).length;
    const suspendedCount = users.filter((u) => u.is_suspended).length;

    const roleFilterCounts: Record<string, number> = {
        all: totalUsers,
        'system-administrator': users.filter((u) =>
            u.roles.includes('system-administrator'),
        ).length,
        'alumni-coordinator': users.filter((u) =>
            u.roles.includes('alumni-coordinator'),
        ).length,
        'department-coordinator': users.filter((u) =>
            u.roles.includes('department-coordinator'),
        ).length,
        alumni: users.filter((u) => u.roles.includes('alumni')).length,
        employer: users.filter((u) => u.roles.includes('employer')).length,
        suspended: suspendedCount,
    };

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            !normalizedSearch ||
            u.name.toLowerCase().includes(normalizedSearch) ||
            u.email.toLowerCase().includes(normalizedSearch);
        const matchesRole =
            roleFilter === 'all'
                ? true
                : roleFilter === 'suspended'
                    ? u.is_suspended
                    : u.roles.includes(roleFilter);
        return matchesSearch && matchesRole;
    });

    const totalUserPages = Math.max(
        1,
        Math.ceil(filteredUsers.length / usersPerPage),
    );
    const safeUserPage = Math.min(userPage, totalUserPages);
    const pageStart = (safeUserPage - 1) * usersPerPage;
    const paginatedUsers = filteredUsers.slice(
        pageStart,
        pageStart + usersPerPage,
    );
    const pageEnd = Math.min(
        pageStart + paginatedUsers.length,
        filteredUsers.length,
    );

    const accountRolesCard = (
        <section className="min-w-0 rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
            <div>
                <h2 className="text-sm font-semibold tracking-tight text-[#29382e]">
                    Roles assigned to your account
                </h2>
                <p className="mt-0.5 text-xs text-[#7a8278]">
                    Active permissions and institutional scopes linked to your
                    credentials.
                </p>
            </div>
            {roleCodes.length ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                    {roleCodes.map((code) => (
                        <li
                            key={code}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium ${ADMIN_ROLE_BADGE_CLASSES[code] ?? 'bg-[#edf2eb] text-[#45664a]'}`}
                        >
                            {ADMIN_ROLE_LABELS[code] ?? code}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-xs text-[#7a8278]">
                    No roles are currently assigned.
                </p>
            )}
        </section>
    );

    if (!isSystemAdmin) {
        return <div className="space-y-4">{accountRolesCard}</div>;
    }

    return (
        <div className="space-y-4">
            {/* Top Summary Strip */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: 'Total Users',
                        value: totalUsers,
                        hint: 'Registered workspace accounts',
                    },
                    {
                        label: 'Admins & Coordinators',
                        value: staffCount,
                        hint: 'Institutional governance & staff',
                    },
                    {
                        label: 'Alumni & Employers',
                        value: portalUsersCount,
                        hint: 'Portal graduate & partner accounts',
                    },
                    {
                        label: 'Suspended',
                        value: suspendedCount,
                        hint: 'Accounts with sign-in disabled',
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-2xl border border-[#e9ebe5] bg-white px-4 py-3.5"
                    >
                        <p className="text-[11px] font-medium text-[#7a8278]">
                            {stat.label}
                        </p>
                        <p className="mt-1 text-xl font-semibold tracking-tight text-[#29382e]">
                            {loading ? '—' : stat.value.toLocaleString()}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#92978f]">
                            {stat.hint}
                        </p>
                    </div>
                ))}
            </div>

            {/* Tab Navigation & Primary Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:px-5">
                <div className="flex flex-wrap items-center rounded-xl bg-[#f3f5f1] p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('users')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'users'
                                ? 'bg-white text-[#2b5139] shadow-2xs'
                                : 'text-[#626c61] hover:text-[#29382e]'
                            }`}
                    >
                        Users & Access ({users.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('permissions')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'permissions'
                                ? 'bg-white text-[#2b5139] shadow-2xs'
                                : 'text-[#626c61] hover:text-[#29382e]'
                            }`}
                    >
                        Role Permissions & Settings
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2b5139] px-3.5 text-xs font-semibold text-white transition hover:bg-[#22422d]"
                >
                    <UserPlus className="h-3.5 w-3.5" />
                    + Invite user
                </button>
            </div>

            {activeTab === 'users' ? (
                <section className="space-y-4">
                    {/* Search & Role Filter Bar */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <input
                            type="search"
                            aria-label="Search users"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setUserPage(1);
                            }}
                            placeholder="Search users by name or email…"
                            className="h-9 w-full rounded-xl border border-[#dfe5dd] bg-[#fafbf9] px-3 text-xs text-[#29382e] outline-none focus:border-[#6d8b72] sm:max-w-xs"
                        />
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                ['all', 'All'],
                                ['system-administrator', 'Admins'],
                                ['alumni-coordinator', 'Alumni Coord.'],
                                ['department-coordinator', 'Dept. Coord.'],
                                ['alumni', 'Alumni'],
                                ['employer', 'Employers'],
                                ['suspended', 'Suspended'],
                            ].map(([code, label]) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => {
                                        setRoleFilter(code);
                                        setUserPage(1);
                                    }}
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${roleFilter === code
                                            ? 'bg-[#2b5139] text-white'
                                            : 'border border-[#e2e7df] bg-[#fafbf9] text-[#5e6a5f] hover:bg-[#eff2ed]'
                                        }`}
                                >
                                    {label} ({roleFilterCounts[code] ?? 0})
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <ErrorState message={error} />
                    ) : filteredUsers.length ? (
                        <div className="overflow-hidden rounded-2xl border border-[#e9ebe5] bg-white">
                            <div className="relative overflow-x-auto">
                                <table className="w-full min-w-[780px] text-left">
                                    <thead>
                                        <tr className="border-b border-[#eff0ec] bg-[#fafbf9] text-[10px] font-semibold tracking-wide text-[#848a81] uppercase">
                                            <th className="px-4 py-3 sm:px-5">
                                                User
                                            </th>
                                            <th className="px-4 py-3">
                                                Assigned Roles
                                            </th>
                                            <th className="px-4 py-3">
                                                Program Scope
                                            </th>
                                            <th className="px-4 py-3">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right sm:px-5">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0f1ed]">
                                        {paginatedUsers.map((user) => {
                                            const isProtected =
                                                user.roles.includes(
                                                    'system-administrator',
                                                );
                                            const canManage =
                                                !isProtected &&
                                                user.id !== currentUserId;
                                            const isDeptCoordinator =
                                                user.roles.includes(
                                                    'department-coordinator',
                                                );
                                            const hasGlobalScope =
                                                user.roles.includes(
                                                    'system-administrator',
                                                ) ||
                                                user.roles.includes(
                                                    'alumni-coordinator',
                                                );
                                            const assignedPrograms =
                                                user.assigned_programs
                                                    ?.length
                                                    ? user.assigned_programs
                                                    : programsCatalog.filter(
                                                        (prog) =>
                                                            (
                                                                user.assigned_program_ids ??
                                                                []
                                                            ).includes(
                                                                prog.id,
                                                            ),
                                                    );

                                            return (
                                                <tr
                                                    key={user.id}
                                                    className="text-xs text-[#5f685f] hover:bg-[#fcfcfa]"
                                                >
                                                    <td className="px-4 py-3.5 sm:px-5">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-[#001c17]/10">
                                                                <AvatarImage
                                                                    src={
                                                                        user.avatar ??
                                                                        undefined
                                                                    }
                                                                    alt={
                                                                        user.name
                                                                    }
                                                                    className="object-cover"
                                                                />
                                                                <AvatarFallback className="rounded-full bg-[#e9eee5] text-[10px] font-bold text-[#45634a]">
                                                                    {initials(
                                                                        user.name,
                                                                    )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <p className="font-semibold text-[#39463b]">
                                                                        {
                                                                            user.name
                                                                        }
                                                                    </p>
                                                                    {user.id ===
                                                                        currentUserId && (
                                                                            <span className="rounded-full bg-[#edf2eb] px-2 py-0.5 text-[10px] font-semibold text-[#2b5139]">
                                                                                You
                                                                            </span>
                                                                        )}
                                                                    {user.alumni_profile_id && (
                                                                        <span className="rounded-full bg-[#f0f3ee] px-2 py-0.5 text-[10px] font-medium text-[#4d6250]">
                                                                            Alumni
                                                                            #
                                                                            {
                                                                                user.alumni_profile_id
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="mt-0.5 text-[11px] text-[#838a81]">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {user.roles.length ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {user.roles.map(
                                                                    (code) => (
                                                                        <span
                                                                            key={`${user.id}-${code}`}
                                                                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${ADMIN_ROLE_BADGE_CLASSES[code] ?? 'bg-[#f3f5f1] text-[#4d5a4f]'}`}
                                                                        >
                                                                            {ADMIN_ROLE_LABELS[
                                                                                code
                                                                            ] ??
                                                                                code}
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-[#92978f]">
                                                                No roles
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {hasGlobalScope ? (
                                                            <span className="rounded-full bg-[#f3f5f1] px-2.5 py-0.5 text-[10px] font-medium text-[#5c685d]">
                                                                All programs
                                                            </span>
                                                        ) : isDeptCoordinator ? (
                                                            assignedPrograms.length >
                                                                0 ? (
                                                                <div className="flex flex-wrap items-center gap-1">
                                                                    {assignedPrograms
                                                                        .slice(
                                                                            0,
                                                                            3,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                prog,
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        prog.id
                                                                                    }
                                                                                    title={
                                                                                        prog.name
                                                                                    }
                                                                                    className="rounded bg-[#edf2eb] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#2b5139] uppercase"
                                                                                >
                                                                                    {
                                                                                        prog.code
                                                                                    }
                                                                                </span>
                                                                            ),
                                                                        )}
                                                                    {assignedPrograms.length >
                                                                        3 && (
                                                                            <span
                                                                                title={assignedPrograms
                                                                                    .slice(
                                                                                        3,
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            p,
                                                                                        ) =>
                                                                                            `${p.code} · ${p.name}`,
                                                                                    )
                                                                                    .join(
                                                                                        ', ',
                                                                                    )}
                                                                                className="rounded-full bg-[#f0f3ee] px-1.5 py-0.5 text-[10px] font-semibold text-[#4d5a4f]"
                                                                            >
                                                                                +
                                                                                {assignedPrograms.length -
                                                                                    3}
                                                                            </span>
                                                                        )}
                                                                </div>
                                                            ) : (
                                                                <span className="rounded-full bg-[#fdf4e7] px-2.5 py-0.5 text-[10px] font-semibold text-[#9a6728]">
                                                                    No programs
                                                                    assigned
                                                                </span>
                                                            )
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            {user.is_suspended ? (
                                                                <span className="rounded-full bg-[#f7e9e5] px-2.5 py-0.5 text-[10px] font-semibold text-[#8b4e43]">
                                                                    Suspended
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full bg-[#e3eee0] px-2.5 py-0.5 text-[10px] font-medium text-[#2f5a37]">
                                                                    Active
                                                                </span>
                                                            )}
                                                            {user.is_verified && (
                                                                <span className="rounded-full bg-[#eef2ec] px-2 py-0.5 text-[10px] font-medium text-[#4d6250]">
                                                                    Verified
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right sm:px-5">
                                                        {isProtected ? (
                                                            <span className="text-[11px] font-medium text-[#8a9288]">
                                                                Protected admin
                                                            </span>
                                                        ) : (
                                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        !canManage ||
                                                                        managing[
                                                                        user
                                                                            .id
                                                                        ]
                                                                    }
                                                                    onClick={() =>
                                                                        openManageUserModal(
                                                                            user,
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-[#d2ddd0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2c5339] transition hover:bg-[#edf2ea] disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Manage
                                                                    access
                                                                </button>
                                                                <ConfirmationDialog
                                                                    title={
                                                                        user.is_suspended
                                                                            ? 'Reactivate user?'
                                                                            : 'Suspend user?'
                                                                    }
                                                                    description={
                                                                        user.is_suspended
                                                                            ? `Reactivate ${user.name}'s account? They will be able to sign in and use the application again.`
                                                                            : `Suspend ${user.name}'s account? They will be signed out and unable to sign in or use the application until reactivated.`
                                                                    }
                                                                    confirmLabel={
                                                                        user.is_suspended
                                                                            ? 'Reactivate user'
                                                                            : 'Suspend user'
                                                                    }
                                                                    pendingLabel={
                                                                        user.is_suspended
                                                                            ? 'Reactivating…'
                                                                            : 'Suspending…'
                                                                    }
                                                                    variant={
                                                                        user.is_suspended
                                                                            ? 'default'
                                                                            : 'destructive'
                                                                    }
                                                                    onConfirm={() =>
                                                                        updateUserSuspension(
                                                                            user,
                                                                        )
                                                                    }
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            !canManage ||
                                                                            managing[
                                                                            user
                                                                                .id
                                                                            ]
                                                                        }
                                                                        className="rounded-lg border border-[#dfe5dd] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#4d5a4f] transition hover:bg-[#f6f7f4] disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        {user.is_suspended
                                                                            ? 'Reactivate'
                                                                            : 'Suspend'}
                                                                    </button>
                                                                </ConfirmationDialog>
                                                                <ConfirmationDialog
                                                                    title="Delete user?"
                                                                    description={`Delete ${user.name}'s account? They will lose access, and their account will be archived.`}
                                                                    onConfirm={() =>
                                                                        deleteUser(
                                                                            user,
                                                                        )
                                                                    }
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            !canManage ||
                                                                            managing[
                                                                            user
                                                                                .id
                                                                            ]
                                                                        }
                                                                        className="rounded-lg border border-[#ecd8d2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#8b4e43] transition hover:bg-[#fdf6f5] disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </ConfirmationDialog>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex flex-col gap-2.5 border-t border-[#eff0ec] px-4 py-3 text-[11px] text-[#838980] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <span>
                                    Showing {pageStart + 1}–{pageEnd} of{' '}
                                    {filteredUsers.length} users
                                </span>
                                <div className="flex items-center justify-between gap-2 sm:justify-end">
                                    <button
                                        type="button"
                                        disabled={safeUserPage <= 1}
                                        onClick={() =>
                                            setUserPage((current) =>
                                                Math.max(1, current - 1),
                                            )
                                        }
                                        className="rounded-lg border border-[#e8eae4] px-2.5 py-1 disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <span>
                                        Page {safeUserPage} of {totalUserPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={
                                            safeUserPage >= totalUserPages
                                        }
                                        onClick={() =>
                                            setUserPage((current) =>
                                                Math.min(
                                                    totalUserPages,
                                                    current + 1,
                                                ),
                                            )
                                        }
                                        className="rounded-lg border border-[#e8eae4] px-2.5 py-1 disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EmptyState>
                            No users match your current filter.
                        </EmptyState>
                    )}
                </section>
            ) : (
                <div className="space-y-4">
                    {accountRolesCard}

                    {/* Granular Role Permissions Matrix */}
                    <section className="min-w-0 rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold tracking-tight text-[#29382e]">
                                Role Permissions Matrix
                            </h3>
                            <p className="mt-0.5 text-xs text-[#6b7669]">
                                Grant or restrict granular capabilities per role
                                (e.g., allowing Department Coordinators to edit
                                alumni records or manage surveys within their
                                assigned programs).
                            </p>
                        </div>

                        {loading ? (
                            <LoadingState />
                        ) : error ? (
                            <ErrorState message={error} />
                        ) : rolesCatalog.length > 0 ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {rolesCatalog
                                    .filter(
                                        (r) =>
                                            r.name === 'alumni-coordinator' ||
                                            r.name ===
                                            'department-coordinator',
                                    )
                                    .map((roleItem) => (
                                        <div
                                            key={roleItem.id}
                                            className="rounded-xl border border-[#e3e8e0] bg-[#fafbf9] p-4"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-[#29382e]">
                                                    {roleItem.label}
                                                </span>
                                                <span className="rounded-full bg-[#edf2eb] px-2.5 py-0.5 text-[10px] font-semibold text-[#2b5139]">
                                                    {
                                                        roleItem.permissions
                                                            .length
                                                    }{' '}
                                                    permissions
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {permissionsCatalog.map(
                                                    (perm) => {
                                                        const active =
                                                            roleItem.permissions.includes(
                                                                perm.name,
                                                            );
                                                        return (
                                                            <button
                                                                key={perm.name}
                                                                type="button"
                                                                disabled={
                                                                    savingRolePermissions[
                                                                    roleItem
                                                                        .id
                                                                    ]
                                                                }
                                                                onClick={() =>
                                                                    void toggleRolePermission(
                                                                        roleItem,
                                                                        perm.name,
                                                                    )
                                                                }
                                                                title={
                                                                    perm.label
                                                                }
                                                                className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${active
                                                                        ? 'bg-[#2b5139] text-white'
                                                                        : 'border border-[#dce2d9] bg-white text-[#5c685d] hover:bg-[#eff2ed]'
                                                                    }`}
                                                            >
                                                                {perm.label}
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <EmptyState>
                                No configurable roles found.
                            </EmptyState>
                        )}
                    </section>

                    <DemoQuickLoginToggleCard />
                </div>
            )}

            <p className="text-xs leading-5 text-[#7a8278]">
                Role and permission changes are managed by an administrator and
                recorded in the system activity log.
            </p>

            {/* Invite / Create User Modal */}
            {inviteOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={closeInviteModal}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Invite or Create User"
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-2xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-[#eff0ec] pb-3.5">
                            <div>
                                <h3 className="text-sm font-semibold text-[#29382e]">
                                    Invite or Create User
                                </h3>
                                <p className="mt-0.5 text-xs text-[#7a8278]">
                                    Assign institutional roles and send a setup
                                    link or create an initial password.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeInviteModal}
                                aria-label="Close modal"
                                className="rounded-lg p-1.5 text-[#7a8278] transition hover:bg-[#f2f4f0] hover:text-[#29382e]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={inviteUser} className="mt-4 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="space-y-1.5 text-xs font-medium text-[#4d5a4f]">
                                    Name
                                    <input
                                        required
                                        maxLength={255}
                                        value={inviteForm.name}
                                        onChange={(event) =>
                                            setInviteForm((form) => ({
                                                ...form,
                                                name: event.target.value,
                                            }))
                                        }
                                        placeholder="e.g., Maria Santos"
                                        className="h-10 w-full rounded-xl border border-[#dfe5dd] bg-white px-3 text-xs font-normal text-[#29382e] outline-none focus:border-[#6d8b72]"
                                        autoComplete="name"
                                    />
                                </label>
                                <label className="space-y-1.5 text-xs font-medium text-[#4d5a4f]">
                                    Email
                                    <input
                                        required
                                        type="email"
                                        maxLength={255}
                                        value={inviteForm.email}
                                        onChange={(event) =>
                                            setInviteForm((form) => ({
                                                ...form,
                                                email: event.target.value,
                                            }))
                                        }
                                        placeholder="name@seait.edu.ph"
                                        className="h-10 w-full rounded-xl border border-[#dfe5dd] bg-white px-3 text-xs font-normal text-[#29382e] outline-none focus:border-[#6d8b72]"
                                        autoComplete="email"
                                    />
                                </label>
                                <label className="space-y-1.5 text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                                    Initial password (optional)
                                    <input
                                        type="password"
                                        minLength={8}
                                        maxLength={255}
                                        value={inviteForm.password}
                                        onChange={(event) =>
                                            setInviteForm((form) => ({
                                                ...form,
                                                password: event.target.value,
                                            }))
                                        }
                                        placeholder="Leave blank to email setup link"
                                        className="h-10 w-full rounded-xl border border-[#dfe5dd] bg-white px-3 text-xs font-normal text-[#29382e] outline-none focus:border-[#6d8b72]"
                                    />
                                </label>
                            </div>

                            <fieldset>
                                <legend className="mb-2 text-xs font-medium text-[#4d5a4f]">
                                    Assign roles
                                </legend>
                                <RoleCheckboxPills
                                    keyPrefix="invite"
                                    selectedRoles={inviteForm.roles}
                                    disabled={inviting}
                                    onToggle={(code) =>
                                        setInviteForm((form) => ({
                                            ...form,
                                            roles: form.roles.includes(code)
                                                ? form.roles.filter(
                                                    (role) => role !== code,
                                                )
                                                : [...form.roles, code],
                                        }))
                                    }
                                />
                            </fieldset>

                            {inviteForm.roles.includes(
                                'department-coordinator',
                            ) && (
                                    <ProgramScopeSelector
                                        programsCatalog={programsCatalog}
                                        selectedProgramIds={
                                            inviteForm.assigned_program_ids
                                        }
                                        disabled={inviting}
                                        onChange={(nextIds) =>
                                            setInviteForm((form) => ({
                                                ...form,
                                                assigned_program_ids: nextIds,
                                            }))
                                        }
                                    />
                                )}

                            <div className="flex items-center justify-end gap-2 border-t border-[#eff0ec] pt-3">
                                <button
                                    type="button"
                                    onClick={closeInviteModal}
                                    className="h-9 rounded-lg border border-[#dfe5dd] bg-white px-3 text-xs font-medium text-[#687267] hover:bg-[#f6f7f4]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        inviting || !inviteForm.roles.length
                                    }
                                    className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white transition hover:bg-[#22422d] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {inviting
                                        ? 'Saving…'
                                        : inviteForm.password.trim()
                                            ? 'Create user account'
                                            : 'Send invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage User Access & Program Scope Modal */}
            {editingUser !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={closeManageUserModal}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Manage access for ${editingUser.name}`}
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-2xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-[#eff0ec] pb-3.5">
                            <div>
                                <h3 className="text-sm font-semibold text-[#29382e]">
                                    Manage Access — {editingUser.name}
                                </h3>
                                <p className="mt-0.5 text-xs text-[#7a8278]">
                                    {editingUser.email}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeManageUserModal}
                                aria-label="Close modal"
                                className="rounded-lg p-1.5 text-[#7a8278] transition hover:bg-[#f2f4f0] hover:text-[#29382e]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={saveUserAccess}
                            className="mt-4 space-y-4"
                        >
                            <fieldset>
                                <legend className="mb-2 text-xs font-medium text-[#4d5a4f]">
                                    Assigned roles
                                </legend>
                                <RoleCheckboxPills
                                    keyPrefix={`manage-${editingUser.id}`}
                                    selectedRoles={editRoles}
                                    disabled={savingAccess}
                                    onToggle={(code) =>
                                        setEditRoles((current) =>
                                            current.includes(code)
                                                ? current.filter(
                                                    (role) => role !== code,
                                                )
                                                : [...current, code],
                                        )
                                    }
                                />
                            </fieldset>

                            {editRoles.includes('department-coordinator') && (
                                <ProgramScopeSelector
                                    programsCatalog={programsCatalog}
                                    selectedProgramIds={editProgramIds}
                                    disabled={savingAccess}
                                    onChange={setEditProgramIds}
                                />
                            )}

                            <div className="flex items-center justify-end gap-2 border-t border-[#eff0ec] pt-3">
                                <button
                                    type="button"
                                    onClick={closeManageUserModal}
                                    className="h-9 rounded-lg border border-[#dfe5dd] bg-white px-3 text-xs font-medium text-[#687267] hover:bg-[#f6f7f4]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingAccess}
                                    className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white transition hover:bg-[#22422d] disabled:opacity-60"
                                >
                                    {savingAccess ? 'Saving…' : 'Save access'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
