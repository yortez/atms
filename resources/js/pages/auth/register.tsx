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

    return (
        <>
            <Head
                title={
                    registrationType === 'employer'
                        ? 'Employer Registration'
                        : 'Claim Alumni Account'
                }
            />

            {/* Role Registration Switcher */}
            <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-xl border border-[#e3e7df] bg-[#f7f8f5] p-1">
                <button
                    type="button"
                    onClick={() => setRegistrationType('alumni')}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${registrationType === 'alumni'
                            ? 'bg-[#2b5139] text-white shadow-xs'
                            : 'text-[#5a665b] hover:text-[#2b382e]'
                        }`}
                >
                    <GraduationCap className="size-3.5" />
                    Alumni Claim
                </button>
                <button
                    type="button"
                    onClick={() => setRegistrationType('employer')}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${registrationType === 'employer'
                            ? 'bg-[#2b5139] text-white shadow-xs'
                            : 'text-[#5a665b] hover:text-[#2b382e]'
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
                            <div className="rounded-xl border border-[#dfe7dc] bg-[#f4f7f2] px-3.5 py-2.5 text-xs leading-5 text-[#465a49]">
                                Verify your official graduate record using your{' '}
                                <strong>Student Number</strong>,{' '}
                                <strong>Last Name</strong>, and{' '}
                                <strong>Date of Birth</strong>. You may register
                                with your current personal email address.
                            </div>
                        ) : (
                            <div className="rounded-xl border border-[#dfe7dc] bg-[#f4f7f2] px-3.5 py-2.5 text-xs leading-5 text-[#465a49]">
                                Create an Employer Partner workspace to post
                                career opportunities for Northfield graduates.
                                New company profiles undergo staff verification
                                before job postings are published.
                            </div>
                        )}

                        {errors.student_number &&
                            registrationType === 'alumni' && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-[#ebd5ce] bg-[#fcf5f3] p-3.5 text-xs text-[#7d3f34]"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#9c4b3d]" />
                                        <div>
                                            <p className="font-semibold">
                                                Verification Assistance Logged
                                            </p>
                                            <p className="mt-1 leading-5">
                                                {errors.student_number}
                                            </p>
                                            <Link
                                                href={assistanceUrl}
                                                className="mt-2 inline-block font-semibold underline underline-offset-4"
                                            >
                                                Add notes to your assistance
                                                request →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                        <div className="grid gap-4">
                            {registrationType === 'employer' && (
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
                                            placeholder="Northstar Digital Inc."
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
                                </>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    {registrationType === 'employer'
                                        ? 'Representative full name'
                                        : 'Full name'}
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus={registrationType === 'alumni'}
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Juan Dela Cruz"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-1"
                                />
                            </div>

                            {registrationType === 'alumni' && (
                                <>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="last_name">
                                                Last name (on record)
                                            </Label>
                                            <Input
                                                id="last_name"
                                                type="text"
                                                tabIndex={2}
                                                autoComplete="family-name"
                                                name="last_name"
                                                placeholder="Dela Cruz"
                                            />
                                            <InputError
                                                message={errors.last_name}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="student_number">
                                                Student number
                                            </Label>
                                            <Input
                                                id="student_number"
                                                type="text"
                                                required
                                                tabIndex={2}
                                                autoComplete="off"
                                                name="student_number"
                                                placeholder="2020-00123"
                                            />
                                            <InputError
                                                message={errors.student_number}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="date_of_birth">
                                            Date of birth
                                        </Label>
                                        <Input
                                            id="date_of_birth"
                                            type="date"
                                            required
                                            tabIndex={3}
                                            autoComplete="bday"
                                            name="date_of_birth"
                                        />
                                        <InputError
                                            message={errors.date_of_birth}
                                        />
                                    </div>
                                </>
                            )}

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
                                    tabIndex={4}
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
                                    tabIndex={5}
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
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full bg-[#2b5139] hover:bg-[#234530]"
                                tabIndex={7}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {registrationType === 'employer'
                                    ? 'Register employer account'
                                    : 'Claim alumni account'}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={8}>
                                Log in
                            </TextLink>
                        </div>
                        {registrationType === 'alumni' && (
                            <p className="text-center text-sm text-muted-foreground">
                                Can’t verify your alumni details?{' '}
                                <Link
                                    href={assistanceUrl}
                                    className="text-foreground underline underline-offset-4"
                                >
                                    Request administrative assistance
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
    title: 'Create an account',
    description:
        'Claim your Northfield alumni record or register as an employer partner',
};
