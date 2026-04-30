import { useSupabase } from "src/lib/supabase-client";
import LocationDropDown from "../../../components/LocationDropDown";
import { useUser } from "@clerk/clerk-expo";

/**
 * Chat room selection screen.
 *
 * Intended to let the user choose a chat room or spot-based conversation.
 */
export default function ChatRoomSelect() {
    const user = useUser();
    const supabase = useSupabase();
}
