import { monitor } from './monitoring';
import { getCacheHeaders } from './cache';

/**
 * A wrapper around window.fetch that tracks response times and errors.
 * This is used to instrument the Supabase client.
 * Also applies appropriate cache headers based on request type.
 */
export const monitoredFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> => {
    const start = performance.now();
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Extract endpoint for cleaner metrics (remove query params)
    let endpoint = url;
    try {
        const urlObj = new URL(url);
        endpoint = urlObj.pathname;
    } catch {
        // If not a valid URL (e.g. relative path), keep as is
    }

    // Determine cache type based on URL or request
    const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(url);
    const cacheType = isStaticAsset ? 'static' : 'api';

    // Merge cache headers with existing headers
    const cacheHeaders = getCacheHeaders(cacheType);
    // Merge headers from Request object, init options, and cache logic
    const headers = new Headers(input instanceof Request ? input.headers : init?.headers);
    if (init?.headers) {
        new Headers(init.headers).forEach((value, key) => {
            headers.set(key, value);
        });
    }

    // Merge cache headers with existing headers
    Object.entries(cacheHeaders).forEach(([key, value]) => {
        if (!headers.has(key)) {
            headers.set(key, value);
        }
    });

    const fetchOptions: RequestInit = {
        ...init,
        headers,
    };

    try {
        const response = await fetch(input, fetchOptions);
        const duration = performance.now() - start;

        monitor.trackApiResponseTime(endpoint, duration, response.ok);

        return response;
    } catch (error) {
        const duration = performance.now() - start;

        // Log network errors
        monitor.trackApiResponseTime(endpoint, duration, false);

        if (error instanceof Error) {
            // Add more context for debugging
            const errorContext: Record<string, unknown> = {
                context: 'monitoredFetch',
                endpoint,
                duration,
                url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
            };
            
            // Add request method if available
            if (fetchOptions?.method) {
                errorContext.method = fetchOptions.method;
            }
            
            // Add headers info (without sensitive data)
            if (fetchOptions?.headers) {
                const headers = new Headers(fetchOptions.headers);
                errorContext.hasAuth = headers.has('authorization');
                errorContext.hasApiKey = headers.has('apikey');
            }
            
            monitor.trackError(error, errorContext);
        }

        throw error;
    }
};
