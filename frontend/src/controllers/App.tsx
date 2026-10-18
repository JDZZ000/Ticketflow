import { useEffect, useState } from "react";
import type { Screen, Role } from "../models/types";
import type { Reserva, ReservaStatus, Evento } from "../models/types";
import { RESERVAS } from "../models/data/mockData";
import { entradasDisponibles } from "../utils/cupo";
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
import { obtenerPerfil, type UsuarioActual } from "../models/api/auth";
import { listarEventos } from "../models/api/eventos";
import { ApiError, mensajeDeError, sesion } from "../models/api/cliente";
import { Btn } from "../views/components/Btn";

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
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(
    null,
  );

  // Si quedó una sesión guardada en el navegador, se comprueba con el servidor al abrir la página
  const [cargandoSesion, setCargandoSesion] = useState(
    () => sesion.token() !== null,
  );
  useEffect(() => {
    if (sesion.token() === null) return;
    let activo = true;
    obtenerPerfil()
      .then((u) => {
        if (activo) loginExitoso(u);
      })
      .catch((e: unknown) => {
        // Solo se descarta la sesión si el servidor dice que ya no vale (401)
        if (e instanceof ApiError && e.status === 401) sesion.borrar();
      })
      .finally(() => {
        if (activo) setCargandoSesion(false);
      });
    return () => {
      activo = false;
    };
  }, []);
  const [reservas, setReservas] = useState<Reserva[]>(RESERVAS);
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState<
    number | null
  >(null);
  // Los eventos salen de la base de datos (GET /api/eventos, público)
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [errorEventos, setErrorEventos] = useState("");

  function cargarEventos() {
    setCargandoEventos(true);
    setErrorEventos("");
    listarEventos()
      .then(setEventos)
      .catch((e: unknown) => setErrorEventos(mensajeDeError(e)))
      .finally(() => setCargandoEventos(false));
  }
  useEffect(() => {
    cargarEventos();
  }, []);
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
  ): boolean {
    // Validación de cupo: nunca se reserva más de lo que queda disponible
    const ev = eventos.find((e) => e.id === eventoId);
    if (!ev || entradas < 1 || entradas > entradasDisponibles(ev, reservas)) {
      return false;
    }
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
    return true;
  }

  // Cambia el estado de una reserva. Devuelve false si no se pudo: reactivar una
  // reserva cancelada solo es posible si el evento todavía tiene cupo para ella.
  function actualizarEstadoReserva(id: number, estado: ReservaStatus): boolean {
    const reserva = reservas.find((r) => r.id === id);
    if (reserva && reserva.estado === "Cancelada" && estado !== "Cancelada") {
      const ev = eventos.find((e) => e.id === reserva.eventoId);
      if (!ev || reserva.entradas > entradasDisponibles(ev, reservas)) {
        return false;
      }
    }
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado } : r)),
    );
    return true;
  }
  function registrarEvento(nuevo: Omit<Evento, "id" | "agente">) {
    setEventos((prev) => [
      ...prev,
      {
        ...nuevo,
        id: Math.max(0, ...prev.map((e) => e.id)) + 1,
        agente: usuarioActual?.nombre ?? "Desconocido",
      },
    ]);
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
  function loginExitoso(u: UsuarioActual) {
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

  // Cerrar sesión: se borra el token y se olvida al usuario
  function cerrarSesion() {
    sesion.borrar();
    setUsuarioActual(null);
  }

  function nav(s: Screen, r?: Role, eventId?: number | null) {
    // El botón «Cerrar sesión» navega a la portada: ahí termina la sesión
    if ((s === "landing" || s === "login") && usuarioActual) cerrarSesion();
    if (r) setRole(r);
    if (eventId !== undefined) setEventoSeleccionadoId(eventId);
    setScreen(s);
  }

  const user = usuarioActual
    ? { name: usuarioActual.nombre, email: usuarioActual.email }
    : role === "agent"
      ? { name: "Carlos Medina", email: "carlos@agentes.com" }
      : { name: "Laura Ríos", email: "laura@ticketflow.com" };

  if (errorEventos)
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
          <p className="text-4xl mb-3">🔌</p>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">
            No se pudieron cargar los eventos
          </h1>
          <p className="text-gray-500 text-sm mb-6">{errorEventos}</p>
          <Btn full onClick={cargarEventos}>
            Reintentar
          </Btn>
        </div>
      </div>
    );
  if (cargandoSesion || cargandoEventos)
    return (
      <div
        className="min-h-screen flex items-center justify-center text-gray-500"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        Cargando…
      </div>
    );
  if (screen === "landing")
    return <LandingPage onNav={nav} eventos={eventos} />;
  if (screen === "login")
    return (
      <LoginPage onNav={nav} loginExitoso={loginExitoso} eventos={eventos} />
    );
  if (screen === "register") return <RegisterPage onNav={nav} />;

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
          <ClientEvents onNav={nav} eventos={eventos} reservas={reservas} />
        )}
        {screen === "client-event-detail" && (
          <EventDetail
            onNav={nav}
            eventoId={eventoSeleccionadoId}
            eventos={eventos}
            reservas={reservas}
          />
        )}
        {screen === "client-reserve" && (
          <ReservePage
            onNav={nav}
            eventoId={eventoSeleccionadoId}
            crearReserva={crearReserva}
            eventos={eventos}
            reservas={reservas}
          />
        )}
        {screen === "client-reservations" && (
          <ClientReservations
            user={usuarioActual}
            reservas={reservas}
            eventos={eventos}
            actualizarEstadoReserva={actualizarEstadoReserva}
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
