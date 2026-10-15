import { cookies } from "next/headers";
import { Toaster } from "react-hot-toast";
import Sidebar from "../components/nav/Sidebar";
import { Role } from "../constants/roles";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("usuario")?.value === "admin";
  const roleCookie = cookieStore.get("role")?.value as Role | undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-[#121214]">
      <Sidebar isAdmin={isAdmin} role={roleCookie} />

      <main className="flex-1 min-h-0 min-w-0 overflow-y-auto flex flex-col bg-[#121214]">
        {children}

        <Toaster
          position="bottom-right"
          toastOptions={{
            className:
              "bg-[#161719] border border-[#26272B] shadow-xl rounded-[8px] text-[13px] text-[#ECECEE] flex items-center gap-2 font-sans",
            style: {
              background: "#161719",
              color: "#ECECEE",
              border: "1px solid #26272B",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
            },
            success: {
              iconTheme: {
                primary: "#4ADE80",
                secondary: "#161719",
              },
            },
            error: {
              iconTheme: {
                primary: "#F05A28",
                secondary: "#161719",
              },
            },
          }}
        />
      </main>
    </div>
  );
}
