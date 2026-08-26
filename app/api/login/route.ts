import { NextResponse } from "next/server";

const USERS = [
  { user: "admin", pass: "L226", role: "Servidor_107" },
  { user: "kath26", pass: "L226", role: "Servidor_107" },
  { user: "karl26", pass: "L226", role: "Servidor_107" },
  { user: "wil26", pass: "L226", role: "Servidor_107" },

  { user: "admin", pass: "L126", role: "Servidor_125" },
  { user: "kath26", pass: "L126", role: "Servidor_125" },
  { user: "karl26", pass: "L126", role: "Servidor_125" },
  { user: "wil26", pass: "L126", role: "Servidor_125" },

  { user: "admin", pass: "urbano", role: "Servidor_125_2" },
  { user: "kath26", pass: "urbano", role: "Servidor_125_2" },
  { user: "karl26", pass: "urbano", role: "Servidor_125_2" },
  { user: "wil26", pass: "urbano", role: "Servidor_125_2" },
];

export async function POST(req: Request) {
  const { usuario, password, remember } = await req.json();

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

  // Si "Mantener sesión iniciada" está marcado, la cookie persiste 30 días.
  // Si no, se omite maxAge y queda como cookie de sesión (se borra al cerrar el navegador).
  const cookieOptions = {
    httpOnly: true,
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  };

  res.cookies.set("auth", "true", cookieOptions);
  res.cookies.set("role", found.role, cookieOptions);
  res.cookies.set("usuario", found.user, cookieOptions);

  return res;
}
