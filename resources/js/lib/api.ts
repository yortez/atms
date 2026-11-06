export type ApiEnvelope<T> = {
    data: T;
};

export type PaginatedApiResponse<T> = {
    data: T[];
    links?: Record<string, string | null>;
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

type JsonRequestOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown> | FormData;
    signal?: AbortSignal;
};

type ApiErrorResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

export class ApiError extends Error {
    status: number;
    errors: Record<string, string[]>;

    constructor(
        message: string,
        status: number,
        errors: Record<string, string[]> = {},
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}

function csrfToken(): string | undefined {
    const cookie = document.cookie
        .split('; ')
        .find((value) => value.startsWith('XSRF-TOKEN='));

    return cookie
        ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
        : document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
              ?.content;
}

export async function apiRequest<T>(
    path: string,
    { method = 'GET', body, signal }: JsonRequestOptions = {},
): Promise<T> {
    const headers = new Headers({
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    });
    const token = csrfToken();

    if (token) {
        headers.set('X-XSRF-TOKEN', token);
    }

    const isFormData = body instanceof FormData;

    if (body !== undefined && !isFormData) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(path, {
        method,
        credentials: 'same-origin',
        headers,
        body: body === undefined ? undefined : (isFormData ? body : JSON.stringify(body)),
        signal,
    });
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
        throw new ApiError(
            response.ok
                ? 'The server returned an unexpected response.'
                : `Request failed with status ${response.status}.`,
            response.status,
        );
    }

    const payload = (await response.json()) as
        | ApiErrorResponse
        | Record<string, unknown>;

    if (!response.ok) {
        const errorPayload = payload as ApiErrorResponse;
        throw new ApiError(
            errorPayload.message ??
                `Request failed with status ${response.status}.`,
            response.status,
            errorPayload.errors,
        );
    }

    return payload as T;
}
