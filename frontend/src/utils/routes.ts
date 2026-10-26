import type { Role, Screen } from "../models/types";

// Cada pantalla del sistema tiene su propia URL.
// Las rutas con ":id" llevan el id del evento.
const RUTAS: { screen: Screen; path: string }[] = [
  { screen: "landing", path: "/" },
  { screen: "login", path: "/login" },
  { screen: "register", path: "/registro" },
  { screen: "forgot-password", path: "/recuperar" },
  { screen: "reset-password", path: "/restablecer" },
  { screen: "client-dashboard", path: "/cliente" },
  { screen: "client-events", path: "/cliente/eventos" },
  { screen: "client-event-detail", path: "/cliente/eventos/:id" },
  { screen: "client-reserve", path: "/cliente/eventos/:id/reservar" },
  { screen: "client-reservations", path: "/cliente/reservas" },
  { screen: "client-profile", path: "/cliente/perfil" },

  { screen: "agent-dashboard", path: "/agente" },
  { screen: "agent-my-events", path: "/agente/eventos" },
  { screen: "agent-register-event", path: "/agente/eventos/nuevo" },
  { screen: "agent-register-event", path: "/agente/eventos/:id/editar" },
  { screen: "agent-reservations", path: "/agente/reservas" },
  { screen: "agent-profile", path: "/agente/perfil" },

  { screen: "admin-dashboard", path: "/admin" },
  { screen: "admin-users", path: "/admin/usuarios" },
  { screen: "admin-locations", path: "/admin/ubicaciones" },
  { screen: "admin-profile", path: "/admin/perfil" },
];

export function rolDeScreen(s: Screen): Role | null {
  if (s.startsWith("client-")) return "client";
  if (s.startsWith("agent-")) return "agent";
  if (s.startsWith("admin-")) return "admin";
  return null; // pantallas públicas
}

export function dashboardDeRol(r: Role): Screen {
  return r === "agent"
    ? "agent-dashboard"
    : r === "admin"
      ? "admin-dashboard"
      : "client-dashboard";
}

/** Arma la URL de una pantalla. `eventId` es el evento al que se refiere (null = ninguno). */
export function screenToPath(s: Screen, eventId?: number | null): string {
  if (s === "agent-register-event") {
    return eventId != null
      ? `/agente/eventos/${eventId}/editar`
      : "/agente/eventos/nuevo";
  }
  const ruta = RUTAS.find((r) => r.screen === s)!;
  return ruta.path.replace(":id", String(eventId ?? ""));
}

/** Lee una URL y devuelve su pantalla, o null si no existe (404). */
export function pathToScreen(
  pathname: string,
): { screen: Screen; eventId: number | null } | null {
  const partes = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  for (const r of RUTAS) {
    const molde = r.path.split("/").filter(Boolean);
    if (molde.length !== partes.length) continue;
    let eventId: number | null = null;
    let coincide = true;
    for (let i = 0; i < molde.length; i++) {
      if (molde[i] === ":id") {
        if (!/^\d+$/.test(partes[i])) {
          coincide = false;
          break;
        }
        eventId = Number(partes[i]);
      } else if (molde[i] !== partes[i]) {
        coincide = false;
        break;
      }
    }
    if (coincide) return { screen: r.screen, eventId };
  }
  return null;
}
