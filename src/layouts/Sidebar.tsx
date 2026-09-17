import type { Role, Screen } from "../types";
import { NAV, PRIMARY, PRIMARY_L } from "../utils/theme";
import { Logo } from "../components/Logo";

// ─── Sidebar Nav ───────────────────────────────────────────────────────────────
export function Sidebar({ role, current, onNav, user }: {
  role: Role; current: Screen; onNav: (s: Screen) => void;
  user: { name: string; email: string };
}) {
  const links: { label: string; screen: Screen; icon: string }[] =
    role === "client" ? [
      { label: "Inicio", screen: "client-dashboard", icon: "🏠" },
      { label: "Eventos", screen: "client-events", icon: "🎭" },
      { label: "Mis Reservas", screen: "client-reservations", icon: "🎫" },
      { label: "Perfil", screen: "client-profile", icon: "👤" },
    ] : role === "agent" ? [
      { label: "Inicio", screen: "agent-dashboard", icon: "🏠" },
      { label: "Registrar Evento", screen: "agent-register-event", icon: "➕" },
      { label: "Mis Eventos", screen: "agent-my-events", icon: "📋" },
      { label: "Reservas", screen: "agent-reservations", icon: "🎫" },
      { label: "Perfil", screen: "agent-profile", icon: "👤" },
    ] : [
      { label: "Dashboard", screen: "admin-dashboard", icon: "📊" },
      { label: "Perfil", screen: "admin-profile", icon: "👤" },
    ];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col min-h-screen" style={{ background: NAV }}>
      <div className="px-6 py-6 border-b border-white/10">
        <Logo size="sm" on="dark" />
      </div>
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_L} 100%)` }}>
            {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user.name}</p>
            <p className="text-gray-400 text-xs truncate">{user.email}</p>
            <span className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block capitalize"
              style={{ background: PRIMARY + "44", color: "#c4b5fd" }}>
              {role === "client" ? "Cliente" : role === "agent" ? "Agente" : "Administrador"}
            </span>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(l => (
          <button
            key={l.screen}
            onClick={() => onNav(l.screen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer ${
              current === l.screen
                ? "text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            style={current === l.screen ? { background: PRIMARY + "55", color: "#e9d5ff" } : {}}
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </button>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => onNav("landing")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 cursor-pointer"
        >
          <span>🚪</span> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

