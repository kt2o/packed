// supabase/functions/userstatus-reminder/index.ts

export const config = {
runtime: "edge",
regions: ["iad"],
public: true,
};

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
const supabase = createClient(
Deno.env.get("SUPABASE_URL")!,
Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const now = new Date().toISOString();

// 1. Get all check-ins where still_here_at <= now AND not sent yet
const { data: dueCheckins, error } = await supabase.rpc("get_due_checkins");

if (error) {
console.error("Error fetching due check-ins:", error);
return;
}

if (!dueCheckins || dueCheckins.length === 0) {
return new Response("No reminders due", { status: 200 });
}

// 2. Loop through each due check-in
  for (const checkin of dueCheckins) {
// Get the user's Expo push token
    const { data: tokenData, error: tokenError } = await supabase
.from("user_push_notifications")
.select("expo_push_token")
.eq("user_id", checkin.user_id)
.order("updated_at", { ascending: false })
.limit(1);

if (tokenError) {
console.error("Error fetching tokens:", tokenError);
continue;
}

if (!tokenData || tokenData.length === 0) {
console.log("No tokens found for user:", checkin.user_id);
continue;
}

for (const token of tokenData) {
if (!tokenData.expo_push_token) {
console.log("Skipping invalid token:", token);
continue;
}

}

const expoToken = tokenData[0].expo_push_token;
console.log("Sending push to:", expoToken);

// 3. Send the push notification
    await fetch("https://exp.host/--/api/v2/push/send", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
to: expoToken,
title: "Still studying📝 ⁉️",
body: "Are you still here?",
sound: "default",
data: { type: "still_here_check" },
}),
});

// 4. Mark reminder as sent
    await supabase
.from("study_spot_status")
.update({ still_here: true })
.eq("id", checkin.id);


const handleStillHereResponse = async (response: "yes" | "no") => {
setShowStillHerePrompt(false);

await supabase
.from("study_spot_status")
.update({ still_here_response: response })
.eq("user_id", checkin.user_id);

if (response === "no") {
await supabase
.from("study_spot_status")
.update({ checked_out_at: new Date().toISOString() })
.eq("user_id", checkin.user_id);
}
};
}

return new Response("Still-here reminders processed", { status: 200 });
});

function maybeSingle() {
throw new Error("Function not implemented.");
}

function setShowStillHerePrompt(arg0: boolean) {
throw new Error("Function not implemented.");
}
