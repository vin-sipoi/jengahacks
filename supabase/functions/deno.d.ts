declare namespace Deno {
    export interface Env {
        get(key: string): string | undefined;
        set(key: string, value: string): void;
        delete(key: string): void;
        toObject(): { [key: string]: string };
    }

    export const env: Env;

    export function exit(code?: number): void;
}

// Add other Deno-specific globals if needed
// For Supabase Edge Functions, Deno.env is the most commonly used global.
