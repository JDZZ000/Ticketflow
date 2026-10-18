import type { ReservaStatus } from "../types";
import { api } from "./cliente";

// ─── Reportes del administrador ───────────────────────────────────────────────
// Los 9 reportes del enunciado. Solo el administrador puede pedirlos.
// Reglas: los ingresos cuentan únicamente las reservas Confirmadas, y los meses se
// agrupan por la fecha de la reserva.

// Reporte general: cuántos registros hay de cada cosa
export interface Resumen {
  clientes: number;
  agentes: number;
  administradores: number;
  reservas: number;
  eventos: number;
}

// Ingresos y reservas de cada mes (mes: 1 a 12)
export interface IngresoMes {
  mes: number;
  ingresos: number;
  reservas: number;
}

// Reservas de cada evento: total del año y desglose por mes (12 valores, enero a diciembre)
export interface ReservasEvento {
  eventoId: number;
  evento: string;
  total: number;
  meses: number[];
}

export interface EventosPorAgente {
  porAgente: { agente: string; eventos: number }[];
  porAgenteYCiudad: { agente: string; ciudad: string; eventos: number }[];
}

export interface PromedioAgente {
  id: string;
  agente: string;
  eventos: number;
  reservasConfirmadas: number;
  ingresosTotales: number;
  promedioPorReserva: number;
  promedioPorEvento: number;
}

export interface PromedioCliente {
  id: string;
  cliente: string;
  reservasConfirmadas: number;
  ingresosTotales: number;
  promedioPorReserva: number;
}

export interface Cobertura {
  paises: { nombre: string; eventos: number }[];
  departamentos: { nombre: string; eventos: number }[];
  ciudades: { nombre: string; eventos: number }[];
  listado: {
    id: number;
    codigo: string;
    nombre: string;
    pais: string;
    departamento: string;
    ciudad: string;
    estado: string;
  }[];
}

export interface ReservaDelHistorial {
  id: number;
  cliente: string;
  evento: string;
  fechaReserva: string;
  entradas: number;
  total: number;
  estado: ReservaStatus;
  observaciones: string | null;
}

export interface Cancelaciones {
  reservas: {
    id: number;
    cliente: string;
    evento: string;
    fechaReserva: string;
    entradas: number;
    total: number;
    causa: string | null;
  }[];
  eventos: {
    id: number;
    codigo: string;
    nombre: string;
    fecha: string;
    ciudad: string;
    agente: string;
    causa: string | null;
  }[];
}

export interface Reportes {
  resumen: Resumen;
  ingresosPorMes: IngresoMes[];
  reservasPorEvento: ReservasEvento[];
  eventosPorAgente: EventosPorAgente;
  promedioAgente: PromedioAgente[];
  promedioCliente: PromedioCliente[];
  cobertura: Cobertura;
  historial: ReservaDelHistorial[];
  cancelaciones: Cancelaciones;
}

// Pide los 9 reportes a la vez
export async function cargarReportes(anio = 2026): Promise<Reportes> {
  const [
    resumen,
    ingresosPorMes,
    reservasPorEvento,
    eventosPorAgente,
    promedioAgente,
    promedioCliente,
    cobertura,
    historial,
    cancelaciones,
  ] = await Promise.all([
    api.get<Resumen>("/api/reportes/resumen"),
    api.get<IngresoMes[]>(`/api/reportes/ingresos-por-mes?anio=${anio}`),
    api.get<ReservasEvento[]>(`/api/reportes/reservas-por-evento?anio=${anio}`),
    api.get<EventosPorAgente>("/api/reportes/eventos-por-agente"),
    api.get<PromedioAgente[]>("/api/reportes/ingresos-promedio-agente"),
    api.get<PromedioCliente[]>("/api/reportes/ingresos-promedio-cliente"),
    api.get<Cobertura>("/api/reportes/cobertura"),
    api.get<ReservaDelHistorial[]>("/api/reportes/historial-clientes"),
    api.get<Cancelaciones>("/api/reportes/cancelaciones"),
  ]);
  return {
    resumen,
    ingresosPorMes,
    reservasPorEvento,
    eventosPorAgente,
    promedioAgente,
    promedioCliente,
    cobertura,
    historial,
    cancelaciones,
  };
}
