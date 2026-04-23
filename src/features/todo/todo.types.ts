export type Todo = {
    id: string;
    user_id: string;
    title: string;
    is_completed: boolean;
    created_at: string;
    deadline_at: string | null;
  };
  
  export type TodoFilter = "all" | "active" | "completed";
  export type DeadlineStatus =
    | "none"
    | "normal"
    | "oneWeek"
    | "threeDays"
    | "oneDay"
    | "overdue"
    | "completed";