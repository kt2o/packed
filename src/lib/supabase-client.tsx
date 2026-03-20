// lib/supabase-client.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { PropsWithChildren } from "react";
import * as SecureStore from "expo-secure-store";

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;


// Client-side Supabase hook using Clerk
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: SecureStore,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
