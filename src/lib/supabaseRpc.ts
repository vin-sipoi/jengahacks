/**
 * Typed wrapper for Supabase RPC calls
 * Provides type-safe RPC function calls
 * 
 * Note: This module is designed for future RPC functions.
 * Currently no RPC functions are defined in the database.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Generic RPC call wrapper for future use
 * 
 * @example
 * ```typescript
 * const { data, error } = await callRpc('my_function', { param: 'value' });
 * ```
 */
export async function callRpc<T = unknown>(
  functionName: string,
  args: Record<string, unknown> = {}
): Promise<{
  data: T | null;
  error: Error | null;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)(functionName, args);

    if (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }

    return {
      data: data as T,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Generic RPC call wrapper that throws on error
 * 
 * @example
 * ```typescript
 * const result = await callRpcOrThrow('my_function', { param: 'value' });
 * ```
 */
export async function callRpcOrThrow<T = unknown>(
  functionName: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const { data, error } = await callRpc<T>(functionName, args);

  if (error) {
    throw error;
  }

  if (data === null) {
    throw new Error(`RPC function ${functionName} returned null`);
  }

  return data;
}
