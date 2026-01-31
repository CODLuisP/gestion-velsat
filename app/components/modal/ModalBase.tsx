"use client";

type ModalBaseProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  tamaño?: string
};

export default function ModalBase({
  open,
  title,
  onClose,
  children,
  tamaño,
}: ModalBaseProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`bg-white rounded-md p-8 ${tamaño ?? "w-full max-w-3xl"}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-blue-600">{title} </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-orange-500 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

