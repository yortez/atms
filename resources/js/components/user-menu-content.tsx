import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import ConfirmationDialog from '@/components/confirmation-dialog';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () =>
        new Promise<boolean>((resolve) => {
            cleanup();
            router.flushAll();
            router.post(
                logout().url,
                {},
                {
                    onSuccess: () => resolve(true),
                    onError: () => resolve(false),
                },
            );
        });

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        Account settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <ConfirmationDialog
                title="Log out?"
                description="Are you sure you want to log out of your account?"
                confirmLabel="Log out"
                pendingLabel="Logging out…"
                variant="default"
                onConfirm={handleLogout}
            >
                <DropdownMenuItem asChild>
                    <button
                        type="button"
                        className="w-full cursor-pointer"
                        data-test="logout-button"
                    >
                        <LogOut />
                        Log out
                    </button>
                </DropdownMenuItem>
            </ConfirmationDialog>
        </>
    );
}
