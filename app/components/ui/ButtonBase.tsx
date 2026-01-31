"use client";
type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "personalizado";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean; 
};

export default function ButtonBase({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
}: ButtonProps) {
  const base =
    "px-4 py-2 rounded-lg transition focus:outline-none";

  const variants = {
    primary: "bg-blue-600 font-semibold text-white hover:bg-blue-700",
    secondary: "bg-gray-200 font-semibold text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white font-semibold hover:bg-red-700",
    personalizado: "bg-orange-500 font-medium text-white text-[15px] px-8 hover:bg-orange-600",
  };

  const disabledStyles =
    "opacity-50 cursor-not-allowed";

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        ${base}
        ${variants[variant]}
        ${disabled ? disabledStyles : ""}
      `}
    >
      {children}
    </button>
  );
}
