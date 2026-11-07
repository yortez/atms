import { Form, Head, Link } from '@inertiajs/react';
import { BriefcaseBusiness, GraduationCap, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
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

export default function Register({
    passwordRules,
    assistanceUrl,
    initialType = 'alumni',
}: Props) {
    const [registrationType, setRegistrationType] = useState<
        'alumni' | 'employer'
    >(initialType === 'employer' ? 'employer' : 'alumni');
    const [fullName, setFullName] = useState('');
    const [lastName, setLastName] = useState('');
    const [lastNameManuallyEdited, setLastNameManuallyEdited] = useState(false);

    const handleFullNameChange = (value: string) => {
        setFullName(value);
        if (!lastNameManuallyEdited) {
            const parts = value.trim().split(/\s+/).filter(Boolean);
            setLastName(parts.length > 0 ? parts[parts.length - 1] : '');
        }
    };

    return (
        <>
            <Head
                title={
                    registrationType === 'employer'
                        ? 'Employer Partner Registration · SEAIT ATMS'
                        : 'Claim SEAIT Alumni Account · SEAIT ATMS'
                }
            />

            {/* Role Registration Switcher */}
            <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-xl border border-zinc-200 bg-[#F5F4EE] p-1 dark:border-white/15 dark:bg-zinc-900">
                <button
                    type="button"
                    onClick={() => setRegistrationType('alumni')}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        registrationType === 'alumni'
                            ? 'bg-[#001c17] text-white shadow-xs dark:bg-[#E47818]'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                >
                    <GraduationCap className="size-3.5" />
                    Alumni Claim
                </button>
                <button
                    type="button"
                    onClick={() => setRegistrationType('employer')}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        registrationType === 'employer'
                            ? 'bg-[#001c17] text-white shadow-xs dark:bg-[#E47818]'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                >
                    <BriefcaseBusiness className="size-3.5" />
                    Employer Partner
                </button>
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
                            value={registrationType}
                        />

                        {registrationType === 'alumni' ? (
                            <div className="rounded-xl border border-teal-600/25 bg-teal-500/10 px-3.5 py-2.5 text-xs leading-5 text-teal-950 dark:border-teal-400/25 dark:bg-teal-950/50 dark:text-teal-200">
                                Verify your official <strong>SEAIT</strong> graduate record using your{' '}
                                <strong>Student Number</strong>,{' '}
                                <strong>Last Name</strong>, and{' '}
                                <strong>Date of Birth</strong>. You may register
                                with your current personal email address.
                            </div>
                        ) : (
                            <div className="rounded-xl border border-teal-600/25 bg-teal-500/10 px-3.5 py-2.5 text-xs leading-5 text-teal-950 dark:border-teal-400/25 dark:bg-teal-950/50 dark:text-teal-200">
                                Create an Employer Partner workspace to post
                                career opportunities for{' '}
                                <strong>SEAIT</strong> graduates. New company
                                profiles undergo coordinator verification before
                                job postings are published.
                            </div>
                        )}

                        {errors.student_number &&
                            registrationType === 'alumni' && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#E47818]" />
                                        <div className="space-y-2">
                                            <p className="font-semibold">
                                                Registrar Verification Assistance Logged
                                            </p>
                                            <p className="leading-5">
                                                {errors.student_number}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                                <Link
                                                    href={assistanceUrl}
                                                    className="inline-flex items-center rounded-lg bg-[#E47818] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#F36C21]"
                                                >
                                                    Check or add notes to request →
                                                </Link>
                                                <span className="text-xs text-amber-800 dark:text-amber-300">
                                                    Or correct any typo below and submit again.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        <div className="grid gap-4">
                            {registrationType === 'employer' ? (
                                <>
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
                                        <InputError
                                            message={errors.company_name}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="industry">
                                                Industry
                                            </Label>
                                            <Input
                                                id="industry"
                                                type="text"
                                                name="industry"
                                                placeholder="Information Technology"
                                            />
                                            <InputError
                                                message={errors.industry}
                                            />
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
                                            <InputError
                                                message={errors.website}
                                            />
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
                                </>
                            ) : (
                                <fieldset className="grid gap-3.5 rounded-xl border border-zinc-200 bg-[#F5F4EE]/55 p-4 dark:border-white/15 dark:bg-zinc-900/50">
                                    <legend className="px-1.5 text-xs font-bold tracking-wider text-[#001c17] uppercase dark:text-orange-300">
                                        Step 1 · Registrar Identity Match
                                    </legend>

                                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="student_number">
                                                Student number
                                            </Label>
                                            <Input
                                                id="student_number"
                                                type="text"
                                                required
                                                autoFocus
                                                autoComplete="off"
                                                name="student_number"
                                                placeholder="2020-00123"
                                            />
                                            <InputError
                                                message={errors.student_number}
                                            />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="date_of_birth">
                                                Date of birth
                                            </Label>
                                            <Input
                                                id="date_of_birth"
                                                type="date"
                                                required
                                                autoComplete="bday"
                                                name="date_of_birth"
                                            />
                                            <InputError
                                                message={errors.date_of_birth}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="name">
                                            Full name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            autoComplete="name"
                                            name="name"
                                            value={fullName}
                                            onChange={(event) =>
                                                handleFullNameChange(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Juan M. Dela Cruz"
                                        />
                                        <InputError
                                            message={errors.name}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <Label htmlFor="last_name">
                                                Last name on Registrar record
                                            </Label>
                                            <span className="text-xs text-muted-foreground">
                                                Auto-filled · edit if maiden name differs
                                            </span>
                                        </div>
                                        <Input
                                            id="last_name"
                                            type="text"
                                            required
                                            autoComplete="family-name"
                                            name="last_name"
                                            value={lastName}
                                            onChange={(event) => {
                                                setLastNameManuallyEdited(true);
                                                setLastName(event.target.value);
                                            }}
                                            placeholder="Dela Cruz"
                                        />
                                        <InputError
                                            message={errors.last_name}
                                        />
                                    </div>
                                </fieldset>
                            )}

                            <fieldset className="grid gap-3.5 rounded-xl border border-zinc-200 p-4 dark:border-white/15">
                                <legend className="px-1.5 text-xs font-bold tracking-wider text-zinc-700 uppercase dark:text-zinc-300">
                                    {registrationType === 'employer'
                                        ? 'Account Credentials'
                                        : 'Step 2 · Account Login Credentials'}
                                </legend>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        {registrationType === 'employer'
                                            ? 'Corporate email address'
                                            : 'Personal email address'}
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
                                className="mt-1 w-full bg-[#E47818] font-bold text-white shadow-sm hover:bg-[#F36C21]"
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {registrationType === 'employer'
                                    ? 'Register employer account'
                                    : 'Claim SEAIT alumni account'}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()}>
                                Log in
                            </TextLink>
                        </div>
                        {registrationType === 'alumni' && (
                            <p className="text-center text-sm text-muted-foreground">
                                Can’t verify your alumni details?{' '}
                                <Link
                                    href={assistanceUrl}
                                    className="font-semibold text-[#E47818] underline underline-offset-4"
                                >
                                    Request Registrar assistance
                                </Link>
                            </p>
                        )}
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create a SEAIT Portal Account',
    description:
        'Claim your official SEAIT alumni record or register as a verified employer partner',
};
