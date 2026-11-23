export function LoadingState() {
    return (
        <div
            role="status"
            className="rounded-2xl border border-[#e9ebe5] bg-white p-6 text-sm text-[#7a8278]"
        >
            Loading records…
        </div>
    );
}

export function ErrorState({ message }: { message: string }) {
    return (
        <div
            role="alert"
            className="rounded-2xl border border-[#ecd8d2] bg-white p-6 text-sm text-[#8b4e43]"
        >
            {message}
        </div>
    );
}

export function EmptyState({ children }: { children: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#dfe4dc] bg-white p-8 text-center text-sm text-[#858b82]">
            {children}
        </div>
    );
}

export type WorkspaceRole =
    | 'Administrator'
    | 'Alumni coordinator'
    | 'Department coordinator'
    | 'Alumni'
    | 'Employer';

export type RawPagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
};

export function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export function isEmployedOutcome(status: string): boolean {
    return [
        'employed',
        'self-employed',
        'government-employee',
        'government employee',
        'freelance',
    ].includes(status.toLowerCase().replaceAll('_', '-'));
}

export const statusClass: Record<string, string> = {
    Employed: 'bg-[#eaf1e9] text-[#45664a]',
    'Further studies': 'bg-[#eeeefa] text-[#62658f]',
    'Self-employed': 'bg-[#faf0e2] text-[#936536]',
    'Seeking work': 'bg-[#edf1f3] text-[#537483]',
};

export function formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatSalary(
    min: number | null,
    max: number | null,
): string | null {
    if (!min && !max) return null;
    const fmt = (n: number) => `₱${n.toLocaleString()}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} / mo`;
    if (min) return `From ${fmt(min)} / mo`;
    if (max) return `Up to ${fmt(max)} / mo`;
    return null;
}

