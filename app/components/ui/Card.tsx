"use client";

import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function Card({ children, className = "", style }: CardProps) {
  return (
    <div
      style={style}
      className={`rounded-[12px] border border-[#26272B] bg-[#161719] shadow-none ${className}`}
    >
      {children}
    </div>
  );
}

type CardContentProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function CardContent({
  children,
  className = "",
  style,
}: CardContentProps) {
  return (
    <div style={style} className={`p-5 ${className}`}>
      {children}
    </div>
  );
}
