import type { Evento, Reserva } from "../types";

// ─── Mock Data ─────────────────────────────────────────────────────────────────
export const EVENTOS: Evento[] = [
  { id: 1, codigo: "EVT-001", nombre: "Romeo y Julieta — Ballet Nacional", descripcion: "El ballet clásico por excelencia presentado por la compañía nacional con escenografía de nivel mundial.", teatro: "Teatro Colón", ciudad: "Bogotá", pais: "Colombia", fecha: "2026-09-15", horaInicio: "19:00", horaFin: "21:30", capacidad: 1200, precio: 85000, estado: "En Boletería", imagen: "photo-1507003211169-0a1dd7228f2d", observaciones: "Función especial de temporada." },
  { id: 2, codigo: "EVT-002", nombre: "Rock Sinfónico — Soda Stereo Tribute", descripcion: "Una noche épica donde la sinfónica interpreta los mejores temas de Soda Stereo con proyecciones en vivo.", teatro: "Movistar Arena", ciudad: "Bogotá", pais: "Colombia", fecha: "2026-10-03", horaInicio: "20:00", horaFin: "23:00", capacidad: 14000, precio: 120000, estado: "En Boletería", imagen: "photo-1493225457124-a3eb161ffa5f", observaciones: "No se permiten menores de 12 años sin acompañante." },
  { id: 3, codigo: "EVT-003", nombre: "Feria del Libro Internacional", descripcion: "El evento literario más importante del país con presencia de autores internacionales y presentaciones.", teatro: "Corferias", ciudad: "Bogotá", pais: "Colombia", fecha: "2026-09-28", horaInicio: "10:00", horaFin: "20:00", capacidad: 5000, precio: 25000, estado: "Programado", imagen: "photo-1481627834876-b7833e8f5570", observaciones: "" },
  { id: 4, codigo: "EVT-004", nombre: "Festival de Jazz en el Parque", descripcion: "Tres días de jazz al aire libre con artistas nacionales e internacionales en el corazón de la ciudad.", teatro: "Parque Simón Bolívar", ciudad: "Bogotá", pais: "Colombia", fecha: "2026-08-22", horaInicio: "14:00", horaFin: "22:00", capacidad: 20000, precio: 0, estado: "Finalizado", imagen: "photo-1514320291840-2e0a9bf2a9ae", observaciones: "Entrada gratuita." },
  { id: 5, codigo: "EVT-005", nombre: "Cirque Lumière — Acrobacia Contemporánea", descripcion: "Un espectáculo visual sin precedentes que combina acrobacia, danza contemporánea y proyecciones.", teatro: "Centro de Convenciones", ciudad: "Medellín", pais: "Colombia", fecha: "2026-11-10", horaInicio: "18:30", horaFin: "21:00", capacidad: 2500, precio: 95000, estado: "En Boletería", imagen: "photo-1578662996442-48f60103fc96", observaciones: "Mayores de 5 años." },
  { id: 6, codigo: "EVT-006", nombre: "Stand Up Comedy — Gala Nacional", descripcion: "Los mejores comediantes del país en una noche de humor inteligente y entretenimiento para toda la familia.", teatro: "Teatro Libre", ciudad: "Cali", pais: "Colombia", fecha: "2026-09-05", horaInicio: "20:00", horaFin: "22:30", capacidad: 800, precio: 60000, estado: "Cancelado", imagen: "photo-1527224857830-43a7acc85260", observaciones: "Cancelado por fuerza mayor." },
];

export const RESERVAS: Reserva[] = [
  { id: 1001, eventoId: 1, cliente: "María González", fechaReserva: "2026-08-01", entradas: 2, total: 170000, estado: "Confirmada", observaciones: "Preferencia fila central." },
  { id: 1002, eventoId: 2, cliente: "María González", fechaReserva: "2026-08-05", entradas: 4, total: 480000, estado: "Reservada", observaciones: "" },
  { id: 1003, eventoId: 5, cliente: "María González", fechaReserva: "2026-08-10", entradas: 1, total: 95000, estado: "Cancelada", observaciones: "Cancelada por el cliente." },
  { id: 1004, eventoId: 3, cliente: "Carlos Ruiz", fechaReserva: "2026-08-08", entradas: 3, total: 75000, estado: "Confirmada", observaciones: "" },
  { id: 1005, eventoId: 1, cliente: "Ana Moreno", fechaReserva: "2026-08-09", entradas: 2, total: 170000, estado: "Reservada", observaciones: "VIP si hay disponibilidad." },
];

