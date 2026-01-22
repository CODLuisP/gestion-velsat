"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, User, Car } from "lucide-react";

export default function Sidebar() {
  const [open, setOpen] = useState(true); // 👈 ABIERTO POR DEFECTO

  return (
    <aside
      className={`
        h-screen bg-zinc-900 text-white
        transition-all duration-300
        ${open ? "w-64" : "w-16"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-800">
        <span className="font-bold">
          {open ? "Panel" : ""}
        </span>

        {/* Hamburguesa */}
        <button
          onClick={() => setOpen(!open)}
          className="p-1 rounded hover:bg-zinc-800"
        >
          ☰
        </button>
      </div>

      {/* Menú */}
      <nav className="mt-4 flex flex-col gap-1 px-2">
        <Link
          href="/panel/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800"
        >
          <Home size={20} />
          {open && <span>Dashboard</span>}
        </Link>

        <Link
          href="/panel/usuarios"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800"
        >
          <User size={20} />
          {open && <span>Usuarios</span>}
        </Link>
        <Link
          href="/panel/unidades"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800"
        >
          <Car size={20} />
          {open && <span>Vehículos</span>}
        </Link>
      </nav>
    </aside>
  );
}
