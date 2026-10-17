import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

// ─── Datos de ejemplo de TicketFlow ──────────────────────────────────────────
// Carga el administrador, un agente, tres clientes, los 6 eventos y las 5
// reservas que antes vivían en memoria (mockData.ts).
//
// Se puede correr las veces que se quiera: borra las personas, eventos y
// reservas que haya y los vuelve a cargar. No toca países, departamentos,
// ciudades ni los estados.

const CLAVES = {
  administrador: "admin123",
  agente: "agente123",
  cliente: "cliente123",
};

const PERSONAS = [
  {
    rol: "administrador",
    identificacion: "39.876.543",
    nombre: "Admin User",
    correo: "admin@ticketflow.com",
    direccion: "Cra. 15 # 93-47, Of. 302",
    ciudad: "Bogotá",
    telefonos: ["+57 300 987 6543"],
    salario: 4500000,
    horario: "Lunes a viernes, 8:00 a. m. a 5:00 p. m.",
  },
  {
    rol: "agente",
    identificacion: "900.123.456",
    nombre: "Catálogo inicial",
    correo: "agente@ticketflow.com",
    direccion: "Cl. 72 # 10-34",
    ciudad: "Bogotá",
    telefonos: ["+57 601 555 0100"],
    comision: 7.5,
    experiencia: 5,
  },
  {
    rol: "cliente",
    identificacion: "1.020.304.050",
    nombre: "María González",
    correo: "maria@ejemplo.com",
    direccion: "Cra. 7 # 45-12",
    ciudad: "Bogotá",
    telefonos: ["+57 310 111 2233"],
  },
  {
    rol: "cliente",
    identificacion: "1.030.405.060",
    nombre: "Carlos Ruiz",
    correo: "carlos@ejemplo.com",
    direccion: "Cl. 10 # 4-20",
    ciudad: "Medellín",
    telefonos: ["+57 311 222 3344"],
  },
  {
    rol: "cliente",
    identificacion: "1.040.506.070",
    nombre: "Ana Moreno",
    correo: "ana@ejemplo.com",
    direccion: "Av. 6N # 25-18",
    ciudad: "Cali",
    telefonos: ["+57 312 333 4455"],
  },
];

// Las capacidades son las mismas que tiene mockData.ts. Son pequeñas a propósito,
// para poder llegar a "Últimas entradas" y "Agotado" en una demostración.
const EVENTOS = [
  {
    codigo: "EVT-001",
    nombre: "Romeo y Julieta — Ballet Nacional",
    descripcion:
      "El ballet clásico por excelencia presentado por la compañía nacional con escenografía de nivel mundial.",
    teatro: "Teatro Colón",
    ciudad: "Bogotá",
    fecha: "2027-03-15",
    horaInicio: "19:00",
    horaFin: "21:30",
    capacidad: 20,
    precio: 85000,
    estado: "En Boletería",
    imagen: "photo-1507003211169-0a1dd7228f2d",
    observaciones: "Función especial de temporada.",
  },
  {
    codigo: "EVT-002",
    nombre: "Rock Sinfónico — Soda Stereo Tribute",
    descripcion:
      "Una noche épica donde la sinfónica interpreta los mejores temas de Soda Stereo con proyecciones en vivo.",
    teatro: "Movistar Arena",
    ciudad: "Bogotá",
    fecha: "2027-02-03",
    horaInicio: "20:00",
    horaFin: "23:00",
    capacidad: 30,
    precio: 120000,
    estado: "En Boletería",
    imagen: "photo-1493225457124-a3eb161ffa5f",
    observaciones: "No se permiten menores de 12 años sin acompañante.",
  },
  {
    codigo: "EVT-003",
    nombre: "Feria del Libro Internacional",
    descripcion:
      "El evento literario más importante del país con presencia de autores internacionales y presentaciones.",
    teatro: "Corferias",
    ciudad: "Bogotá",
    fecha: "2027-01-28",
    horaInicio: "10:00",
    horaFin: "20:00",
    capacidad: 50,
    precio: 25000,
    estado: "En Boletería",
    imagen: "photo-1481627834876-b7833e8f5570",
    observaciones: "",
  },
  {
    codigo: "EVT-004",
    nombre: "Festival de Jazz en el Parque",
    descripcion:
      "Tres días de jazz al aire libre con artistas nacionales e internacionales en el corazón de la ciudad.",
    teatro: "Parque Simón Bolívar",
    ciudad: "Bogotá",
    fecha: "2027-04-22",
    horaInicio: "14:00",
    horaFin: "22:00",
    capacidad: 20,
    precio: 0,
    estado: "En Boletería",
    imagen: "photo-1514320291840-2e0a9bf2a9ae",
    observaciones: "Entrada gratuita.",
  },
  {
    codigo: "EVT-005",
    nombre: "Cirque Lumière — Acrobacia Contemporánea",
    descripcion:
      "Un espectáculo visual sin precedentes que combina acrobacia, danza contemporánea y proyecciones.",
    teatro: "Centro de Convenciones",
    ciudad: "Medellín",
    fecha: "2027-01-10",
    horaInicio: "18:30",
    horaFin: "21:00",
    capacidad: 50,
    precio: 95000,
    estado: "En Boletería",
    imagen: "photo-1578662996442-48f60103fc96",
    observaciones: "Mayores de 5 años.",
  },
  {
    codigo: "EVT-006",
    nombre: "Stand Up Comedy — Gala Nacional",
    descripcion:
      "Los mejores comediantes del país en una noche de humor inteligente y entretenimiento para toda la familia.",
    teatro: "Teatro Libre",
    ciudad: "Cali",
    fecha: "2027-02-05",
    horaInicio: "20:00",
    horaFin: "22:30",
    capacidad: 40,
    precio: 60000,
    estado: "En Boletería",
    imagen: "photo-1527224857830-43a7acc85260",
    observaciones: "Apto para todos los públicos.",
  },
];

const RESERVAS = [
  {
    evento: "EVT-001",
    cliente: "María González",
    fecha: "2026-08-01",
    entradas: 2,
    total: 170000,
    estado: "Confirmada",
    observaciones: "Preferencia fila central.",
  },
  {
    evento: "EVT-002",
    cliente: "María González",
    fecha: "2026-08-05",
    entradas: 4,
    total: 480000,
    estado: "Reservada",
    observaciones: "",
  },
  {
    evento: "EVT-005",
    cliente: "María González",
    fecha: "2026-08-10",
    entradas: 1,
    total: 95000,
    estado: "Cancelada",
    observaciones: "Cancelada por el cliente.",
  },
  {
    evento: "EVT-003",
    cliente: "Carlos Ruiz",
    fecha: "2026-08-08",
    entradas: 3,
    total: 75000,
    estado: "Confirmada",
    observaciones: "",
  },
  {
    evento: "EVT-001",
    cliente: "Ana Moreno",
    fecha: "2026-08-09",
    entradas: 2,
    total: 170000,
    estado: "Reservada",
    observaciones: "VIP si hay disponibilidad.",
  },
];

async function sembrar() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Vacía las tablas de datos (los catálogos se quedan) y reinicia los ids
    await client.query(
      "TRUNCATE reserva, evento, telefono_persona, cliente, agente, administrador, persona RESTART IDENTITY",
    );

    async function buscarId(sql, valor, descripcion) {
      const { rows } = await client.query(sql, [valor]);
      if (!rows[0]) {
        throw new Error(
          `No existe ${descripcion} "${valor}". ¿Corriste schema.sql en Neon?`,
        );
      }
      return rows[0].id;
    }
    const idCiudad = (nombre) =>
      buscarId("SELECT id FROM ciudad WHERE nombre = $1", nombre, "la ciudad");
    const idEstadoEvento = (nombre) =>
      buscarId(
        "SELECT id FROM estado_evento WHERE nombre = $1",
        nombre,
        "el estado de evento",
      );
    const idEstadoReserva = (nombre) =>
      buscarId(
        "SELECT id FROM estado_reserva WHERE nombre = $1",
        nombre,
        "el estado de reserva",
      );

    // ── Personas (y su rol) ──
    const identificacionPorNombre = new Map();
    for (const p of PERSONAS) {
      const hash = await bcrypt.hash(CLAVES[p.rol], 10);
      await client.query(
        `INSERT INTO persona (identificacion, nombre_completo, correo, contrasena, direccion, ciudad_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          p.identificacion,
          p.nombre,
          p.correo,
          hash,
          p.direccion,
          await idCiudad(p.ciudad),
        ],
      );
      for (const telefono of p.telefonos) {
        await client.query(
          "INSERT INTO telefono_persona (persona_id, telefono) VALUES ($1, $2)",
          [p.identificacion, telefono],
        );
      }
      if (p.rol === "administrador") {
        await client.query(
          "INSERT INTO administrador (persona_id, salario, horario) VALUES ($1, $2, $3)",
          [p.identificacion, p.salario, p.horario],
        );
      } else if (p.rol === "agente") {
        await client.query(
          "INSERT INTO agente (persona_id, comision, experiencia) VALUES ($1, $2, $3)",
          [p.identificacion, p.comision, p.experiencia],
        );
      } else {
        await client.query("INSERT INTO cliente (persona_id) VALUES ($1)", [
          p.identificacion,
        ]);
      }
      identificacionPorNombre.set(p.nombre, p.identificacion);
    }

    // ── Eventos (todos creados por el agente de ejemplo) ──
    const agente = PERSONAS.find((p) => p.rol === "agente");
    const idEventoPorCodigo = new Map();
    for (const e of EVENTOS) {
      const { rows } = await client.query(
        `INSERT INTO evento (codigo, nombre, descripcion, teatro, capacidad, precio_base,
                             fecha_hora_inicio, fecha_hora_fin, observacion, imagen,
                             ciudad_id, estado_evento_id, agente_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          e.codigo,
          e.nombre,
          e.descripcion,
          e.teatro,
          e.capacidad,
          e.precio,
          `${e.fecha} ${e.horaInicio}`,
          `${e.fecha} ${e.horaFin}`,
          e.observaciones,
          e.imagen,
          await idCiudad(e.ciudad),
          await idEstadoEvento(e.estado),
          agente.identificacion,
        ],
      );
      idEventoPorCodigo.set(e.codigo, rows[0].id);
    }

    // ── Reservas ──
    for (const r of RESERVAS) {
      await client.query(
        `INSERT INTO reserva (fecha_hora, num_entradas, total, observacion,
                              cliente_id, evento_id, estado_reserva_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          `${r.fecha} 10:00`,
          r.entradas,
          r.total,
          r.observaciones,
          identificacionPorNombre.get(r.cliente),
          idEventoPorCodigo.get(r.evento),
          await idEstadoReserva(r.estado),
        ],
      );
    }

    await client.query("COMMIT");

    console.log("Datos de ejemplo cargados:");
    console.log(
      `  ${PERSONAS.length} personas, ${EVENTOS.length} eventos y ${RESERVAS.length} reservas`,
    );
    console.log("Cuentas para iniciar sesión:");
    for (const p of PERSONAS) {
      console.log(
        `  ${p.rol.padEnd(13)} ${p.correo.padEnd(24)} contraseña: ${CLAVES[p.rol]}`,
      );
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("No se pudieron cargar los datos de ejemplo:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

sembrar();
