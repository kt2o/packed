// lib/supabase-client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { PropsWithChildren } from 'react'

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Client-side Supabase hook using Clerk
export function useSupabase(): SupabaseClient {
  const { getToken } = useAuth()

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken({ template: 'supabase' })
        const headers = new Headers(options.headers)
        if (token) headers.set('Authorization', `Bearer ${token}`)

        return fetch(url, { ...options, headers })
      },
    },
  })
  
}
