import { useSupabase } from "src/lib/supabase-client";
import LocationDropDown from "../../../components/LocationDropDown";
import { useUser } from "@clerk/clerk-expo";

export default function ChatRoomSelect() {
    const user = useUser();
    const supabase = useSupabase();
}
