import { useState } from "react";
import type { Screen, Role } from "../models/types";
import type { Reserva, ReservaStatus, Evento } from "../models/types";
import { EVENTOS, RESERVAS } from "../models/data/mockData";
import { LandingPage } from "./pages/auth/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { DashboardLayout } from "../views/layouts/DashboardLayout";
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
  const [usuarios, setUsuarios] = useState<
    {
      nombre: string;
      email: string;
      pass: string;
      role: Role;
      id: string;
      direccion: string;
      ciudad: string;
      telefono: string;
    }[]
  >([
    {
      nombre: "Admin User",
      email: "admin@ticketflow.com",
      pass: "admin123",
      role: "admin",
      id: "39.876.543",
      direccion: "Cra. 15 # 93-47, Of. 302",
      ciudad: "Bogotá",
      telefono: "+57 300 987 6543",
    },
  ]);
  const [usuarioActual, setUsuarioActual] = useState<{
    nombre: string;
    email: string;
    role: Role;
    id: string;
    direccion: string;
    ciudad: string;
    telefono: string;
  } | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>(RESERVAS);
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState<
    number | null
  >(null);
  const [eventos, setEventos] = useState<Evento[]>(EVENTOS);
  const [proximoEventoId, setProximoEventoId] = useState(
    Math.max(0, ...EVENTOS.map((e) => e.id)) + 1,
  );
  function registrarUsuario(
    nombre: string,
    email: string,
    pass: string,
    role: Role,
    id: string,
    direccion: string,
    ciudad: string,
    telefono: string,
  ) {
    setUsuarios((prev) => [
      ...prev,
      { nombre, email, pass, role, id, direccion, ciudad, telefono },
    ]);
  }
  function actualizarPerfil(
    email: string,
    id: string,
    direccion: string,
    ciudad: string,
    telefono: string,
  ) {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.email === email ? { ...u, id, direccion, ciudad, telefono } : u,
      ),
    );
    setUsuarioActual((prev) =>
      prev && prev.email === email
        ? { ...prev, id, direccion, ciudad, telefono }
        : prev,
    );
  }
  function crearReserva(
    eventoId: number,
    entradas: number,
    total: number,
    observaciones: string,
  ) {
    const nuevoId = Math.max(0, ...reservas.map((r) => r.id)) + 1;
    const nueva: Reserva = {
      id: nuevoId,
      eventoId,
      cliente: usuarioActual?.nombre ?? "Invitado",
      fechaReserva: new Date().toISOString().slice(0, 10),
      entradas,
      total,
      estado: "Reservada",
      observaciones,
    };
    setReservas((prev) => [...prev, nueva]);
  }

  function actualizarEstadoReserva(id: number, estado: ReservaStatus) {
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado } : r)),
    );
  }
  function registrarEvento(nuevo: Omit<Evento, "id" | "agente">) {
    setEventos((prev) => [
      ...prev,
      {
        ...nuevo,
        id: proximoEventoId,
        agente: usuarioActual?.nombre ?? "Desconocido",
      },
    ]);
    setProximoEventoId((prev) => prev + 1);
  }

  function actualizarEvento(
    id: number,
    cambios: Omit<Evento, "id" | "agente">,
  ) {
    setEventos((prev) =>
      prev.map((e) => (e.id === id ? { ...cambios, id, agente: e.agente } : e)),
    );
  }

  function eliminarEvento(id: number) {
    setEventos((prev) => prev.filter((e) => e.id !== id));
  }
  function loginExitoso(u: {
    nombre: string;
    email: string;
    role: Role;
    id: string;
    direccion: string;
    ciudad: string;
    telefono: string;
  }) {
    setUsuarioActual(u);
    const destino =
      u.role === "agent"
        ? "agent-dashboard"
        : u.role === "admin"
          ? "admin-dashboard"
          : "client-dashboard";
    setScreen(destino);
  }
  const [role, setRole] = useState<Role>("client");

  function nav(s: Screen, r?: Role, eventId?: number | null) {
    if (r) setRole(r);
    if (eventId !== undefined) setEventoSeleccionadoId(eventId);
    setScreen(s);
  }

  const user = usuarioActual
    ? { name: usuarioActual.nombre, email: usuarioActual.email }
    : role === "agent"
      ? { name: "Carlos Medina", email: "carlos@agentes.com" }
      : { name: "Laura Ríos", email: "laura@ticketflow.com" };

  if (screen === "landing")
    return <LandingPage onNav={nav} eventos={eventos} />;
  if (screen === "login")
    return (
      <LoginPage
        onNav={nav}
        usuarios={usuarios}
        loginExitoso={loginExitoso}
        eventos={eventos}
      />
    );
  if (screen === "register")
    return (
      <RegisterPage
        onNav={nav}
        registrarUsuario={registrarUsuario}
        usuarios={usuarios}
      />
    );

  if (
    screen === "client-dashboard" ||
    screen === "client-events" ||
    screen === "client-event-detail" ||
    screen === "client-reserve" ||
    screen === "client-reservations" ||
    screen === "client-profile"
  ) {
    return (
      <DashboardLayout role="client" screen={screen} onNav={nav} user={user}>
        {screen === "client-dashboard" && (
          <ClientDashboard
            onNav={nav}
            user={usuarioActual}
            reservas={reservas}
            eventos={eventos}
          />
        )}
        {screen === "client-events" && (
          <ClientEvents onNav={nav} eventos={eventos} />
        )}
        {screen === "client-event-detail" && (
          <EventDetail
            onNav={nav}
            eventoId={eventoSeleccionadoId}
            eventos={eventos}
          />
        )}
        {screen === "client-reserve" && (
          <ReservePage
            onNav={nav}
            eventoId={eventoSeleccionadoId}
            crearReserva={crearReserva}
            eventos={eventos}
          />
        )}
        {screen === "client-reservations" && (
          <ClientReservations
            user={usuarioActual}
            reservas={reservas}
            eventos={eventos}
          />
        )}
        {screen === "client-profile" && (
          <ProfilePage
            role="client"
            user={usuarioActual}
            reservas={reservas}
            actualizarPerfil={actualizarPerfil}
          />
        )}
      </DashboardLayout>
    );
  }

  if (
    screen === "agent-dashboard" ||
    screen === "agent-register-event" ||
    screen === "agent-my-events" ||
    screen === "agent-reservations" ||
    screen === "agent-profile"
  ) {
    return (
      <DashboardLayout role="agent" screen={screen} onNav={nav} user={user}>
        {screen === "agent-dashboard" && (
          <AgentDashboard onNav={nav} eventos={eventos} reservas={reservas} />
        )}
        {screen === "agent-register-event" && (
          <AgentRegisterEvent
            onNav={nav}
            eventoId={eventoSeleccionadoId}
            eventos={eventos}
            registrarEvento={registrarEvento}
            actualizarEvento={actualizarEvento}
          />
        )}
        {screen === "agent-my-events" && (
          <AgentMyEvents
            onNav={nav}
            eventos={eventos}
            eliminarEvento={eliminarEvento}
          />
        )}
        {screen === "agent-reservations" && (
          <AgentReservations
            onNav={nav}
            reservas={reservas}
            eventos={eventos}
            actualizarEstadoReserva={actualizarEstadoReserva}
          />
        )}
        {screen === "agent-profile" && (
          <ProfilePage
            role="agent"
            user={usuarioActual}
            reservas={reservas}
            actualizarPerfil={actualizarPerfil}
          />
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" screen={screen} onNav={nav} user={user}>
      {screen === "admin-dashboard" && (
        <AdminDashboard
          eventos={eventos}
          reservas={reservas}
          usuarios={usuarios}
        />
      )}
      {screen === "admin-profile" && (
        <ProfilePage
          role="admin"
          user={usuarioActual}
          reservas={reservas}
          actualizarPerfil={actualizarPerfil}
        />
      )}
    </DashboardLayout>
  );
}
