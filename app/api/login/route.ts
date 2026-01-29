import { NextResponse } from "next/server";

const USERS = [
  { user: "admin", pass: "125", role: "Servidor_125" },
  { user: "admin", pass: "107", role: "Servidor_107" },
  { user: "admin", pass: "133", role: "Servidor_133" },
];

export async function POST(req: Request) {
  const { usuario, password } = await req.json();

  const found = USERS.find(
    (u) => u.user === usuario && u.pass === password
  );

  if (!found) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({
    ok: true,
    role: found.role,
  });

  res.cookies.set("auth", "true", {
    httpOnly: true,
    path: "/",
  });

  res.cookies.set("role", found.role, {
    httpOnly: true,
    path: "/",
  });

  return res;
}
