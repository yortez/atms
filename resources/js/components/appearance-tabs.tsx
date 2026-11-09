import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    return (
        <div
            className={cn(
                'inline-flex gap-1.5 rounded-xl border border-zinc-200/80 bg-[#F5F4EE] p-1.5',
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => {
                const active = appearance === value;
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'flex items-center rounded-lg px-4 py-2 text-xs font-bold transition-colors',
                            active
                                ? 'bg-[#001c17] text-white shadow-2xs'
                                : 'text-zinc-600 hover:bg-white hover:text-zinc-900',
                        )}
                    >
                        <Icon
                            className={cn(
                                '-ml-0.5 h-4 w-4',
                                active ? 'text-[#E47818]' : 'text-zinc-500',
                            )}
                        />
                        <span className="ml-2">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
