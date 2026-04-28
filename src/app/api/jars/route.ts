import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("jar_additions")
    .select("jar_name, amount");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const totals = { caveats: 0, good_girl: 0 };
  for (const row of data ?? []) {
    if (row.jar_name === "caveats") totals.caveats += row.amount;
    if (row.jar_name === "good_girl") totals.good_girl += row.amount;
  }

  return Response.json(totals);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { jar_name, amount, added_by } = body;

  if (!["caveats", "good_girl"].includes(jar_name)) {
    return Response.json({ error: "Invalid jar name" }, { status: 400 });
  }

  if (!added_by || typeof added_by !== "string") {
    return Response.json({ error: "Invalid user" }, { status: 400 });
  }

  const { data: userRow, error: userErr } = await supabase
    .from("jar_users")
    .select("name")
    .eq("name", added_by)
    .maybeSingle();

  if (userErr) {
    return Response.json({ error: userErr.message }, { status: 500 });
  }
  if (!userRow) {
    return Response.json({ error: "Invalid user" }, { status: 400 });
  }

  const { error } = await supabase
    .from("jar_additions")
    .insert({ jar_name, amount: amount ?? 1, added_by });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const { jar_name } = body;

  if (!["caveats", "good_girl"].includes(jar_name)) {
    return Response.json({ error: "Invalid jar name" }, { status: 400 });
  }

  const { error } = await supabase
    .from("jar_additions")
    .delete()
    .eq("jar_name", jar_name);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
