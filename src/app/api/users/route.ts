import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NAME_PATTERN = /^[\p{L}\p{M}'’\- ]{1,30}$/u;

export async function GET() {
  const { data, error } = await supabase
    .from("jar_users")
    .select("name")
    .order("id", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ users: (data ?? []).map((r) => r.name as string) });
}

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => ({}));
  const rawName = typeof body?.name === "string" ? body.name.trim() : "";

  if (!rawName || !NAME_PATTERN.test(rawName)) {
    return Response.json(
      { error: "Name must be 1–30 letters, spaces, hyphens, or apostrophes" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("jar_users")
    .insert({ name: rawName });

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Name already exists" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, name: rawName });
}
