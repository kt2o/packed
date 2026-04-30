import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/clerk-expo";
import { useMemo } from "react";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Return a memoized Supabase client that attaches a Clerk auth token to each request.
 */
export function useSupabase() {
  const { getToken } = useAuth();


  return useMemo(() => {
    // Safety check: If these are missing, the app will crash with a clear message
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase environment variables are missing!");
      return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken({ template: "supabase" });
          const headers = new Headers(options.headers);

          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }

          return fetch(url, { ...options, headers });
        },
      },
      auth: {
        persistSession: false, // Clerk handles persistence, not Supabase
      }
    });
  }, [getToken]);
}