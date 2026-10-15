"use client";

import React from "react";
import { X } from "lucide-react";

type ModalEliminarProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  tamaño?: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`${
          tamaño ?? "w-full max-w-sm"
        } bg-[#161719] border border-[#26272B] rounded-[12px] p-5 shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#26272B]">
          <h2 className="text-[16px] font-bold text-[#ECECEE] flex items-center gap-2 m-0">
            <span className="w-1.5 h-3.5 bg-[#F05A28] rounded-full inline-block" />
            {title}
          </h2>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[7px] bg-[#1D1E21] border border-[#26272B] text-[#9B9CA1] hover:text-[#F05A28] hover:border-[#F05A28] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}