// Deno type declarations for Supabase Edge Functions
// This file provides type definitions for the Deno runtime

declare namespace Deno {
    export interface Env {
        get(key: string): string | undefined;
        toObject(): Record<string, string>;
    }

    export const env: Env;

    export interface ConnectTlsOptions {
        hostname: string;
        port: number;
        certFile?: string;
    }

    export function connectTls(options: ConnectTlsOptions): Promise<Conn>;

    export interface Conn {
        readonly rid: number;
        readonly localAddr: Addr;
        readonly remoteAddr: Addr;
        read(p: Uint8Array): Promise<number | null>;
        write(p: Uint8Array): Promise<number>;
        close(): void;
    }

    export interface Addr {
        transport: string;
        hostname: string;
        port: number;
    }
}

// Deno standard library HTTP server types
declare module "https://deno.land/std@0.168.0/http/server.ts" {
    /**
     * Serves HTTP requests with the given handler.
     * @param handler The handler function that processes requests
     * @returns A promise that resolves when the server is ready
     */
    export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

// Supabase client types
declare module "https://esm.sh/@supabase/supabase-js@2" {
    export function createClient(url: string, key: string): any;
}
