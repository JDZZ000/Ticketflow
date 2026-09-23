// ─── Types ────────────────────────────────────────────────────────────────────
export type Role = "client" | "agent" | "admin";
export type Screen =
  | "landing" | "login" | "register"
  | "client-dashboard" | "client-events" | "client-event-detail"
  | "client-reserve" | "client-reservations" | "client-profile"
  | "agent-dashboard" | "agent-register-event" | "agent-my-events"
  | "agent-reservations" | "agent-profile"
  | "admin-dashboard" | "admin-profile";

export type EventStatus = "Programado" | "En Boletería" | "En Vivo" | "Finalizado" | "Cancelado";
export type ReservaStatus = "Reservada" | "Confirmada" | "Cancelada";

export interface Evento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  teatro: string;
  ciudad: string;
  pais: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  capacidad: number;
  precio: number;
  estado: EventStatus;
  imagen: string;
  observaciones: string;
}

export interface Reserva {
  id: number;
  eventoId: number;
  cliente: string;
  fechaReserva: string;
  entradas: number;
  total: number;
  estado: ReservaStatus;
  observaciones: string;
}

