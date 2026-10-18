import type { Evento, Reserva } from "../models/types";

// ─── CUPO DE ENTRADAS ─────────────────────────────────────────────────────────
// Reglas para que nunca se puedan reservar más entradas que la capacidad del
// evento. El cupo no se guarda en ningún lado: siempre se calcula a partir de
// la capacidad del evento y de las reservas existentes (lo hace el servidor).

// Máximo de entradas que una persona puede reservar en una sola compra
export const MAX_POR_RESERVA = 10;

// Entradas ya apartadas de un evento. Las reservas canceladas liberan su cupo.
export function entradasReservadas(
  eventoId: number,
  reservas: Reserva[],
): number {
  return reservas
    .filter((r) => r.eventoId === eventoId && r.estado !== "Cancelada")
    .reduce((suma, r) => suma + r.entradas, 0);
}

// Entradas que todavía se pueden reservar (nunca baja de 0).
// Si el evento viene de la API, el servidor ya calculó el cupo con las reservas de
// TODAS las personas, y ese es el que vale. El cálculo local con la lista de
// reservas queda solo para eventos que no traen ese dato.
export function entradasDisponibles(ev: Evento, reservas: Reserva[]): number {
  if (ev.disponibles !== undefined) return Math.max(0, ev.disponibles);
  return Math.max(0, ev.capacidad - entradasReservadas(ev.id, reservas));
}

// Quedan pocas cuando falta el 10 % o menos de la capacidad
export function quedanPocas(ev: Evento, reservas: Reserva[]): boolean {
  const libres = entradasDisponibles(ev, reservas);
  return libres > 0 && libres <= Math.ceil(ev.capacidad * 0.1);
}
