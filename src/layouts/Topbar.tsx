import type { Screen } from "../types";
import { NAV, PRIMARY, PRIMARY_L } from "../utils/theme";
import { Logo } from "../components/Logo";

// ─── Topbar Nav (horizontal — vista cliente) ──────────────────────────────────
export function Topbar({ current, onNav, user }: {
  current: Screen; onNav: (s: Screen) => void;
  user: { name: string; email: string };
}) {
  const links: { label: string; screen: Screen; icon: string }[] = [
    { label: "Inicio", screen: "client-dashboard", icon: "🏠" },
    { label: "Eventos", screen: "client-events", icon: "🎭" },
    { label: "Mis Reservas", screen: "client-reservations", icon: "🎫" },
    { label: "Perfil", screen: "client-profile", icon: "👤" },
  ];

  return (
    <header className="sticky top-0 z-40" style={{ background: NAV }}>
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center gap-8">
        <Logo size="sm" on="dark" />

        <nav className="flex items-center gap-1 flex-1">
          {links.map(l => (
            <button
              key={l.screen}
              onClick={() => onNav(l.screen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                current === l.screen ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={current === l.screen ? { background: PRIMARY + "55", color: "#e9d5ff" } : {}}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold leading-tight">{user.name}</p>
            <p className="text-gray-400 text-xs leading-tight">{user.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_L} 100%)` }}>
            {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <button
            onClick={() => onNav("landing")}
            title="Cerrar sesión"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 cursor-pointer flex-shrink-0"
          >
            🚪
          </button>
        </div>
      </div>
    </header>
  );
}

