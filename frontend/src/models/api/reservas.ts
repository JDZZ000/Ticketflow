import type { Reserva, ReservaStatus } from "../types";
import { api } from "./cliente";

// ─── Reservas del cliente ─────────────────────────────────────────────────────
// Lo que devuelve la API de reservas
interface ReservaApi {
  id: number;
  eventoId: number;
  evento: string;
  clienteId: string;
  cliente: string;
  fechaReserva: string;
  entradas: number;
  total: number;
  estado: string;
  observaciones: string | null;
}

// Convierte la reserva de la API a la que ya usan todas las pantallas
function aReserva(r: ReservaApi): Reserva {
  return {
    id: r.id,
    eventoId: r.eventoId,
    cliente: r.cliente,
    fechaReserva: r.fechaReserva,
    entradas: r.entradas,
    total: r.total,
    estado: r.estado as ReservaStatus,
    observaciones: r.observaciones ?? "",
  };
}

// Las reservas de quien tiene la sesión iniciada (la más reciente primero)
export async function misReservas(): Promise<Reserva[]> {
  const datos = await api.get<ReservaApi[]>("/api/reservas/mias");
  return datos.map(aReserva);
}

// El servidor calcula el total y revisa el cupo dentro de una transacción
export async function crearReserva(
  eventoId: number,
  entradas: number,
  observaciones: string,
): Promise<Reserva> {
  return aReserva(
    await api.post<ReservaApi>("/api/reservas", {
      eventoId,
      entradas,
      observaciones,
    }),
  );
}

// Cancelar libera las entradas. La causa queda guardada en las observaciones.
export async function cancelarReserva(
  id: number,
  causa: string,
): Promise<Reserva> {
  return aReserva(
    await api.patch<ReservaApi>(`/api/reservas/${id}/estado`, {
      estado: "Cancelada",
      causa,
    }),
  );
}

// Cambiar el número de entradas y/o las observaciones (solo mientras esté «Reservada»)
export async function modificarReserva(
  id: number,
  cambios: { entradas?: number; observaciones?: string },
): Promise<Reserva> {
  return aReserva(await api.put<ReservaApi>(`/api/reservas/${id}`, cambios));
}
