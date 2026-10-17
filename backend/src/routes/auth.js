import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = Router();

// El administrador no se registra desde la página: lo crea el sistema
const ROLES_REGISTRABLES = ["cliente", "agente"];

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.identificacion, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );
}

// POST /api/auth/registro
router.post("/registro", async (req, res) => {
  const {
    identificacion,
    nombreCompleto,
    correo,
    contrasena,
    direccion,
    ciudadId,
    telefonos = [],
    rol,
  } = req.body ?? {};

  if (
    !identificacion ||
    !nombreCompleto ||
    !correo ||
    !contrasena ||
    !ciudadId ||
    !rol
  ) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  if (!ROLES_REGISTRABLES.includes(rol)) {
    return res.status(400).json({ error: "El rol debe ser cliente o agente" });
  }
  if (!/^\S+@\S+\.\S+$/.test(correo)) {
    return res.status(400).json({ error: "El correo no es válido" });
  }
  if (String(contrasena).length < 6) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }
  if (!Array.isArray(telefonos)) {
    return res
      .status(400)
      .json({ error: "Los teléfonos deben enviarse como una lista" });
  }

  const correoNormalizado = String(correo).toLowerCase();
  const hash = await bcrypt.hash(String(contrasena), 10);
  const client = await pool.connect();

  try {
    // Todo o nada: si algo falla, no queda una persona a medias
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO persona (identificacion, nombre_completo, correo, contrasena, direccion, ciudad_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        identificacion,
        nombreCompleto,
        correoNormalizado,
        hash,
        direccion ?? null,
        ciudadId,
      ],
    );
    for (const telefono of new Set(telefonos)) {
      await client.query(
        "INSERT INTO telefono_persona (persona_id, telefono) VALUES ($1, $2)",
        [identificacion, telefono],
      );
    }
    await client.query(
      rol === "cliente"
        ? "INSERT INTO cliente (persona_id) VALUES ($1)"
        : "INSERT INTO agente (persona_id) VALUES ($1)",
      [identificacion],
    );
    await client.query("COMMIT");

    const usuario = {
      identificacion,
      nombre: nombreCompleto,
      correo: correoNormalizado,
      rol,
    };
    res.status(201).json({ token: firmarToken(usuario), usuario });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res
        .status(409)
        .json({
          error: "Ya existe un usuario con esa identificación o ese correo",
        });
    }
    if (error.code === "23503") {
      return res.status(400).json({ error: "La ciudad indicada no existe" });
    }
    console.error(error);
    res.status(500).json({ error: "No se pudo completar el registro" });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { correo, contrasena } = req.body ?? {};
  if (!correo || !contrasena) {
    return res
      .status(400)
      .json({ error: "Correo y contraseña son obligatorios" });
  }

  try {
    // El rol sale de en cuál tabla hija (administrador, agente, cliente) está la persona
    const { rows } = await pool.query(
      `SELECT p.identificacion, p.nombre_completo, p.correo, p.contrasena,
              CASE WHEN a.persona_id IS NOT NULL THEN 'administrador'
                   WHEN g.persona_id IS NOT NULL THEN 'agente'
                   WHEN c.persona_id IS NOT NULL THEN 'cliente' END AS rol
         FROM persona p
         LEFT JOIN administrador a ON a.persona_id = p.identificacion
         LEFT JOIN agente g ON g.persona_id = p.identificacion
         LEFT JOIN cliente c ON c.persona_id = p.identificacion
        WHERE p.correo = $1`,
      [String(correo).toLowerCase()],
    );
    const fila = rows[0];
    const valido =
      fila && (await bcrypt.compare(String(contrasena), fila.contrasena));
    // Mismo mensaje si el correo no existe o la contraseña está mal
    if (!valido) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    const usuario = {
      identificacion: fila.identificacion,
      nombre: fila.nombre_completo,
      correo: fila.correo,
      rol: fila.rol,
    };
    res.json({ token: firmarToken(usuario), usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo iniciar sesión" });
  }
});

export default router;
