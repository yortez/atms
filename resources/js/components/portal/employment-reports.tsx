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

type OutcomeRow = {
    graduation_year: number;
    status: string;
    alumni_count: number;
    related_count?: number;
};

type InstitutionalReportDefinition = {
    key: string;
    number: number;
    title: string;
    category: string;
    description: string;
};

type InstitutionalReportCard = {
    label: string;
    value: string | number;
    hint?: string;
};

type InstitutionalReportChartItem = {
    label: string;
    value: number;
    percentage?: number;
};

type InstitutionalReportColumn = {
    key: string;
    label: string;
    align?: 'left' | 'right' | 'center';
};

type InstitutionalReportPayload = {
    report_type: string;
    number: number;
    title: string;
    category: string;
    description: string;
    generated_at: string;
    filters: {
        department_id: number | null;
        program_id: number | null;
        graduation_year: number | null;
        employment_status: string | null;
        date_from: string | null;
        date_to: string | null;
    };
    filter_options: {
        departments: Array<{ id: number; code: string; name: string }>;
        programs: Array<{ id: number; department_id: number; code: string; name: string }>;
        graduation_years: number[];
        employment_statuses: Array<{ id: number; code: string; label: string }>;
    };
    available_reports: InstitutionalReportDefinition[];
    cards: InstitutionalReportCard[];
    chart: {
        title: string;
        type: 'bar' | 'horizontal-bar' | 'distribution';
        unit?: string;
        series: InstitutionalReportChartItem[];
    };
    columns: InstitutionalReportColumn[];
    rows: Array<Record<string, string | number | null>>;
};

let currentReportExportParams = 'report_type=graduate_tracer_summary';

export async function downloadInstitutionalReport(
    format: 'excel' | 'pdf',
    queryString: string = currentReportExportParams,
) {
    try {
        const endpoint =
            format === 'pdf'
                ? `/api/reports/export/pdf?${queryString}`
                : `/api/reports/export/excel?${queryString}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                Accept:
                    format === 'pdf'
                        ? 'application/pdf'
                        : 'application/vnd.ms-excel',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok) {
            throw new Error(`Export failed (${response.status})`);
        }

        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition') ?? '';
        const match = disposition.match(/filename="?([^"]+)"?/i);
        const fallbackName =
            format === 'pdf'
                ? 'institutional-report.pdf'
                : 'institutional-report.xls';
        const filename = match?.[1] ?? fallbackName;

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);

        toast.success(
            format === 'pdf'
                ? 'PDF report downloaded.'
                : 'Excel report downloaded.',
        );
    } catch (error) {
        toast.error(
            error instanceof Error
                ? error.message
                : 'Report could not be exported.',
        );
    }
}

export async function exportEmploymentOutcomes() {
    await downloadInstitutionalReport('excel', currentReportExportParams);
}

export function EmploymentReports() {
    const [reportType, setReportType] = useState('graduate_tracer_summary');
    const [departmentId, setDepartmentId] = useState('');
    const [programId, setProgramId] = useState('');
    const [graduationYear, setGraduationYear] = useState('');
    const [employmentStatus, setEmploymentStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [tableSearch, setTableSearch] = useState('');
    const [chartMode, setChartMode] = useState<'bars' | 'distribution'>('bars');
    const [exportingFormat, setExportingFormat] = useState<
        'excel' | 'pdf' | null
    >(null);

    const params = new URLSearchParams();
    params.set('report_type', reportType);
    if (departmentId) params.set('department_id', departmentId);
    if (programId) params.set('program_id', programId);
    if (graduationYear) params.set('graduation_year', graduationYear);
    if (employmentStatus) params.set('employment_status', employmentStatus);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);

    const queryString = params.toString();
    currentReportExportParams = queryString;

    const { data, loading, error } = useApiResource<
        ApiEnvelope<InstitutionalReportPayload>
    >(`/api/reports?${queryString}`);

    const report = data?.data;
    const availableReports = report?.available_reports ?? [];
    const departments = report?.filter_options.departments ?? [];
    const allPrograms = report?.filter_options.programs ?? [];
    const programs = departmentId
        ? allPrograms.filter((p) => String(p.department_id) === departmentId)
        : allPrograms;
    const graduationYears = report?.filter_options.graduation_years ?? [];
    const statuses = report?.filter_options.employment_statuses ?? [];

    const hasActiveFilters = Boolean(
        departmentId ||
        programId ||
        graduationYear ||
        employmentStatus ||
        dateFrom ||
        dateTo,
    );

    function resetFilters() {
        setDepartmentId('');
        setProgramId('');
        setGraduationYear('');
        setEmploymentStatus('');
        setDateFrom('');
        setDateTo('');
        setTableSearch('');
    }

    async function handleExport(format: 'excel' | 'pdf') {
        setExportingFormat(format);
        try {
            await downloadInstitutionalReport(format, queryString);
        } finally {
            setExportingFormat(null);
        }
    }

    if (loading && !report) {
        return <LoadingState />;
    }

    if (error && !report) {
        return <ErrorState message={error} />;
    }

    if (!report) {
        return <EmptyState>No institutional report data available.</EmptyState>;
    }

    const categories = Array.from(
        new Set(availableReports.map((item) => item.category)),
    );

    const chartSeries = report.chart?.series ?? [];
    const maxChartVal = Math.max(
        1,
        ...chartSeries.map((item) => Number(item.value) || 0),
    );
    const totalChartVal = chartSeries.reduce(
        (sum, item) => sum + (Number(item.value) || 0),
        0,
    );

    const filteredRows = tableSearch.trim()
        ? report.rows.filter((row) =>
            Object.values(row).some((cell) =>
                String(cell ?? '')
                    .toLowerCase()
                    .includes(tableSearch.trim().toLowerCase()),
            ),
        )
        : report.rows;

    return (
        <div className="space-y-5">
            {/* Report Catalog Selector & Export Actions */}
            <section className="min-w-0 rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 border-b border-[#eff0ec] pb-4 lg:flex-row lg:items-center">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#edf2eb] px-2.5 py-0.5 text-[10px] font-bold text-[#2b5139] uppercase tracking-wider">
                                Report #{report.number} of 18
                            </span>
                            <span className="rounded-full bg-[#f4f5f2] px-2.5 py-0.5 text-[10px] font-semibold text-[#667166]">
                                {report.category}
                            </span>
                        </div>
                        <h2 className="mt-2 text-base font-semibold tracking-tight text-[#29382e]">
                            {report.title}
                        </h2>
                        <p className="mt-1 text-xs text-[#747c72]">
                            {report.description}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={exportingFormat !== null}
                            onClick={() => void handleExport('excel')}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#dce5d8] bg-[#f4f8f3] px-3.5 text-xs font-semibold text-[#2b5139] transition hover:bg-[#e8f0e6] disabled:opacity-60"
                        >
                            {exportingFormat === 'excel'
                                ? 'Exporting Excel…'
                                : 'Export Excel (.xls)'}
                        </button>
                        <button
                            type="button"
                            disabled={exportingFormat !== null}
                            onClick={() => void handleExport('pdf')}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2b5139] px-3.5 text-xs font-semibold text-white transition hover:bg-[#234530] disabled:opacity-60"
                        >
                            {exportingFormat === 'pdf'
                                ? 'Generating PDF…'
                                : 'Export PDF (.pdf)'}
                        </button>
                    </div>
                </div>

                {/* 18 Reports Picker + 5 Filter Controls */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <label className="text-[11px] font-medium text-[#4d5a4f] lg:col-span-2">
                        Institutional Report (18 Tracer Reports)
                        <select
                            aria-label="Institutional Report"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-2.5 text-xs font-semibold text-[#2c3c30] outline-none focus:border-[#819981]"
                        >
                            {categories.map((cat) => (
                                <optgroup key={cat} label={cat}>
                                    {availableReports
                                        .filter((item) => item.category === cat)
                                        .map((item) => (
                                            <option
                                                key={item.key}
                                                value={item.key}
                                            >
                                                {item.number}. {item.title}
                                            </option>
                                        ))}
                                </optgroup>
                            ))}
                        </select>
                    </label>

                    <label className="text-[11px] font-medium text-[#4d5a4f]">
                        Department
                        <select
                            aria-label="Filter by Department"
                            value={departmentId}
                            onChange={(e) => {
                                setDepartmentId(e.target.value);
                                setProgramId('');
                            }}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                        >
                            <option value="">All departments</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.code} — {dept.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-[11px] font-medium text-[#4d5a4f]">
                        Academic Program
                        <select
                            aria-label="Filter by Academic Program"
                            value={programId}
                            onChange={(e) => setProgramId(e.target.value)}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                        >
                            <option value="">All programs</option>
                            {programs.map((prog) => (
                                <option key={prog.id} value={prog.id}>
                                    {prog.code} — {prog.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-[11px] font-medium text-[#4d5a4f]">
                        Graduation Year
                        <select
                            aria-label="Filter by Graduation Year"
                            value={graduationYear}
                            onChange={(e) => setGraduationYear(e.target.value)}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                        >
                            <option value="">All cohorts</option>
                            {graduationYears.map((yr) => (
                                <option key={yr} value={yr}>
                                    Class of {yr}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-[11px] font-medium text-[#4d5a4f]">
                        Employment Status
                        <select
                            aria-label="Filter by Employment Status"
                            value={employmentStatus}
                            onChange={(e) =>
                                setEmploymentStatus(e.target.value)
                            }
                            className="mt-1 h-9 w-full rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                        >
                            <option value="">All statuses</option>
                            {statuses.map((st) => (
                                <option key={st.id} value={st.code}>
                                    {st.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Date Range & Quick Report Pills */}
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-[#f3f4f0] pt-3">
                    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
                        <label className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#667166] sm:justify-start">
                            <span>Date from</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-8 rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                            />
                        </label>
                        <label className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#667166] sm:justify-start">
                            <span>Date to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-8 rounded-lg border border-[#e3e7df] bg-white px-2.5 text-xs text-[#435044] outline-none focus:border-[#819981]"
                            />
                        </label>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="h-8 rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-3 text-[11px] font-semibold text-[#5b695d] hover:bg-[#eff2ed]"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                    {loading && (
                        <span className="text-[11px] font-medium text-[#69866c]">
                            Refreshing report…
                        </span>
                    )}
                </div>
            </section>

            {/* Statistical KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {report.cards.map((card) => (
                    <article
                        key={card.label}
                        className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5"
                    >
                        <p className="text-[11px] font-semibold tracking-wide text-[#7c847a] uppercase">
                            {card.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-[#28382c]">
                            {card.value}
                        </p>
                        {card.hint && (
                            <p className="mt-1 text-[11px] text-[#838b81]">
                                {card.hint}
                            </p>
                        )}
                    </article>
                ))}
            </div>

            {/* Interactive Chart & Quick Catalog Navigator */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                <section className="min-w-0 rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-semibold tracking-tight text-[#29382e]">
                                {report.chart.title}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-[#7c847a]">
                                Interactive visual breakdown ({report.chart.unit ?? 'count'})
                            </p>
                        </div>
                        <div className="inline-flex rounded-lg border border-[#e6e9e2] bg-[#f8f9f6] p-0.5 text-[11px]">
                            <button
                                type="button"
                                onClick={() => setChartMode('bars')}
                                className={`rounded-md px-2.5 py-1 font-medium transition ${chartMode === 'bars' ? 'bg-white text-[#2b5139] shadow-xs' : 'text-[#737b71]'}`}
                            >
                                Comparative Bars
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode('distribution')}
                                className={`rounded-md px-2.5 py-1 font-medium transition ${chartMode === 'distribution' ? 'bg-white text-[#2b5139] shadow-xs' : 'text-[#737b71]'}`}
                            >
                                Share Breakdown
                            </button>
                        </div>
                    </div>

                    {chartSeries.length ? (
                        chartMode === 'bars' ? (
                            <div className="space-y-3.5">
                                {chartSeries.map((item) => {
                                    const widthPct =
                                        report.chart.unit === '%'
                                            ? Math.min(
                                                100,
                                                Math.max(
                                                    0,
                                                    Number(item.value) || 0,
                                                ),
                                            )
                                            : Math.min(
                                                100,
                                                Math.round(
                                                    ((Number(item.value) ||
                                                        0) /
                                                        maxChartVal) *
                                                    100,
                                                ),
                                            );

                                    return (
                                        <div
                                            key={item.label}
                                            className="grid grid-cols-[100px_1fr_56px] items-center gap-2 text-xs sm:grid-cols-[160px_1fr_80px] sm:gap-3"
                                        >
                                            <span
                                                className="truncate font-medium text-[#536055]"
                                                title={item.label}
                                            >
                                                {item.label}
                                            </span>
                                            <div className="h-3 overflow-hidden rounded-full bg-[#f0f2ed]">
                                                <div
                                                    className="h-full rounded-full bg-[#4b7254] transition-all duration-300"
                                                    style={{
                                                        width: `${widthPct}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-right font-semibold text-[#314736]">
                                                {item.value}
                                                {report.chart.unit === '%'
                                                    ? '%'
                                                    : report.chart.unit ===
                                                        'mos'
                                                        ? ' mos'
                                                        : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {chartSeries.map((item) => {
                                    const share =
                                        item.percentage !== undefined
                                            ? item.percentage
                                            : totalChartVal > 0
                                                ? Math.round(
                                                    ((Number(item.value) || 0) /
                                                        totalChartVal) *
                                                    100,
                                                )
                                                : 0;
                                    return (
                                        <div key={item.label}>
                                            <div className="mb-1 flex justify-between text-[11px]">
                                                <span className="font-medium text-[#536055]">
                                                    {item.label}
                                                </span>
                                                <span className="font-semibold text-[#314736]">
                                                    {item.value} ({share}%)
                                                </span>
                                            </div>
                                            <div className="h-2.5 overflow-hidden rounded-full bg-[#f0f2ed]">
                                                <div
                                                    className="h-full rounded-full bg-[#69866c] transition-all duration-300"
                                                    style={{
                                                        width: `${Math.min(100, Math.max(0, share))}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <EmptyState>
                            No chart data points match the current report filters.
                        </EmptyState>
                    )}
                </section>

                {/* All 18 Institutional Reports Quick Directory */}
                <section className="min-w-0 rounded-2xl border border-[#e9ebe5] bg-white p-5 sm:p-6">
                    <h3 className="mb-3 text-sm font-semibold tracking-tight text-[#29382e]">
                        18 Institutional Tracer Reports
                    </h3>
                    <div className="max-h-[290px] space-y-1 overflow-y-auto pr-1">
                        {availableReports.map((item) => {
                            const active = item.key === reportType;
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setReportType(item.key)}
                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${active
                                        ? 'bg-[#edf2eb] font-semibold text-[#2b5139]'
                                        : 'text-[#626c61] hover:bg-[#f6f7f4]'
                                        }`}
                                >
                                    <span className="truncate">
                                        {item.number}. {item.title}
                                    </span>
                                    <span className="ml-2 shrink-0 text-[10px] text-[#8a9289]">
                                        {item.category.split(' ')[0]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Report Data Table */}
            <section className="overflow-hidden rounded-2xl border border-[#e9ebe5] bg-white">
                <div className="flex flex-col justify-between gap-3 border-b border-[#eff0ec] p-4 sm:flex-row sm:items-center sm:px-6">
                    <div>
                        <h3 className="text-sm font-semibold text-[#29382e]">
                            {report.title} — Tabular Data
                        </h3>
                        <p className="mt-0.5 text-[11px] text-[#7c847a]">
                            Showing {filteredRows.length} of {report.rows.length}{' '}
                            records
                        </p>
                    </div>
                    <input
                        type="search"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder="Filter table rows…"
                        className="h-8 w-full rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-3 text-xs outline-none focus:border-[#819981] sm:w-56"
                    />
                </div>

                {filteredRows.length ? (
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-[#eff0ec] bg-[#fafbf9] text-[10px] font-bold tracking-wider text-[#7d867c] uppercase">
                                <tr>
                                    {report.columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={`px-4 py-3 ${col.align === 'right'
                                                ? 'text-right'
                                                : col.align === 'center'
                                                    ? 'text-center'
                                                    : 'text-left'
                                                }`}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eff0ec]">
                                {filteredRows.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="transition hover:bg-[#fafbf9]"
                                    >
                                        {report.columns.map((col) => {
                                            const cellVal = row[col.key] ?? '—';
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`px-4 py-3 text-[#414e43] ${col.align === 'right'
                                                        ? 'text-right font-medium'
                                                        : col.align ===
                                                            'center'
                                                            ? 'text-center'
                                                            : 'text-left'
                                                        }`}
                                                >
                                                    {cellVal}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6">
                        <EmptyState>
                            No records match the current report and filter criteria.
                        </EmptyState>
                    </div>
                )}
            </section>
        </div>
    );
}
