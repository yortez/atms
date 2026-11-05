import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';

type Props = {
    status?: string;
    reference?: string;
};

export default function RegistrationAssistance({ status, reference }: Props) {
    return (
        <>
            <Head title="Alumni registration assistance" />
            {status ? (
                <div
                    className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900"
                    role="status"
                >
                    <p>{status}</p>
                    {reference && (
                        <p className="mt-1">Request reference: {reference}</p>
                    )}
                </div>
            ) : (
                <Form
                    action="/alumni/registration-assistance"
                    method="post"
                    resetOnSuccess
                    disableWhileProcessing
                    className="flex flex-col gap-6"
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
                                    rows={4}
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
