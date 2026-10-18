import { useEffect, useRef, useState } from "react";
import type { Screen, Role } from "../models/types";
import type { Reserva, ReservaStatus, Evento } from "../models/types";
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
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminLocations } from "./pages/admin/AdminLocations";
import { obtenerPerfil, type UsuarioActual } from "../models/api/auth";
import {
  listarEventos,
  crearEvento,
  modificarEvento,
  eliminarEvento as eliminarEventoApi,
  type DatosEvento,
} from "../models/api/eventos";
import {
  misReservas,
  crearReserva as crearReservaApi,
  cancelarReserva as cancelarReservaApi,
  modificarReserva as modificarReservaApi,
  todasLasReservas,
  cambiarEstadoReserva as cambiarEstadoApi,
  eliminarReserva as eliminarReservaApi,
} from "../models/api/reservas";
import {
  ApiError,
  SESION_EXPIRADA,
  mensajeDeError,
  sesion,
} from "../models/api/cliente";
import { Btn } from "../views/components/Btn";

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(
    null,
  );

  // Si el token vence mientras se usa la página, el servidor responde 401 y se avisa aquí:
  // se cierra la sesión y se lleva a la persona al inicio de sesión, con un mensaje.
  const sesionActiva = useRef(false);
  const [avisoSesion, setAvisoSesion] = useState("");
  useEffect(() => {
    function alExpirar() {
      if (!sesionActiva.current) return; // sin sesión abierta no hay nada que avisar
      sesionActiva.current = false;
      setUsuarioActual(null);
      setReservas([]);
      setAvisoSesion("Tu sesión expiró. Inicia sesión de nuevo.");
      setScreen("login");
    }
    window.addEventListener(SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(SESION_EXPIRADA, alExpirar);
  }, []);

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
  const [reservas, setReservas] = useState<Reserva[]>([]);
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

  // Vuelve a pedir los eventos sin pantalla de carga, para que las entradas
  // disponibles reflejen lo que acaba de pasar con las reservas
  function refrescarEventos() {
    listarEventos()
      .then(setEventos)
      .catch(() => {});
  }
  // Cuando la persona guarda su perfil, se actualizan los datos que usa el resto de la página
  function perfilActualizado(u: UsuarioActual) {
    setUsuarioActual(u);
  }

  // Reservas del cliente: las hace el servidor, que calcula el total y valida el
  // cupo dentro de una transacción. Si falla, el error llega a la pantalla.
  async function crearReserva(
    eventoId: number,
    entradas: number,
    observaciones: string,
  ): Promise<Reserva> {
    try {
      const nueva = await crearReservaApi(eventoId, entradas, observaciones);
      setReservas((prev) => [nueva, ...prev]);
      return nueva;
    } finally {
      refrescarEventos();
    }
  }

  async function cancelarReserva(id: number, causa: string): Promise<void> {
    try {
      const actualizada = await cancelarReservaApi(id, causa);
      setReservas((prev) => prev.map((r) => (r.id === id ? actualizada : r)));
    } finally {
      refrescarEventos();
    }
  }

  async function editarReserva(
    id: number,
    entradas: number,
    observaciones: string,
  ): Promise<void> {
    try {
      const actualizada = await modificarReservaApi(id, {
        entradas,
        observaciones,
      });
      setReservas((prev) => prev.map((r) => (r.id === id ? actualizada : r)));
    } finally {
      refrescarEventos();
    }
  }

  // Agente: cambiar el estado de una reserva. Reactivar una cancelada exige cupo; si
  // no hay, el servidor responde con un mensaje y la pantalla lo muestra.
  async function cambiarEstadoReserva(
    id: number,
    estado: ReservaStatus,
  ): Promise<void> {
    try {
      const actualizada = await cambiarEstadoApi(id, estado);
      setReservas((prev) => prev.map((r) => (r.id === id ? actualizada : r)));
    } finally {
      refrescarEventos();
    }
  }

  // Agente: solo se pueden eliminar las reservas ya canceladas
  async function eliminarReserva(id: number): Promise<void> {
    try {
      await eliminarReservaApi(id);
      setReservas((prev) => prev.filter((r) => r.id !== id));
    } finally {
      refrescarEventos();
    }
  }

  // Agente: eventos. El código (EVT-###) y el agente los asigna el servidor.
  async function registrarEvento(datos: DatosEvento): Promise<void> {
    const nuevo = await crearEvento(datos);
    setEventos((prev) => [...prev, nuevo]);
  }

  async function actualizarEvento(
    id: number,
    datos: DatosEvento,
  ): Promise<void> {
    const actualizado = await modificarEvento(id, datos);
    setEventos((prev) => prev.map((e) => (e.id === id ? actualizado : e)));
  }

  // El servidor no deja eliminar un evento que tiene reservas
  async function eliminarEvento(id: number): Promise<void> {
    await eliminarEventoApi(id);
    setEventos((prev) => prev.filter((e) => e.id !== id));
  }

  function loginExitoso(u: UsuarioActual) {
    sesionActiva.current = true;
    setAvisoSesion("");
    setUsuarioActual(u);
    // El cliente ve sus reservas reales; agentes y administrador siguen con las
    // de ejemplo hasta que se conecten sus pantallas
    if (u.role === "client") {
      setReservas([]);
      misReservas()
        .then(setReservas)
        .catch(() => {});
    } else if (u.role === "agent") {
      // El agente ve las reservas de todos los eventos
      setReservas([]);
      todasLasReservas()
        .then(setReservas)
        .catch(() => {});
    } else {
      // El administrador no usa la lista de reservas: sus reportes los pide el propio panel
      setReservas([]);
    }
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
    sesionActiva.current = false;
    sesion.borrar();
    setUsuarioActual(null);
    setReservas([]);
  }

  function nav(s: Screen, r?: Role, eventId?: number | null) {
    // El botón «Cerrar sesión» navega a la portada: ahí termina la sesión
    if ((s === "landing" || s === "login") && usuarioActual) cerrarSesion();
    if (s !== "login") setAvisoSesion("");
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
      <LoginPage
        onNav={nav}
        loginExitoso={loginExitoso}
        eventos={eventos}
        aviso={avisoSesion}
      />
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
            cancelarReserva={cancelarReserva}
            editarReserva={editarReserva}
          />
        )}
        {screen === "client-profile" && (
          <ProfilePage
            role="client"
            user={usuarioActual}
            onPerfilActualizado={perfilActualizado}
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
            cambiarEstadoReserva={cambiarEstadoReserva}
            cancelarReserva={cancelarReserva}
            editarReserva={editarReserva}
            eliminarReserva={eliminarReserva}
          />
        )}
        {screen === "agent-profile" && (
          <ProfilePage
            role="agent"
            user={usuarioActual}
            onPerfilActualizado={perfilActualizado}
          />
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" screen={screen} onNav={nav} user={user}>
      {screen === "admin-dashboard" && <AdminDashboard />}
      {screen === "admin-users" && (
        <AdminUsers miId={usuarioActual?.id ?? ""} />
      )}
      {screen === "admin-locations" && <AdminLocations />}
      {screen === "admin-profile" && (
        <ProfilePage
          role="admin"
          user={usuarioActual}
          onPerfilActualizado={perfilActualizado}
        />
      )}
    </DashboardLayout>
  );
}
