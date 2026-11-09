import { Link } from '@inertiajs/react';
import { Palette, ShieldCheck, UserRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: (NavItem & { description: string })[] = [
    {
        title: 'Profile & Password',
        description: 'Name, email, avatar & password',
        href: edit(),
        icon: UserRound,
    },
    {
        title: 'Security & 2FA',
        description: 'Two-factor auth & passkeys',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        title: 'Appearance',
        description: 'Light, dark, or system theme',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="grid gap-5 lg:grid-cols-12">
            <aside className="lg:col-span-3">
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-2xs">
                    <div className="px-2.5 pt-1 pb-2 text-[10px] font-bold tracking-[0.14em] text-zinc-400 uppercase">
                        Account Preferences
                    </div>
                    <nav
                        className="flex flex-col gap-1"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => {
                            const active = isCurrentOrParentUrl(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                        active
                                            ? 'bg-[#001c17] text-white shadow-2xs'
                                            : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                                    }`}
                                >
                                    {Icon && (
                                        <Icon
                                            className={`mt-0.5 size-4 shrink-0 ${
                                                active
                                                    ? 'text-[#E47818]'
                                                    : 'text-zinc-500'
                                            }`}
                                        />
                                    )}
                                    <span className="min-w-0">
                                        <span className="block text-xs font-bold">
                                            {item.title}
                                        </span>
                                        <span
                                            className={`mt-0.5 block text-[11px] ${
                                                active
                                                    ? 'text-zinc-300'
                                                    : 'text-zinc-500'
                                            }`}
                                        >
                                            {item.description}
                                        </span>
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            <div className="lg:col-span-9">
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs sm:p-7">
                    <section className="max-w-2xl space-y-10">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
