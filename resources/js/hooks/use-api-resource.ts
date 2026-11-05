import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';

type ApiResourceState<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
};

export function useApiResource<T>(url: string | null) {
    const [state, setState] = useState<ApiResourceState<T>>({
        data: null,
        loading: url !== null,
        error: null,
    });
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        if (url === null) {
            setState({ data: null, loading: false, error: null });
            return;
        }

        const controller = new AbortController();
        setState({ data: null, loading: true, error: null });

        apiRequest<T>(url, { signal: controller.signal })
            .then((data) => {
                setState({ data, loading: false, error: null });
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                const message =
                    error instanceof Error
                        ? error.message
                        : 'The requested data could not be loaded.';
                setState({ data: null, loading: false, error: message });
                toast.error(message);
            });

        return () => controller.abort();
    }, [url, reloadCount]);

    return {
        ...state,
        reload: () => setReloadCount((count) => count + 1),
    };
}
