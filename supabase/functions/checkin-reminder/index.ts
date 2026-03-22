export const config = {
runtime: "edge",
regions: ["iad"],
public: true,
};

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
if (req.method !== "POST") {
return new Response("Method not allowed", { status: 405 });
}

// Use correct server-side secrets
  const supabase = createClient(
Deno.env.get("EXPO_PUBLIC_SUPABASE_URL")!,
Deno.env.get("EXPO_PUBLIC_SUPABASE_SERVICE_ROLE")!
);

console.log("Fetching due check-ins...");

const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  console.log("Cutoff:", cutoff);

// 1. Find check-ins older than cutoff
  const { data: due, error } = await supabase
.from("study_spot_status")
.select("id, user_id, created_at, reminder_sent")
.lte("created_at", cutoff)
.or("reminder_sent.is.null,reminder_sent.eq.false");

if (error) console.error("Error fetching due:", error);
console.log("Due rows:", JSON.stringify(due, null, 2));

if (!due || due.length === 0) {
console.log("No due rows.");
return new Response("ok", { status: 200 });
}

// 2. Process each due row
  for (const row of due) {
console.log("Processing row:", row);

const { data: tokenRows, error: tokenError } = await supabase
.from("user_push_notifications")
.select("expo_push_token")
.eq("user_id", row.user_id);

if (tokenError) {
console.error("Error fetching tokens:", tokenError);
continue;
}

console.log("Token rows:", tokenRows);

if (!tokenRows || tokenRows.length === 0) {
console.log("No tokens found for user:", row.user_id);
continue;
}

// 3. Send push notifications for each token
    for (const token of tokenRows) {
if (!token.expo_push_token) {
console.log("Skipping invalid token:", token);
continue;
}

console.log("Sending push to:", token.expo_push_token);

const pushRes = await fetch("https://exp.host/--/api/v2/push/send", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify([
{
to: token.expo_push_token,
title: "Don't Lose Your Streak ‼️ ",
body: "Time to get back to studying🧑‍💻",
},
]),
});

console.log("Expo push response status:", pushRes.status);
const pushJson = await pushRes.json().catch(() => null);
console.log("Expo push response body:", pushJson);
}

// 4. Mark reminder as sent
    console.log("Updating reminder_sent for:", row.id);

const { error: updateError } = await supabase
.from("study_spot_status")
.update({ reminder_sent: true })
.eq("id", row.id);

if (updateError) {
console.error("Error updating reminder_sent:", updateError);
} else {
console.log("Updated reminder_sent for:", row.id);
}
}

return new Response("ok", { status: 200 });
});
