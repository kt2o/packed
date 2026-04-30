/**
 * Supabase function to synchronize Clerk user events into the Supabase user table.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { data, type } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  if (type === 'user.created' || type === 'user.updated') {
  
    const { id, first_name, last_name, image_url, email_addresses, username } = data;
    const email = email_addresses[0]?.email_address;

    const { error } = await supabase
      .from('user_database')
      .upsert({ 
        id,
        user_email: email,
        username
      }, { onConflict: 'id' })

    if (error) {
      console.error("Supabase Error:", error.message);
      return new Response(error.message, { status: 400 });
    }
  }

  return new Response(JSON.stringify({ success: true }), { 
    headers: { "Content-Type": "application/json" } 
  })
})