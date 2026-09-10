import { NextResponse } from "next/server";

const PINS = {
  admin: process.env.ADMIN_PIN || "1111",
  gf: process.env.GF_PIN || "2222",
  mom: process.env.MOM_PIN || "3333",
};

const NAMES = {
  admin: process.env.ADMIN_NAME || "Admin",
  gf: process.env.GF_NAME || "Girlfriend",
  mom: process.env.MOM_NAME || "Mom",
};

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { role, pin } = body || {};
  if (!role || !PINS[role] || String(pin) !== String(PINS[role])) {
    return NextResponse.json({ error: "Wrong PIN. Try again." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, role, name: NAMES[role] });
  res.cookies.set("thanaweya_role", role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return res;
}
