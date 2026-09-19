import { useState } from "react";
import type { Screen, Role } from "./types";
import { LandingPage } from "./pages/auth/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ClientDashboard } from "./pages/client/ClientDashboard";
import { ClientEvents } from "./pages/client/ClientEvents";
import { EventDetail } from "./pages/client/EventDetail";
import { ReservePage } from "./pages/client/ReservePage";
import { ClientReservations } from "./pages/client/ClientReservations";
import { ProfilePage } from "./pages/ProfilePage";
import { AgentDashboard } from "./pages/agent/AgentDashboard";
import { AgentRegisterEvent } from "./pages/agent/AgentRegisterEvent";
import { AgentMyEvents } from "./pages/agent/AgentMyEvents";
import { AgentReservations } from "./pages/agent/AgentReservations";
import { AdminDashboard } from "./pages/admin/AdminDashboard";

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [usuarios, setUsuarios] = useState<{ nombre: string; email: string; pass: string; role: Role; id: string; direccion: string; ciudad: string; telefono: string }[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<{ nombre: string; email: string; role: Role; id: string; direccion: string; ciudad: string; telefono: string } | null>(null);
  function registrarUsuario(nombre: string, email: string, pass: string, role: Role, id: string, direccion: string, ciudad: string, telefono: string) {
  setUsuarios(prev => [...prev, { nombre, email, pass, role, id, direccion, ciudad, telefono }]);
  }
  function loginExitoso(u: { nombre: string; email: string; role: Role; id: string; direccion: string; ciudad: string; telefono: string }) {
  setUsuarioActual(u);
  const destino = u.role === "agent" ? "agent-dashboard" : u.role === "admin" ? "admin-dashboard" : "client-dashboard";
  setScreen(destino);
}
  const [role, setRole] = useState<Role>("client");

  function nav(s: Screen, r?: Role) {
    if (r) setRole(r);
    setScreen(s);
  }

  const user =
  usuarioActual
    ? { name: usuarioActual.nombre, email: usuarioActual.email }
    : role === "agent" ? { name: "Carlos Medina", email: "carlos@agentes.com" }
                        : { name: "Laura Ríos",   email: "laura@ticketflow.com" };

  if (screen === "landing")  return <LandingPage onNav={nav} />;
  if (screen === "login")    return <LoginPage onNav={nav} usuarios={usuarios} loginExitoso={loginExitoso} />;
  if (screen === "register") return <RegisterPage onNav={nav} registrarUsuario={registrarUsuario} />;

  if (screen === "client-dashboard" || screen === "client-events" || screen === "client-event-detail"
    || screen === "client-reserve" || screen === "client-reservations" || screen === "client-profile") {
    return (
      <DashboardLayout role="client" screen={screen} onNav={nav} user={user}>
        {screen === "client-dashboard"    && <ClientDashboard onNav={nav} user={usuarioActual} />}
        {screen === "client-events"       && <ClientEvents onNav={nav} />}
        {screen === "client-event-detail" && <EventDetail onNav={nav} />}
        {screen === "client-reserve"      && <ReservePage onNav={nav} />}
        {screen === "client-reservations" && <ClientReservations />}
        {screen === "client-profile" && <ProfilePage role="client" user={usuarioActual} />}
      </DashboardLayout>
    );
  }

  if (screen === "agent-dashboard" || screen === "agent-register-event" || screen === "agent-my-events"
    || screen === "agent-reservations" || screen === "agent-profile") {
    return (
      <DashboardLayout role="agent" screen={screen} onNav={nav} user={user}>
        {screen === "agent-dashboard"       && <AgentDashboard onNav={nav} />}
        {screen === "agent-register-event"  && <AgentRegisterEvent onNav={nav} />}
        {screen === "agent-my-events"       && <AgentMyEvents onNav={nav} />}
        {screen === "agent-reservations"    && <AgentReservations />}
        {screen === "agent-profile"  && <ProfilePage role="agent"  user={usuarioActual} />}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" screen={screen} onNav={nav} user={user}>
      {screen === "admin-dashboard" && <AdminDashboard />}
      {screen === "admin-profile"  && <ProfilePage role="admin"  user={usuarioActual} />}
    </DashboardLayout>
  );
}
