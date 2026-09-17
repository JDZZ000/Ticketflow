import type { EventStatus, ReservaStatus } from "../types";

export function statusColor(s: EventStatus | ReservaStatus) {
  const map: Record<string, string> = {
    "En Boletería": "bg-violet-100 text-violet-700",
    "Programado":   "bg-blue-100 text-blue-700",
    "En Vivo":      "bg-green-100 text-green-700",
    "Finalizado":   "bg-gray-100 text-gray-600",
    "Cancelado":    "bg-red-100 text-red-600",
    "Reservada":    "bg-amber-100 text-amber-700",
    "Confirmada":   "bg-emerald-100 text-emerald-700",
    "Cancelada":    "bg-red-100 text-red-600",
  };
  return map[s] ?? "bg-gray-100 text-gray-600";
}

export function fmtPrice(n: number) {
  return n === 0 ? "Gratuito" : `$${n.toLocaleString("es-CO")}`;
}

export function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function unsplash(id: string, w = 600, h = 400) {
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format`;
}

export function fmtM(n: number) {
  return "$" + (n / 1000000).toFixed(1) + "M";
}

