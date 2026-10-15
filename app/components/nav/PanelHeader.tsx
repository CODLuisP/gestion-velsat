"use client";

import React from "react";
import { Role } from "@/app/constants/roles";

type PanelHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  role?: Role | string;
  actions?: React.ReactNode;
  rightContent?: React.ReactNode;
};

export default function PanelHeader({
  title,
  subtitle,
  role = "Servidor 107",
  actions,
  rightContent,
}: PanelHeaderProps) {
  const formatServerName = (r?: string) => {
    if (!r) return "Servidor 107";
    if (r === "Servidor_125_2") return "Urbano 125";
    return r.replace(/_/g, " ");
  };

  return (
    <header className="h-[68px] min-h-[68px] px-6 flex items-center justify-between border-b border-[#26272B] bg-[#121214] flex-shrink-0">
      <div>
        <h1 className="text-[20px] font-bold text-[#ECECEE] tracking-tight leading-none m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12.5px] text-[#9B9CA1] mt-1.5 mb-0 leading-none">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions ?? rightContent}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#161719] border border-[#26272B] text-[12px] font-mono text-[#ECECEE]">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_6px_rgba(74,222,128,0.5)] flex-shrink-0" />
          <span>{formatServerName(role)}</span>
        </div>
      </div>
    </header>
  );
}
