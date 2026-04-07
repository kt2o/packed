import { supabase } from "../../lib/supabase-client";

type TodoInsert = {
  title: string;
  user_id: string;
  is_completed: boolean;
  deadline_at: string | null;
};

export async function fetchTodosByUser(userId: string) {
  return supabase.from("todo_list").select("*").eq("user_id", userId);
}

export async function createTodo(todo: TodoInsert) {
  return supabase.from("todo_list").insert([todo]).select().single();
}

export async function updateTodoCompletion(todoId: string, isCompleted: boolean) {
  return supabase
    .from("todo_list")
    .update({ is_completed: isCompleted })
    .eq("id", todoId)
    .select()
    .single();
}

export async function updateTodoTitle(todoId: string, title: string) {
  return supabase
    .from("todo_list")
    .update({ title })
    .eq("id", todoId)
    .select()
    .single();
}

export async function removeTodo(todoId: string) {
  return supabase.from("todo_list").delete().eq("id", todoId);
}