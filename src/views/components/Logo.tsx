import { PRIMARY, ACCENT, BRAND_GRADIENT } from "../../utils/theme";

// ─── Brand Logo ────────────────────────────────────────────────────────────────
export function Logo({ size = "md", on = "dark" }: { size?: "sm" | "md" | "lg" | "xl"; on?: "dark" | "light" }) {
  const dims: Record<string, { box: number; text: string }> = {
    sm: { box: 30, text: "text-base" },
    md: { box: 38, text: "text-lg" },
    lg: { box: 48, text: "text-2xl" },
    xl: { box: 64, text: "text-4xl" },
  };
  const d = dims[size];
  const gradId = `logoGrad-${size}-${on}`;
  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <svg width={d.box} height={d.box} viewBox="0 0 40 40" className="flex-shrink-0" style={{ filter: "drop-shadow(0 2px 6px rgba(109,40,217,0.35))" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={PRIMARY} />
            <stop offset="100%" stopColor={ACCENT} />
          </linearGradient>
        </defs>
        <path d="M4 13a3.5 3.5 0 0 1 3.5-3.5h25A3.5 3.5 0 0 1 36 13v3.2a2.8 2.8 0 0 0 0 5.6V25a3.5 3.5 0 0 1-3.5 3.5h-25A3.5 3.5 0 0 1 4 25v-3.2a2.8 2.8 0 0 0 0-5.6V13z" fill={`url(#${gradId})`} />
        <line x1="20" y1="10.5" x2="20" y2="27.5" stroke="white" strokeWidth="2" strokeDasharray="1.5 3" strokeLinecap="round" opacity="0.85" />
      </svg>
      <span className={`font-extrabold ${d.text} tracking-tight leading-none`} style={{ fontFamily: "Outfit, sans-serif", color: on === "dark" ? "#ffffff" : "#1A1B2E" }}>
        Ticket<span style={{ background: BRAND_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Flow</span>
      </span>
    </div>
  );
}

