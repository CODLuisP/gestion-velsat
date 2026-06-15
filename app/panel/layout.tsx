import { Toaster } from "react-hot-toast";
import Sidebar from "../components/nav/Sidebar";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0C0F]">
      <Sidebar />

      <main className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4">
        {children}
        
        <Toaster
          position="bottom-right"
          toastOptions={{
            // Estilos generales
            className:
              'bg-white border border-slate-200 shadow-md rounded-lg ' +
              'text-xs text-slate-800 flex items-center gap-2',

            // Tamaño del contenedor
            style: {
              padding: '6px 10px',
              minHeight: 'auto',
            },

            // Toast de éxito
            success: {
              className:
                'bg-emerald-50 text-xs text-emerald-800',
              iconTheme: {
                primary: '#059669', // verde
                secondary: '#ECFDF5',
              },
            },

            // Toast de error
            error: {
              className:
                'bg-red-50 text-red-800',
              iconTheme: {
                primary: '#DC2626',
                secondary: '#FEF2F2',
              },
            },
          }}
        />
      </main>
    </div>
  );
}
