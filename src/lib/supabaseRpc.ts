/**
 * Typed wrapper for Supabase RPC calls
 * Provides type-safe RPC function calls without using `as any`
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type RpcFunctionName = keyof Database["public"]["Functions"];

type RpcArgs<T extends RpcFunctionName> = Database["public"]["Functions"][T]["Args"];
type RpcReturns<T extends RpcFunctionName> = Database["public"]["Functions"][T]["Returns"];

/**
 * Type-safe RPC call wrapper
 * 
 * @example
 * ```typescript
 * const { data, error } = await callRpc('should_add_to_waitlist', {});
 * const { data: position } = await callRpc('get_waitlist_position', { p_email: 'user@example.com' });
 * ```
 */
export async function callRpc<T extends RpcFunctionName>(
  functionName: T,
  args: RpcArgs<T>
): Promise<{
  data: RpcReturns<T> | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.rpc(functionName, args as never);

    if (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }

    return {
      data: data as RpcReturns<T>,
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
 * Type-safe RPC call wrapper that throws on error
 * 
 * @example
 * ```typescript
 * const shouldWaitlist = await callRpcOrThrow('should_add_to_waitlist', {});
 * ```
 */
export async function callRpcOrThrow<T extends RpcFunctionName>(
  functionName: T,
  args: RpcArgs<T>
): Promise<RpcReturns<T>> {
  const { data, error } = await callRpc(functionName, args);

  if (error) {
    throw error;
  }

  if (data === null) {
    throw new Error(`RPC function ${functionName} returned null`);
  }

  return data;
}


