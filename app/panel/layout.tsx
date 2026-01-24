import { Toaster } from "react-hot-toast";
import Sidebar from "../components/nav/Sidebar";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 min-h-0 min-w-0 overflow-hidden p-4">
        {children}
        <Toaster position="bottom-right" />
      </main>
    </div>
  );
}
