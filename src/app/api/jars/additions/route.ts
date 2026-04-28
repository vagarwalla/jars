import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const JARS = ["caveats", "good_girl"] as const;

function requireAdmin(request: Request): Response | null {
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
  return null;
}

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { data, error } = await supabase
    .from("jar_additions")
    .select("id, jar_name, amount, added_by, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ additions: data ?? [] });
}

export async function PATCH(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const id = Number(body?.id);
  const added_by = typeof body?.added_by === "string" ? body.added_by.trim() : "";
  const jar_name = body?.jar_name;

  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const update: { added_by?: string; jar_name?: string } = {};

  if (added_by) {
    const { data: userRow, error: userErr } = await supabase
      .from("jar_users")
      .select("name")
      .eq("name", added_by)
      .maybeSingle();
    if (userErr) {
      return Response.json({ error: userErr.message }, { status: 500 });
    }
    if (!userRow) {
      return Response.json({ error: "Unknown user" }, { status: 400 });
    }
    update.added_by = added_by;
  }

  if (jar_name !== undefined) {
    if (!JARS.includes(jar_name)) {
      return Response.json({ error: "Invalid jar name" }, { status: 400 });
    }
    update.jar_name = jar_name;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("jar_additions")
    .update(update)
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function DELETE(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  const id = idParam ? Number(idParam) : NaN;
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const { error } = await supabase.from("jar_additions").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
