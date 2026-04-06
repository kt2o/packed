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

// 1. Calculate the 48-hour window
const now = new Date();
// 48 hours from now
const startWindow = new Date(now.getTime() + (48 * 60 * 60 * 1000)).toISOString();
// 49 hours from now (to catch everything in a 1-hour cron cycle)
const endWindow = new Date(now.getTime() + (49 * 60 * 60 * 1000)).toISOString();

console.log(`Checking deadlines between ${startWindow} and ${endWindow}`);

// 2. Fetch rows within that specific 48-hour-out window
const { data: due, error } = await supabase
.from("todo_list")
.select("id, user_id, title, is_completed, deadline_at")
.eq("is_completed", false) // Filter for incomplete
  .gte("deadline_at", startWindow) // Deadline is at least 48h away
  .lte("deadline_at", endWindow)   // But no more than 49h away
  .is("reminder_sent.is.null,reminder_sent.eq.false");

if (error) {
console.error("Error fetching due rows:", error);
return new Response("Error", { status: 500 });
}

if (!due || due.length === 0) {
console.log("No due rows.");
return new Response("ok", { status: 200 });
}

// 3. Process each due row
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

// 4. Send push notifications for each token
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
title: "You have task coming up",
body: "Time to get to work ⏰",
},
]),
});

console.log("Expo push response status:", pushRes.status);
const pushJson = await pushRes.json().catch(() => null);
console.log("Expo push response body:", pushJson);
}

// 5. Mark reminder as sent
console.log("Updating reminder_sent for:", row.id);

const { error: updateError } = await supabase
.from("todo_list")
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
