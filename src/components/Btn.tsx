import { PRIMARY, PRIMARY_L } from "../utils/theme";

export function Btn({ children, onClick, variant = "primary", size = "md", full = false, type = "button" }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg"; full?: boolean; type?: "button" | "submit";
}) {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 cursor-pointer";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-7 py-3.5 text-base" };
  const variants = {
    primary: "text-white shadow-md hover:shadow-lg hover:brightness-110 active:scale-95",
    outline: "border-2 border-violet-600 text-violet-600 hover:bg-violet-50 active:scale-95",
    ghost: "text-gray-600 hover:bg-gray-100 active:scale-95",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm active:scale-95",
  };
  const style = variant === "primary" ? { background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_L} 100%)` } : {};
  return (
    <button
      type={type}
      onClick={onClick}
      style={style}
      className={`${base} ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

