/**
 * Data access layer for the todo list feature.
 *
 * All exported functions are thin wrappers around Supabase operations.
 */
import { supabase } from "../../lib/supabase-client";

type TodoInsert = {
  title: string;
  user_id: string;
  is_completed: boolean;
  deadline_at: string | null;
};

/**
 * Fetch all todos for a specific user.
 */
export async function fetchTodosByUser(userId: string) {
  return supabase.from("todo_list").select("*").eq("user_id", userId);
}

/**
 * Insert a new todo item into Supabase.
 */
export async function createTodo(todo: TodoInsert) {
  return supabase.from("todo_list").insert([todo]).select().single();
}

/**
 * Update the completed status of a todo.
 */
export async function updateTodoCompletion(todoId: string, isCompleted: boolean) {
  return supabase
    .from("todo_list")
    .update({ is_completed: isCompleted })
    .eq("id", todoId)
    .select()
    .single();
}

/**
 * Change the title of a todo item.
 */
export async function updateTodoTitle(todoId: string, title: string) {
  return supabase
    .from("todo_list")
    .update({ title })
    .eq("id", todoId)
    .select()
    .single();
}

/**
 * Remove todo item from Supabase.
 */
export async function removeTodo(todoId: string) {
  return supabase.from("todo_list").delete().eq("id", todoId);
}