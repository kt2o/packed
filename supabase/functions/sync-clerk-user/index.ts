import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { data, type } = await req.json()

  // Initialize Supabase Admin Client (using Service Role Key)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Handle User Created or Updated events
  if (type === 'user.created' || type === 'user.updated') {
    const { id, first_name, last_name, image_url, email_addresses } = data;
    const email = email_addresses[0]?.email_address;

    const { error } = await supabase
      .from('users')
      .upsert({ 
        id, 
        first_name, 
        last_name, 
        image_url, 
        email 
      })

    if (error) return new Response(error.message, { status: 400 })
  }

  return new Response(JSON.stringify({ success: true }), { 
    headers: { "Content-Type": "application/json" } 
  })
})