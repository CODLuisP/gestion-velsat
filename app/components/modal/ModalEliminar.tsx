"use client";

type ModalEliminarProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  tamaño?: string
};

export default function ModalEliminar({
  open,
  title,
  onClose,
  children,
  tamaño,
}: ModalEliminarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`bg-white rounded-md py-4 ${tamaño ?? "w-full max-w-3xl"}`}>
        <div className="flex justify-center items-center">
          <h2 className="text-xl font-semibold text-sky-950">{title}</h2>
        </div>

        {children}
      </div>
    </div>
  );
}

