import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const suggestion_id = Number(body?.suggestion_id);
  const voter = body?.voter;

  if (!Number.isInteger(suggestion_id) || suggestion_id <= 0) {
    return Response.json({ error: "Invalid suggestion id" }, { status: 400 });
  }
  if (!voter || typeof voter !== "string") {
    return Response.json({ error: "Invalid voter" }, { status: 400 });
  }

  const { data: userRow } = await supabase
    .from("jar_users")
    .select("name")
    .eq("name", voter)
    .maybeSingle();
  if (!userRow) {
    return Response.json({ error: "Invalid voter" }, { status: 400 });
  }

  const existing = await supabase
    .from("jar_suggestion_votes")
    .select("id")
    .eq("suggestion_id", suggestion_id)
    .eq("voter", voter)
    .maybeSingle();

  if (existing.error) {
    return Response.json({ error: existing.error.message }, { status: 500 });
  }

  if (existing.data) {
    const { error } = await supabase
      .from("jar_suggestion_votes")
      .delete()
      .eq("id", existing.data.id);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ approved: false });
  }

  const { error } = await supabase
    .from("jar_suggestion_votes")
    .insert({ suggestion_id, voter });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ approved: true });
}
