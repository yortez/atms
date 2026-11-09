import { Form, Head } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    Building2,
    ChevronDown,
    GraduationCap,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type DemoAccount = {
    title: string;
    subtitle: string;
    handle: string;
    email: string;
    password: string;
    icon: string;
};

type Props = {
    status?: string;
    canResetPassword: boolean;
    demoQuickLoginEnabled?: boolean;
    demoAccounts?: DemoAccount[];
};

function DemoRoleIcon({ icon }: { icon: string }) {
    switch (icon) {
        case 'shield':
            return <ShieldCheck className="size-4 shrink-0 text-[#E47818]" />;
        case 'users':
            return <UsersRound className="size-4 shrink-0 text-[#E47818]" />;
        case 'building':
            return <Building2 className="size-4 shrink-0 text-[#E47818]" />;
        case 'briefcase':
            return (
                <BriefcaseBusiness className="size-4 shrink-0 text-[#E47818]" />
            );
        default:
            return <GraduationCap className="size-4 shrink-0 text-[#E47818]" />;
    }
}

export default function Login({
    status,
    canResetPassword,
    demoQuickLoginEnabled = false,
    demoAccounts = [],
}: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const [demoExpanded, setDemoExpanded] = useState(false);

    const populateDemoAccount = (account: DemoAccount) => {
        setEmail(account.email);
        setPassword(account.password);
        setSelectedEmail(account.email);
    };

    return (
        <>
            <Head title="Log in" />

            <PasskeyVerify />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-11 w-full rounded-xl bg-[#E47818] font-heading text-xs font-bold text-white shadow-md transition hover:bg-[#F36C21] sm:text-sm"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Sign in to SEAIT Portal
                            </Button>
                        </div>

                        {demoQuickLoginEnabled && demoAccounts.length > 0 && (
                            <section
                                aria-label="Quick-fill demo accounts"
                                data-test="demo-quick-login-panel"
                                className="overflow-hidden rounded-2xl border border-[#163830] bg-[#061411] text-white shadow-lg"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDemoExpanded((open) => !open)
                                    }
                                    aria-expanded={demoExpanded}
                                    data-test="demo-quick-login-collapse-trigger"
                                    className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left transition hover:bg-white/[0.03] sm:px-5"
                                >
                                    <span className="font-heading text-xs font-extrabold tracking-[0.06em] text-[#3ce6b0] uppercase">
                                        Quick-Fill Demo Accounts
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8fa39a]">
                                        <span>
                                            {demoExpanded
                                                ? 'Click any role to populate login'
                                                : 'Show demo roles'}
                                        </span>
                                        <ChevronDown
                                            className={`size-4 text-[#3ce6b0] transition-transform duration-200 ${
                                                demoExpanded ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </span>
                                </button>

                                {demoExpanded && (
                                    <div className="grid gap-3 border-t border-[#143029] px-4 pt-3.5 pb-4 sm:grid-cols-2 sm:px-5 sm:pb-5">
                                        {demoAccounts.map((account) => {
                                            const isSelected =
                                                selectedEmail ===
                                                    account.email &&
                                                email === account.email;

                                            return (
                                                <button
                                                    key={account.email}
                                                    type="button"
                                                    onClick={() =>
                                                        populateDemoAccount(
                                                            account,
                                                        )
                                                    }
                                                    data-test={`demo-account-${account.handle}`}
                                                    className={`group flex flex-col justify-between rounded-xl border px-4 py-3.5 text-left transition active:scale-[0.99] ${
                                                        isSelected
                                                            ? 'border-[#3ce6b0] bg-[#0d2922] ring-1 ring-[#3ce6b0]/40'
                                                            : 'border-[#18352e] bg-[#0a1916] hover:border-[#E47818]/65 hover:bg-[#0e231e]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <DemoRoleIcon
                                                            icon={account.icon}
                                                        />
                                                        <span className="font-heading text-xs font-bold text-white sm:text-[13px]">
                                                            {account.title}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2.5 flex items-end justify-between gap-2">
                                                        <span className="line-clamp-2 text-[11px] leading-snug text-[#8fa39a]">
                                                            {account.subtitle}
                                                        </span>
                                                        <span className="shrink-0 font-mono text-[11px] font-semibold text-[#3ce6b0]">
                                                            {account.handle}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        )}

                        <div className="flex flex-col items-center justify-between gap-2 border-t border-zinc-200/80 pt-4 text-xs text-zinc-600 sm:flex-row dark:border-white/10 dark:text-zinc-400">
                            <span>
                                Don't have an account?{' '}
                                <TextLink
                                    href={register()}
                                    tabIndex={5}
                                    className="font-heading font-bold text-[#E47818]"
                                >
                                    Claim Alumni Record
                                </TextLink>
                            </span>
                            <TextLink
                                href="/alumni/registration-assistance"
                                className="font-heading font-bold text-teal-700 dark:text-teal-300"
                            >
                                Need Registrar Claim Assistance?
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Sign in to SEAIT ATMS',
    description:
        'Access your graduate tracer workspace, coordinator dashboard, or employer partner portal',
};
