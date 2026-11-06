import { Form, Head, Link, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login, register } from '@/routes';

type ProgramOption = {
    id: number;
    code: string;
    name: string;
};

type LookupResult = {
    id: number;
    name: string;
    student_number: string;
    program: string | null;
    graduation_year: number | null;
    status: 'pending' | 'reviewed' | 'needs_more_information' | 'rejected';
    resolution_action: string | null;
    review_note: string | null;
    created_at: string | null;
    reviewed_at: string | null;
};

type Props = {
    status?: string;
    reference?: string;
    programs?: ProgramOption[];
    lookupResult?: LookupResult | null;
    lookupError?: string | null;
};

export default function RegistrationAssistance({
    status,
    reference,
    programs = [],
    lookupResult = null,
    lookupError = null,
}: Props) {
    const [activeMode, setActiveMode] = useState<'submit' | 'lookup'>(
        lookupResult || lookupError ? 'lookup' : 'submit',
    );
    const [lookupReference, setLookupReference] = useState(() => {
        if (reference) return String(reference);
        if (lookupResult?.id) return String(lookupResult.id);
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search).get('lookup_reference') ?? '';
        }
        return '';
    });
    const [lookupIdentifier, setLookupIdentifier] = useState(() => {
        if (lookupResult?.student_number) return lookupResult.student_number;
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search).get('lookup_identifier') ?? '';
        }
        return '';
    });
    const [lookingUp, setLookingUp] = useState(false);

    function handleLookupSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!lookupReference.trim() || !lookupIdentifier.trim()) return;
        setLookingUp(true);
        router.get(
            '/alumni/registration-assistance',
            {
                lookup_reference: lookupReference.trim(),
                lookup_identifier: lookupIdentifier.trim(),
            },
            {
                preserveState: true,
                onFinish: () => setLookingUp(false),
            },
        );
    }

    function getStatusBadge(s: LookupResult['status']) {
        switch (s) {
            case 'reviewed':
                return {
                    label: 'Approved & Resolved',
                    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                };
            case 'needs_more_information':
                return {
                    label: 'Needs More Information',
                    className: 'border-blue-200 bg-blue-50 text-blue-900',
                };
            case 'rejected':
                return {
                    label: 'Rejected',
                    className: 'border-red-200 bg-red-50 text-red-900',
                };
            default:
                return {
                    label: 'Pending Coordinator Review',
                    className: 'border-amber-200 bg-amber-50 text-amber-900',
                };
        }
    }

    return (
        <>
            <Head title="Alumni registration assistance" />

            {/* Mode Switcher */}
            <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-muted/40 p-1">
                <button
                    type="button"
                    onClick={() => setActiveMode('submit')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        activeMode === 'submit'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Submit Claim Request
                </button>
                <button
                    type="button"
                    onClick={() => setActiveMode('lookup')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        activeMode === 'lookup'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Check Request Status
                </button>
            </div>

            {activeMode === 'lookup' ? (
                <div className="flex flex-col gap-5">
                    <p className="text-sm text-muted-foreground">
                        Enter your request reference number and student number (or email address) to check if your claim request has been resolved.
                    </p>

                    <form onSubmit={handleLookupSubmit} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="lookup_reference">Request reference number</Label>
                            <Input
                                id="lookup_reference"
                                value={lookupReference}
                                onChange={(e) => setLookupReference(e.target.value)}
                                placeholder="e.g. 12"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lookup_identifier">Student number or email address</Label>
                            <Input
                                id="lookup_identifier"
                                value={lookupIdentifier}
                                onChange={(e) => setLookupIdentifier(e.target.value)}
                                placeholder="Enter your student number or email"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={lookingUp}>
                            {lookingUp && <Spinner />}
                            Check status
                        </Button>
                    </form>

                    {lookupError && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3.5 text-xs text-red-900">
                            {lookupError}
                        </div>
                    )}

                    {lookupResult && (
                        <div className="space-y-3 rounded-lg border border-border bg-card p-4 text-sm shadow-xs">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs text-muted-foreground">
                                    Reference #{lookupResult.id}
                                </span>
                                <span
                                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(lookupResult.status).className}`}
                                >
                                    {getStatusBadge(lookupResult.status).label}
                                </span>
                            </div>

                            <div className="space-y-1 text-xs text-muted-foreground">
                                <p>
                                    Applicant: <span className="font-medium text-foreground">{lookupResult.name}</span> ({lookupResult.student_number})
                                </p>
                                {lookupResult.program && (
                                    <p>
                                        Program: <span className="font-medium text-foreground">{lookupResult.program}</span>
                                        {lookupResult.graduation_year ? ` · Batch ${lookupResult.graduation_year}` : ''}
                                    </p>
                                )}
                            </div>

                            {lookupResult.review_note && (
                                <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
                                    <p className="font-semibold text-foreground">Coordinator Review Note:</p>
                                    <p className="mt-1 text-muted-foreground">{lookupResult.review_note}</p>
                                </div>
                            )}

                            {lookupResult.status === 'reviewed' && (
                                <div className="pt-1">
                                    {lookupResult.resolution_action === 'provision_account' ? (
                                        <Link
                                            href={login()}
                                            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90"
                                        >
                                            Proceed to Sign In
                                        </Link>
                                    ) : (
                                        <Link
                                            href={register()}
                                            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90"
                                        >
                                            Complete Alumni Registration Now
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : status ? (
                <div
                    className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900"
                    role="status"
                >
                    <p>{status}</p>
                    {reference && (
                        <div className="mt-2 space-y-2">
                            <p className="font-semibold">Request reference: #{reference}</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setLookupReference(String(reference));
                                    setActiveMode('lookup');
                                }}
                                className="text-xs font-medium underline underline-offset-4"
                            >
                                Track this request in the Status Checker →
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <Form
                    action="/alumni/registration-assistance"
                    method="post"
                    resetOnSuccess
                    disableWhileProcessing
                    className="flex flex-col gap-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <p className="text-sm text-muted-foreground">
                                If your details do not match the alumni records,
                                send a request for staff to review. An account
                                will not be created until your record is
                                confirmed.
                            </p>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoComplete="name"
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="student_number">
                                    Student number
                                </Label>
                                <Input
                                    id="student_number"
                                    name="student_number"
                                    required
                                    autoComplete="off"
                                />
                                <InputError message={errors.student_number} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="academic_program_id">
                                        Academic program
                                    </Label>
                                    <select
                                        id="academic_program_id"
                                        name="academic_program_id"
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        defaultValue=""
                                    >
                                        <option value="" className="bg-background text-foreground">
                                            Select program (optional)
                                        </option>
                                        {programs.map((program) => (
                                            <option
                                                key={program.id}
                                                value={program.id}
                                                className="bg-background text-foreground"
                                            >
                                                {program.code} — {program.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.academic_program_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="graduation_year">
                                        Graduation year
                                    </Label>
                                    <Input
                                        id="graduation_year"
                                        name="graduation_year"
                                        type="number"
                                        min={1950}
                                        max={2100}
                                        placeholder="e.g. 2024"
                                    />
                                    <InputError message={errors.graduation_year} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date_of_birth">
                                    Date of birth
                                </Label>
                                <Input
                                    id="date_of_birth"
                                    name="date_of_birth"
                                    type="date"
                                    required
                                    autoComplete="bday"
                                />
                                <InputError message={errors.date_of_birth} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="message">
                                    Additional information (optional)
                                </Label>
                                <textarea
                                    id="message"
                                    name="message"
                                    maxLength={1000}
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <InputError message={errors.message} />
                            </div>
                            <Button type="submit" className="w-full">
                                {processing && <Spinner />}
                                Submit assistance request
                            </Button>
                        </>
                    )}
                </Form>
            )}
            <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link href={login()} className="underline underline-offset-4">
                    Return to login
                </Link>
            </p>
        </>
    );
}

RegistrationAssistance.layout = {
    title: 'Alumni registration assistance',
    description: 'Ask the alumni office to review your registration details',
};
