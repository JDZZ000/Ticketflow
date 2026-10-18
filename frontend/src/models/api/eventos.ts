import type { Evento, EventStatus } from "../types";
import { api } from "./cliente";

// ─── Eventos ──────────────────────────────────────────────────────────────────
// Lo que devuelve GET /api/eventos (es público: no hace falta iniciar sesión)
interface EventoApi {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  teatro: string | null;
  ciudad: string;
  departamento: string;
  pais: string;
  fecha: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  capacidad: number;
  precio: number;
  estado: string;
  imagen: string | null;
  observaciones: string | null;
  agente: string;
  disponibles: number;
}

// Convierte el evento de la API al que ya usan todas las pantallas
function aEvento(e: EventoApi): Evento {
  return {
    id: e.id,
    codigo: e.codigo,
    nombre: e.nombre,
    descripcion: e.descripcion ?? "",
    teatro: e.teatro ?? "",
    ciudad: e.ciudad,
    departamento: e.departamento,
    pais: e.pais,
    fecha: e.fecha,
    horaInicio: e.horaInicio,
    horaFin: e.horaFin,
    capacidad: e.capacidad,
    precio: e.precio,
    estado: e.estado as EventStatus,
    imagen: e.imagen ?? "",
    observaciones: e.observaciones ?? "",
    agente: e.agente,
  };
}

export async function listarEventos(): Promise<Evento[]> {
  const datos = await api.get<EventoApi[]>("/api/eventos");
  return datos.map(aEvento);
}
