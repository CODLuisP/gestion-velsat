import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.delete("auth");
  res.cookies.delete("role");
  res.cookies.delete("usuario");

  return res;
}
