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

export function AcademicCatalog({
    createOpen,
    onCloseCreate,
}: {
    createOpen: boolean;
    onCloseCreate: () => void;
}) {
    const programsRes =
        useApiResource<ApiEnvelope<AcademicProgram[]>>('/api/programs');
    const departmentsRes =
        useApiResource<ApiEnvelope<AcademicDepartment[]>>('/api/departments');

    const [viewMode, setViewMode] = useState<'modular' | 'grid'>('modular');
    const [selectedDepartmentFilter, setSelectedDepartmentFilter] =
        useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Department Form State (Create / Edit)
    const [departmentFormOpen, setDepartmentFormOpen] = useState(false);
    const [editingDepartmentId, setEditingDepartmentId] = useState<
        number | null
    >(null);
    const [departmentForm, setDepartmentForm] = useState({
        code: '',
        name: '',
        description: '',
    });
    const [departmentLogoFile, setDepartmentLogoFile] = useState<File | null>(
        null,
    );
    const [departmentLogoPreview, setDepartmentLogoPreview] = useState<
        string | null
    >(null);
    const [removeDepartmentLogo, setRemoveDepartmentLogo] = useState(false);
    const [savingDepartment, setSavingDepartment] = useState(false);

    // Program Form State (Create / Edit)
    const [programFormOpen, setProgramFormOpen] = useState(false);
    const [editingProgramId, setEditingProgramId] = useState<number | null>(
        null,
    );
    const [createNewDeptInline, setCreateNewDeptInline] = useState(false);
    const [inlineDeptForm, setInlineDeptForm] = useState({
        code: '',
        name: '',
        description: '',
    });
    const [form, setForm] = useState({
        department_id: '',
        code: '',
        name: '',
        description: '',
    });
    const [creating, setCreating] = useState(false);

    const isProgramModalActive = createOpen || programFormOpen;

    function reloadAll() {
        programsRes.reload();
        departmentsRes.reload();
    }

    function clearDepartmentLogoPreview(previewUrl: string | null) {
        if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
    }

    function openCreateDepartment() {
        clearDepartmentLogoPreview(departmentLogoPreview);
        setEditingDepartmentId(null);
        setDepartmentForm({ code: '', name: '', description: '' });
        setDepartmentLogoFile(null);
        setDepartmentLogoPreview(null);
        setRemoveDepartmentLogo(false);
        setDepartmentFormOpen(true);
    }

    function openEditDepartment(dept: AcademicDepartment) {
        clearDepartmentLogoPreview(departmentLogoPreview);
        setEditingDepartmentId(dept.id);
        setDepartmentForm({
            code: dept.code,
            name: dept.name,
            description: dept.description ?? '',
        });
        setDepartmentLogoFile(null);
        setDepartmentLogoPreview(dept.logo ?? null);
        setRemoveDepartmentLogo(false);
        setDepartmentFormOpen(true);
    }

    function closeDepartmentForm() {
        clearDepartmentLogoPreview(departmentLogoPreview);
        setDepartmentForm({ code: '', name: '', description: '' });
        setDepartmentLogoFile(null);
        setDepartmentLogoPreview(null);
        setRemoveDepartmentLogo(false);
        setEditingDepartmentId(null);
        setDepartmentFormOpen(false);
    }

    function openAddProgramForDepartment(deptId?: number) {
        setEditingProgramId(null);
        setCreateNewDeptInline(false);
        setForm({
            department_id: deptId ? String(deptId) : '',
            code: '',
            name: '',
            description: '',
        });
        setProgramFormOpen(true);
    }

    function openEditProgram(prog: AcademicProgram) {
        setEditingProgramId(prog.id);
        setCreateNewDeptInline(false);
        setForm({
            department_id: String(prog.department_id),
            code: prog.code,
            name: prog.name,
            description: prog.description ?? '',
        });
        setProgramFormOpen(true);
    }

    function closeProgramForm() {
        setForm({
            department_id: '',
            code: '',
            name: '',
            description: '',
        });
        setInlineDeptForm({ code: '', name: '', description: '' });
        setProgramFormOpen(false);
        setEditingProgramId(null);
        setCreateNewDeptInline(false);
        onCloseCreate();
    }

    async function saveDepartment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSavingDepartment(true);
        try {
            const formData = new FormData();
            formData.append('code', departmentForm.code);
            formData.append('name', departmentForm.name);
            formData.append('description', departmentForm.description);

            if (departmentLogoFile) {
                formData.append('logo', departmentLogoFile);
            } else if (removeDepartmentLogo) {
                formData.append('remove_logo', '1');
            }

            if (editingDepartmentId !== null) {
                formData.append('_method', 'PATCH');
                await apiRequest<ApiEnvelope<AcademicDepartment>>(
                    `/api/departments/${editingDepartmentId}`,
                    {
                        method: 'POST',
                        body: formData,
                    },
                );
                toast.success('Department updated.');
            } else {
                await apiRequest<ApiEnvelope<AcademicDepartment>>(
                    '/api/departments',
                    {
                        method: 'POST',
                        body: formData,
                    },
                );
                toast.success('Department created.');
            }
            closeDepartmentForm();
            reloadAll();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Department could not be saved.',
            );
        } finally {
            setSavingDepartment(false);
        }
    }

    async function createProgram(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);
        try {
            let targetDeptId = form.department_id;

            if (createNewDeptInline) {
                const newDeptRes = await apiRequest<
                    ApiEnvelope<AcademicDepartment>
                >('/api/departments', {
                    method: 'POST',
                    body: {
                        code: inlineDeptForm.code,
                        name: inlineDeptForm.name,
                        description: inlineDeptForm.description || null,
                    },
                });
                targetDeptId = String(newDeptRes.data.id);
            }

            if (editingProgramId !== null) {
                await apiRequest<ApiEnvelope<AcademicProgram>>(
                    `/api/programs/${editingProgramId}`,
                    {
                        method: 'PATCH',
                        body: {
                            department_id: Number(targetDeptId),
                            code: form.code,
                            name: form.name,
                            description: form.description || null,
                        },
                    },
                );
                toast.success('Academic program updated.');
            } else {
                await apiRequest<ApiEnvelope<AcademicProgram>>(
                    `/api/departments/${targetDeptId}/programs`,
                    {
                        method: 'POST',
                        body: {
                            code: form.code,
                            name: form.name,
                            description: form.description || null,
                        },
                    },
                );
                toast.success('Academic program created.');
            }

            closeProgramForm();
            reloadAll();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Academic program could not be saved.',
            );
        } finally {
            setCreating(false);
        }
    }

    if (programsRes.loading || departmentsRes.loading) {
        return <LoadingState />;
    }

    if (programsRes.error) {
        return <ErrorState message={programsRes.error} />;
    }

    const departmentsList = departmentsRes.data?.data ?? [];
    const programsList = programsRes.data?.data ?? [];

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredDepartments = departmentsList.filter((dept) => {
        if (
            selectedDepartmentFilter !== 'all' &&
            String(dept.id) !== selectedDepartmentFilter
        ) {
            return false;
        }
        if (!normalizedQuery) return true;
        const deptMatches =
            dept.code.toLowerCase().includes(normalizedQuery) ||
            dept.name.toLowerCase().includes(normalizedQuery);
        const progMatches = programsList
            .filter((p) => p.department_id === dept.id)
            .some(
                (p) =>
                    p.code.toLowerCase().includes(normalizedQuery) ||
                    p.name.toLowerCase().includes(normalizedQuery),
            );
        return deptMatches || progMatches;
    });

    const filteredPrograms = programsList.filter((prog) => {
        if (
            selectedDepartmentFilter !== 'all' &&
            String(prog.department_id) !== selectedDepartmentFilter
        ) {
            return false;
        }
        if (!normalizedQuery) return true;
        return (
            prog.code.toLowerCase().includes(normalizedQuery) ||
            prog.name.toLowerCase().includes(normalizedQuery) ||
            (prog.department?.name.toLowerCase().includes(normalizedQuery) ??
                false)
        );
    });

    return (
        <div className="space-y-4">
            {/* Top Modular Action & Filter Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#edf2eb] px-3 py-1 text-xs font-semibold text-[#2b5139]">
                            {departmentsList.length}{' '}
                            {departmentsList.length === 1
                                ? 'Department'
                                : 'Departments'}
                        </span>
                        <span className="rounded-full bg-[#f3f5f1] px-3 py-1 text-xs font-semibold text-[#4d5a4f]">
                            {programsList.length}{' '}
                            {programsList.length === 1
                                ? 'Academic Program'
                                : 'Academic Programs'}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-lg bg-[#f3f5f1] p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode('modular')}
                                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${viewMode === 'modular'
                                    ? 'bg-white text-[#2b5139] shadow-2xs'
                                    : 'text-[#626c61] hover:text-[#29382e]'
                                    }`}
                            >
                                Modular by Department
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${viewMode === 'grid'
                                    ? 'bg-white text-[#2b5139] shadow-2xs'
                                    : 'text-[#626c61] hover:text-[#29382e]'
                                    }`}
                            >
                                All Programs Grid
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateDepartment}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#cfe0cc] bg-[#edf2eb] px-3.5 text-xs font-semibold text-[#2b5139] transition hover:bg-[#e1ebe0]"
                        >
                            + Create department
                        </button>
                        <button
                            type="button"
                            onClick={() => openAddProgramForDepartment()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2b5139] px-3.5 text-xs font-semibold text-white transition hover:bg-[#22422d]"
                        >
                            + Add program
                        </button>
                    </div>
                </div>

                {/* Search & Department Filter Pills */}
                <div className="flex flex-col gap-2.5 border-t border-[#eff0ec] pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search departments, program codes, or titles…"
                        className="h-9 w-full rounded-xl border border-[#dfe5dd] bg-[#fafbf9] px-3 text-xs text-[#29382e] outline-none focus:border-[#6d8b72] sm:max-w-xs"
                    />
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSelectedDepartmentFilter('all')}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${selectedDepartmentFilter === 'all'
                                ? 'bg-[#2b5139] text-white'
                                : 'border border-[#e2e7df] bg-[#fafbf9] text-[#5e6a5f] hover:bg-[#eff2ed]'
                                }`}
                        >
                            All Departments ({departmentsList.length})
                        </button>
                        {departmentsList.map((dept) => {
                            const count = programsList.filter(
                                (p) => p.department_id === dept.id,
                            ).length;
                            const active =
                                selectedDepartmentFilter === String(dept.id);
                            return (
                                <button
                                    key={dept.id}
                                    type="button"
                                    onClick={() =>
                                        setSelectedDepartmentFilter(
                                            active ? 'all' : String(dept.id),
                                        )
                                    }
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${active
                                        ? 'bg-[#2b5139] text-white'
                                        : 'border border-[#e2e7df] bg-[#fafbf9] text-[#5e6a5f] hover:bg-[#eff2ed]'
                                        }`}
                                >
                                    {dept.code} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Create / Edit Department Modal */}
            {departmentFormOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={closeDepartmentForm}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={
                            editingDepartmentId !== null
                                ? 'Edit Academic Department / College'
                                : 'Create New Academic Department / College'
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-2xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-[#eff0ec] pb-3.5">
                            <div>
                                <h3 className="text-sm font-semibold text-[#29382e]">
                                    {editingDepartmentId !== null
                                        ? 'Edit Academic Department / College'
                                        : 'Create New Academic Department / College'}
                                </h3>
                                <p className="mt-0.5 text-xs text-[#6f786e]">
                                    Departments group related academic programs
                                    and cohort reports.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeDepartmentForm}
                                aria-label="Close modal"
                                className="rounded-lg p-1.5 text-[#7a8278] transition hover:bg-[#f2f4f0] hover:text-[#29382e]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={saveDepartment} className="mt-4 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <label className="text-xs font-medium text-[#4d5a4f]">
                                    Department code
                                    <input
                                        required
                                        maxLength={32}
                                        value={departmentForm.code}
                                        onChange={(e) =>
                                            setDepartmentForm({
                                                ...departmentForm,
                                                code: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., CCS, CBA, COE"
                                        className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d9] bg-white px-3 text-xs uppercase"
                                    />
                                </label>
                                <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                                    Department / College name
                                    <input
                                        required
                                        maxLength={160}
                                        value={departmentForm.name}
                                        onChange={(e) =>
                                            setDepartmentForm({
                                                ...departmentForm,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., College of Computing Studies"
                                        className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d9] bg-white px-3 text-xs"
                                    />
                                </label>
                                <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-3">
                                    Description (optional)
                                    <input
                                        maxLength={500}
                                        value={departmentForm.description}
                                        onChange={(e) =>
                                            setDepartmentForm({
                                                ...departmentForm,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Brief overview of the college or academic department…"
                                        className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d9] bg-white px-3 text-xs"
                                    />
                                </label>
                                <div className="sm:col-span-3">
                                    <span className="block text-xs font-medium text-[#4d5a4f]">
                                        Department logo (optional)
                                    </span>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-xl border border-[#dce2d9] bg-[#fafbf9] p-3">
                                        {departmentLogoPreview ? (
                                            <img
                                                src={departmentLogoPreview}
                                                alt="Department logo preview"
                                                className="size-12 shrink-0 rounded-xl border border-[#dce2d9] object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#cfd8cc] bg-white text-[10px] font-bold tracking-wide text-[#5e6a5f] uppercase">
                                                {departmentForm.code
                                                    .trim()
                                                    .slice(0, 5) || 'LOGO'}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={(e) => {
                                                    const file =
                                                        e.target.files?.[0] ??
                                                        null;
                                                    clearDepartmentLogoPreview(
                                                        departmentLogoPreview,
                                                    );
                                                    setDepartmentLogoFile(file);
                                                    if (file) {
                                                        setDepartmentLogoPreview(
                                                            URL.createObjectURL(
                                                                file,
                                                            ),
                                                        );
                                                        setRemoveDepartmentLogo(
                                                            false,
                                                        );
                                                    } else {
                                                        setDepartmentLogoPreview(
                                                            null,
                                                        );
                                                    }
                                                }}
                                                className="block w-full text-xs text-[#4d5a4f] file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf2eb] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#2b5139] hover:file:bg-[#e1ebe0]"
                                            />
                                            <p className="text-[11px] text-[#737c72]">
                                                PNG, JPG, or WEBP up to 5MB.
                                                Displayed in the catalog and
                                                public portal.
                                            </p>
                                        </div>
                                        {departmentLogoPreview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    clearDepartmentLogoPreview(
                                                        departmentLogoPreview,
                                                    );
                                                    setDepartmentLogoFile(null);
                                                    setDepartmentLogoPreview(
                                                        null,
                                                    );
                                                    setRemoveDepartmentLogo(
                                                        true,
                                                    );
                                                }}
                                                className="rounded-lg border border-[#e3d3cf] bg-[#fdf6f5] px-2.5 py-1.5 text-[11px] font-semibold text-[#8b4e43] hover:bg-[#f9ebe8]"
                                            >
                                                Remove logo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-[#eff0ec] pt-3">
                                <button
                                    type="button"
                                    onClick={closeDepartmentForm}
                                    className="h-9 rounded-lg border border-[#dce2d9] bg-white px-3 text-xs font-medium text-[#687267] hover:bg-[#f6f7f4]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingDepartment}
                                    className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white transition hover:bg-[#22422d] disabled:opacity-60"
                                >
                                    {savingDepartment
                                        ? 'Saving…'
                                        : editingDepartmentId !== null
                                            ? 'Save department'
                                            : 'Create department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create / Edit Academic Program Modal */}
            {isProgramModalActive && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={closeProgramForm}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={
                            editingProgramId !== null
                                ? 'Edit Academic Program'
                                : 'Add Academic Program'
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-2xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-[#eff0ec] pb-3.5">
                            <div>
                                <h3 className="text-sm font-semibold text-[#29382e]">
                                    {editingProgramId !== null
                                        ? 'Edit Academic Program'
                                        : 'Add Academic Program'}
                                </h3>
                                <p className="mt-0.5 text-xs text-[#7a8278]">
                                    Link the program to an existing department
                                    or create a new department inline.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeProgramForm}
                                aria-label="Close modal"
                                className="rounded-lg p-1.5 text-[#7a8278] transition hover:bg-[#f2f4f0] hover:text-[#29382e]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={createProgram}
                            className="mt-4 grid gap-3 sm:grid-cols-2"
                        >
                            {editingProgramId === null && (
                                <div className="flex justify-end sm:col-span-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCreateNewDeptInline(
                                                (prev) => !prev,
                                            )
                                        }
                                        className="rounded-lg border border-[#cfe0cc] bg-[#edf2eb] px-3 py-1.5 text-[11px] font-semibold text-[#2b5139] hover:bg-[#e1ebe0]"
                                    >
                                        {createNewDeptInline
                                            ? '← Select existing department'
                                            : '+ Create new department inline'}
                                    </button>
                                </div>
                            )}

                            {createNewDeptInline ? (
                                <div className="grid gap-3 rounded-xl border border-[#dce4d9] bg-[#f8faf7] p-3.5 sm:col-span-2 sm:grid-cols-2">
                                    <label className="text-xs font-medium text-[#2b5139]">
                                        New department code
                                        <input
                                            required
                                            maxLength={32}
                                            value={inlineDeptForm.code}
                                            onChange={(e) =>
                                                setInlineDeptForm({
                                                    ...inlineDeptForm,
                                                    code: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., CON"
                                            className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d9] bg-white px-3 text-xs uppercase"
                                        />
                                    </label>
                                    <label className="text-xs font-medium text-[#2b5139]">
                                        New department name
                                        <input
                                            required
                                            maxLength={160}
                                            value={inlineDeptForm.name}
                                            onChange={(e) =>
                                                setInlineDeptForm({
                                                    ...inlineDeptForm,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., College of Nursing"
                                            className="mt-1.5 h-10 w-full rounded-lg border border-[#dce2d9] bg-white px-3 text-xs"
                                        />
                                    </label>
                                </div>
                            ) : (
                                <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                                    Department
                                    <select
                                        required
                                        value={form.department_id}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                department_id:
                                                    event.target.value,
                                            })
                                        }
                                        className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] bg-white px-3 text-xs"
                                    >
                                        <option value="">
                                            Select a department
                                        </option>
                                        {departmentsList.map((department) => (
                                            <option
                                                key={department.id}
                                                value={department.id}
                                            >
                                                {department.code} ·{' '}
                                                {department.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            {(
                                [
                                    ['code', 'Program code'],
                                    ['name', 'Program name'],
                                ] as const
                            ).map(([name, label]) => (
                                <label
                                    key={name}
                                    className="text-xs font-medium text-[#4d5a4f]"
                                >
                                    {label}
                                    <input
                                        required
                                        value={form[name]}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                [name]: event.target.value,
                                            })
                                        }
                                        placeholder={
                                            name === 'code'
                                                ? 'e.g., BSCS, BSIT, BSN'
                                                : 'e.g., BS in Computer Science'
                                        }
                                        className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                                    />
                                </label>
                            ))}

                            <label className="text-xs font-medium text-[#4d5a4f] sm:col-span-2">
                                Description (optional)
                                <input
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            description: event.target.value,
                                        })
                                    }
                                    placeholder="Optional program summary or specialization notes…"
                                    className="mt-1.5 h-10 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                                />
                            </label>

                            <div className="flex items-center justify-end gap-2 border-t border-[#eff0ec] pt-3 sm:col-span-2">
                                <button
                                    type="button"
                                    onClick={closeProgramForm}
                                    className="h-9 rounded-lg border border-[#e8eae4] bg-white px-3 text-xs font-medium text-[#687267] hover:bg-[#f6f7f4]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white transition hover:bg-[#22422d] disabled:opacity-60"
                                >
                                    {creating
                                        ? 'Saving…'
                                        : editingProgramId !== null
                                            ? 'Save changes'
                                            : 'Add program'}
                                </button>
                            </div>
                            {departmentsRes.error ? (
                                <p
                                    role="alert"
                                    className="text-xs text-[#8b4e43] sm:col-span-2"
                                >
                                    {departmentsRes.error}
                                </p>
                            ) : null}
                        </form>
                    </div>
                </div>
            )}

            {/* Modular by Department View */}
            {viewMode === 'modular' ? (
                filteredDepartments.length ? (
                    <div className="space-y-4">
                        {filteredDepartments.map((dept) => {
                            const deptPrograms = programsList.filter(
                                (p) =>
                                    p.department_id === dept.id &&
                                    (!normalizedQuery ||
                                        dept.code
                                            .toLowerCase()
                                            .includes(normalizedQuery) ||
                                        dept.name
                                            .toLowerCase()
                                            .includes(normalizedQuery) ||
                                        p.code
                                            .toLowerCase()
                                            .includes(normalizedQuery) ||
                                        p.name
                                            .toLowerCase()
                                            .includes(normalizedQuery)),
                            );

                            return (
                                <section
                                    key={dept.id}
                                    className="rounded-2xl border border-[#e4e9e1] bg-white p-5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eff1ed] pb-3.5">
                                        <div className="flex items-start gap-3">
                                            {dept.logo && (
                                                <img
                                                    src={dept.logo}
                                                    alt={`${dept.name} logo`}
                                                    className="size-11 shrink-0 rounded-xl border border-[#e3e7df] bg-white object-cover"
                                                />
                                            )}
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-lg bg-[#2b5139] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
                                                        {dept.code}
                                                    </span>
                                                    <h2 className="text-sm font-semibold text-[#29382e]">
                                                        {dept.name}
                                                    </h2>
                                                    <span className="rounded-full bg-[#f2f4f0] px-2.5 py-0.5 text-[10px] font-semibold text-[#5b675c]">
                                                        {deptPrograms.length}{' '}
                                                        {deptPrograms.length ===
                                                            1
                                                            ? 'program'
                                                            : 'programs'}
                                                    </span>
                                                </div>
                                                {dept.description && (
                                                    <p className="mt-1 text-xs text-[#737c72]">
                                                        {dept.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditDepartment(dept)
                                                }
                                                className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#536055] hover:bg-[#f6f7f4]"
                                            >
                                                Edit department
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openAddProgramForDepartment(
                                                        dept.id,
                                                    )
                                                }
                                                className="rounded-lg bg-[#edf2eb] px-3 py-1.5 text-[11px] font-semibold text-[#2b5139] hover:bg-[#dfe7dc]"
                                            >
                                                + Add program here
                                            </button>
                                        </div>
                                    </div>

                                    {deptPrograms.length ? (
                                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {deptPrograms.map((program) => (
                                                <article
                                                    key={program.id}
                                                    className="rounded-xl border border-[#e9ebe5] bg-[#fafbf9] p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <span className="rounded bg-[#edf2eb] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#2b5139] uppercase">
                                                            {program.code}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditProgram(
                                                                    program,
                                                                )
                                                            }
                                                            className="text-[11px] font-semibold text-[#687267] hover:text-[#2b5139]"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                    <h3 className="mt-2 text-sm font-semibold text-[#39463b]">
                                                        {program.name}
                                                    </h3>
                                                    {program.description && (
                                                        <p className="mt-1 text-xs text-[#7a8278]">
                                                            {
                                                                program.description
                                                            }
                                                        </p>
                                                    )}
                                                </article>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-3 rounded-xl border border-dashed border-[#dce2d9] bg-[#fafbf9] p-4 text-center text-xs text-[#7a8278]">
                                            No academic programs under{' '}
                                            <span className="font-semibold text-[#39463b]">
                                                {dept.name}
                                            </span>{' '}
                                            yet.{' '}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openAddProgramForDepartment(
                                                        dept.id,
                                                    )
                                                }
                                                className="font-semibold text-[#2b5139] hover:underline"
                                            >
                                                Add the first program →
                                            </button>
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState>
                        No academic departments match your filter. Click "+
                        Create department" above to add one.
                    </EmptyState>
                )
            ) : filteredPrograms.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredPrograms.map((program) => (
                        <article
                            key={program.id}
                            className="rounded-2xl border border-[#e9ebe5] bg-white p-5"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[10px] font-semibold tracking-wide text-[#829080] uppercase">
                                    {program.code}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => openEditProgram(program)}
                                    className="text-[11px] font-semibold text-[#687267] hover:text-[#2b5139]"
                                >
                                    Edit
                                </button>
                            </div>
                            <h2 className="mt-2 text-sm font-semibold text-[#39463b]">
                                {program.name}
                            </h2>
                            <p className="mt-1 text-xs text-[#7a8278]">
                                {program.department?.name ??
                                    'Department not assigned'}
                            </p>
                            {program.description && (
                                <p className="mt-2 border-t border-[#eff0ec] pt-2.5 text-xs text-[#6f786e]">
                                    {program.description}
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyState>
                    No academic programs have been configured.
                </EmptyState>
            )}
        </div>
    );
}
