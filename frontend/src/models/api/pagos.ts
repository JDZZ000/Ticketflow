import { api } from "./cliente";

// ─── Pagos con Stripe ─────────────────────────────────────────────────────────
// Pide al servidor la página de pago de Stripe para una reserva y devuelve su
// dirección. El monto lo toma el servidor de la reserva: desde aquí solo va el id.
export async function iniciarPago(reservaId: number): Promise<string> {
  const { url } = await api.post<{ url: string }>("/api/pagos/checkout", {
    reservaId,
  });
  return url;
}

export interface ResultadoPago {
  pagado: boolean; // Stripe dice que el pago se hizo
  confirmada: boolean; // la reserva quedó «Confirmada» por ese pago
}

// Al volver de Stripe: el servidor le pregunta a Stripe si ese pago se hizo de verdad
// y, si es así, confirma la reserva
export function confirmarPago(sessionId: string): Promise<ResultadoPago> {
  return api.post<ResultadoPago>("/api/pagos/confirmar", { sessionId });
}