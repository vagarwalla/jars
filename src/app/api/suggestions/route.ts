import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const JARS = ["caveats", "good_girl"] as const;
const USERS = ["Lily", "Jana", "Vaidehi"] as const;
const SUGGESTION_PATTERN = /^[\p{L}\p{N}\p{M}\p{P}\p{Zs}]{1,80}$/u;

export async function GET() {
  const [suggestionsRes, votesRes] = await Promise.all([
    supabase
      .from("jar_suggestions")
      .select("id, jar_name, suggestion, suggested_by, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("jar_suggestion_votes").select("suggestion_id, voter"),
  ]);

  if (suggestionsRes.error) {
    return Response.json({ error: suggestionsRes.error.message }, { status: 500 });
  }
  if (votesRes.error) {
    return Response.json({ error: votesRes.error.message }, { status: 500 });
  }

  const votesBySuggestion = new Map<number, string[]>();
  for (const v of votesRes.data ?? []) {
    const list = votesBySuggestion.get(v.suggestion_id) ?? [];
    list.push(v.voter);
    votesBySuggestion.set(v.suggestion_id, list);
  }

  const suggestions = (suggestionsRes.data ?? []).map((s) => ({
    id: s.id,
    jar_name: s.jar_name,
    suggestion: s.suggestion,
    suggested_by: s.suggested_by,
    created_at: s.created_at,
    voters: votesBySuggestion.get(s.id) ?? [],
  }));

  return Response.json({ suggestions });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const jar_name = body?.jar_name;
  const rawSuggestion = typeof body?.suggestion === "string" ? body.suggestion.trim() : "";
  const suggested_by = body?.suggested_by;

  if (!JARS.includes(jar_name)) {
    return Response.json({ error: "Invalid jar name" }, { status: 400 });
  }
  if (!suggested_by || !USERS.includes(suggested_by)) {
    return Response.json({ error: "Invalid user" }, { status: 400 });
  }
  if (!rawSuggestion || !SUGGESTION_PATTERN.test(rawSuggestion)) {
    return Response.json(
      { error: "Suggestion must be 1–80 characters" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("jar_suggestions")
    .insert({ jar_name, suggestion: rawSuggestion, suggested_by })
    .select("id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, id: data.id });
}

export async function DELETE(request: Request) {
  const expected = process.env.SETTINGS_PASSWORD;
  if (!expected) {
    return Response.json(
      { error: "Settings password not configured" },
      { status: 500 }
    );
  }

  const password = request.headers.get("x-settings-password");
  if (password !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  const id = idParam ? Number(idParam) : NaN;
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const { error } = await supabase.from("jar_suggestions").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
