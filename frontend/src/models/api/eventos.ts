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
    fechaFin: e.fechaFin,
    horaFin: e.horaFin,
    capacidad: e.capacidad,
    precio: e.precio,
    estado: e.estado as EventStatus,
    imagen: e.imagen ?? "",
    observaciones: e.observaciones ?? "",
    agente: e.agente,
    // Entradas que quedan, calculadas por el servidor con TODAS las reservas
    disponibles: e.disponibles,
  };
}

export async function listarEventos(): Promise<Evento[]> {
  const datos = await api.get<EventoApi[]>("/api/eventos");
  return datos.map(aEvento);
}

// Lo que se envía al crear o editar un evento. El código (EVT-###) lo asigna el servidor.
export interface DatosEvento {
  nombre: string;
  descripcion: string;
  teatro: string;
  ciudadId: number;
  fecha: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  capacidad: number;
  precio: number;
  estado: EventStatus;
  imagen: string;
  observaciones: string;
}

// Solo agentes
export async function crearEvento(datos: DatosEvento): Promise<Evento> {
  return aEvento(await api.post<EventoApi>("/api/eventos", datos));
}

export async function modificarEvento(
  id: number,
  datos: DatosEvento,
): Promise<Evento> {
  return aEvento(await api.put<EventoApi>(`/api/eventos/${id}`, datos));
}

// El servidor no deja eliminar un evento que tiene reservas
export async function eliminarEvento(id: number): Promise<void> {
  await api.delete<{ mensaje: string }>(`/api/eventos/${id}`);
}
