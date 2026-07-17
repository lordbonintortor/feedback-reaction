import { FeedbackEntry, NewFeedbackEntry } from "./feedback";
import { createSupabaseAdmin } from "./supabase";

export async function listFeedback() {
  const { data, error } = await createSupabaseAdmin()
    .from("feedback")
    .select("id, rating, emoji, label, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load feedback from Supabase: ${error.message}`);

  return data.map((entry) => ({
    id: entry.id,
    rating: entry.rating,
    emoji: entry.emoji,
    label: entry.label,
    createdAt: entry.created_at
  })) satisfies FeedbackEntry[];
}

export async function createFeedback(entry: NewFeedbackEntry) {
  const { data, error } = await createSupabaseAdmin()
    .from("feedback")
    .insert({
      rating: entry.rating,
      emoji: entry.emoji,
      label: entry.label
    })
    .select("id, rating, emoji, label, created_at")
    .single();

  if (error) throw new Error(`Unable to save feedback to Supabase: ${error.message}`);

  return {
    id: data.id,
    rating: data.rating,
    emoji: data.emoji,
    label: data.label,
    createdAt: data.created_at
  } satisfies FeedbackEntry;
}
