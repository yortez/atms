import { useState, type ReactNode } from 'react';
import { AlertTriangle, CircleHelp } from 'lucide-react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Props = {
    children: ReactNode;
    title: string;
    description: string;
    confirmLabel?: string;
    pendingLabel?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => Promise<boolean>;
};

export default function ConfirmationDialog({
    children,
    title,
    description,
    confirmLabel = 'Delete',
    pendingLabel = 'Deleting…',
    variant = 'destructive',
    onConfirm,
}: Props) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    async function confirm() {
        setProcessing(true);

        try {
            if (await onConfirm()) {
                setOpen(false);
            }
        } finally {
            setProcessing(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!processing) {
                    setOpen(nextOpen);
                }
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="gap-6">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {variant === 'destructive' ? (
                    <div className="flex gap-3 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                        <AlertTriangle
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-100"
                        />
                        <DialogDescription className="text-red-700 dark:text-red-100">
                            {description}
                        </DialogDescription>
                    </div>
                ) : (
                    <div className="flex gap-3 rounded-lg border border-[#e8eae4] bg-[#f7f8f5] p-4">
                        <CircleHelp
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-[#687367]"
                        />
                        <DialogDescription>{description}</DialogDescription>
                    </div>
                )}
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" disabled={processing}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        variant={
                            variant === 'destructive'
                                ? 'destructive'
                                : 'default'
                        }
                        onClick={() => void confirm()}
                        disabled={processing}
                    >
                        {processing ? pendingLabel : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
