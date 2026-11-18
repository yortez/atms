import { Form, Head, Link } from '@inertiajs/react';
import { BriefcaseBusiness, GraduationCap } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
    assistanceUrl: string;
    initialType?: 'alumni' | 'employer';
};

export default function Register({ passwordRules, assistanceUrl }: Props) {
    return (
        <>
            <Head title="Employer Partner Registration · SEAIT ATMS" />

            {/* Alumni Notice Banner */}
            <div className="mb-5 rounded-xl border border-teal-600/25 bg-teal-500/10 p-3.5 text-xs leading-5 text-teal-950 dark:border-teal-400/25 dark:bg-teal-950/50 dark:text-teal-200">
                <div className="flex items-start gap-2.5">
                    <GraduationCap className="mt-0.5 size-4 shrink-0 text-teal-700 dark:text-teal-300" />
                    <div className="space-y-1.5">
                        <p className="font-semibold">
                            Are you a SEAIT Graduate / Alumnus?
                        </p>
                        <p>
                            Alumni accounts are automatically created from
                            official Registrar records using your default login
                            (<strong>Username</strong>:{' '}
                            <code className="font-mono font-semibold">
                                lastname_firstinitial
                            </code>{' '}
                            e.g.{' '}
                            <code className="font-mono font-semibold">
                                dela_cruz_c
                            </code>
                            , <strong>Password</strong>: your{' '}
                            <strong>Student Number</strong>).
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-0.5">
                            <Link
                                href={login()}
                                className="font-heading font-bold text-[#E47818] underline underline-offset-2"
                            >
                                Sign in to Alumni Portal →
                            </Link>
                            <Link
                                href={assistanceUrl}
                                className="font-heading font-bold text-teal-700 underline underline-offset-2 dark:text-teal-300"
                            >
                                Request Record / Login Assistance →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <input
                            type="hidden"
                            name="registration_type"
                            value="employer"
                        />

                        <div className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-[#F5F4EE] px-3.5 py-2.5 text-xs leading-5 text-zinc-800 dark:border-white/10 dark:bg-[#0A1006] dark:text-zinc-200">
                            <BriefcaseBusiness className="size-4 shrink-0 text-[#E47818]" />
                            <span>
                                Create an{' '}
                                <strong>Employer Partner</strong> workspace to
                                post career opportunities for{' '}
                                <strong>SEAIT</strong> graduates. Company
                                profiles undergo coordinator verification before
                                job postings are published.
                            </span>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="company_name">
                                    Company / organization name
                                </Label>
                                <Input
                                    id="company_name"
                                    type="text"
                                    required
                                    autoFocus
                                    name="company_name"
                                    placeholder="South Cotabato Digital Inc."
                                />
                                <InputError message={errors.company_name} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="industry">Industry</Label>
                                    <Input
                                        id="industry"
                                        type="text"
                                        name="industry"
                                        placeholder="Information Technology"
                                    />
                                    <InputError message={errors.industry} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="website">
                                        Website (optional)
                                    </Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        name="website"
                                        placeholder="https://company.example"
                                    />
                                    <InputError message={errors.website} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Representative full name
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Juan Dela Cruz"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-1"
                                />
                            </div>

                            <fieldset className="grid gap-3.5 rounded-xl border border-zinc-200 p-4 dark:border-white/15">
                                <legend className="px-1.5 text-xs font-bold tracking-wider text-zinc-700 uppercase dark:text-zinc-300">
                                    Account Credentials
                                </legend>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        Corporate email address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        name="email"
                                        placeholder="email@example.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        required
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder="Password"
                                        passwordrules={passwordRules}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        required
                                        autoComplete="new-password"
                                        name="password_confirmation"
                                        placeholder="Confirm password"
                                        passwordrules={passwordRules}
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>
                            </fieldset>

                            <Button
                                type="submit"
                                className="mt-1 h-11 w-full rounded-xl bg-[#E47818] font-heading text-xs font-bold text-white shadow-md transition hover:bg-[#F36C21] sm:text-sm"
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Register Employer Partner Account
                            </Button>
                        </div>

                        <div className="flex flex-col items-center justify-between gap-2 border-t border-zinc-200/80 pt-4 text-xs text-zinc-600 sm:flex-row dark:border-white/10 dark:text-zinc-400">
                            <span>
                                Already have an account?{' '}
                                <Link
                                    href={login()}
                                    className="font-heading font-bold text-[#E47818] underline-offset-4 hover:underline"
                                >
                                    Sign in
                                </Link>
                            </span>
                            <Link
                                href={assistanceUrl}
                                className="font-heading font-bold text-teal-700 underline-offset-4 hover:underline dark:text-teal-300"
                            >
                                Alumni Record Assistance →
                            </Link>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Employer Partner Registration',
    description:
        'Register as a verified employer partner or check your alumni portal access',
};
