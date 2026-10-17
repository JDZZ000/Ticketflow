import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { verificarToken, exigirRol } from "../middleware/auth.js";

const router = Router();

// Gestionar a las demás personas es solo del administrador
const soloAdmin = [verificarToken, exigirRol("administrador")];

const ROLES = ["cliente", "agente", "administrador"];
const MAX_TELEFONOS = 5;

// Cada persona sale con sus datos comunes y lo propio de su rol. Nunca con la contraseña.
const CONSULTA_PERSONAS = `
  SELECT p.identificacion, p.nombre_completo AS nombre, p.correo, p.direccion,
         p.ciudad_id AS "ciudadId", c.nombre AS ciudad, d.nombre AS departamento, pa.nombre AS pais,
         CASE WHEN a.persona_id IS NOT NULL THEN 'administrador'
              WHEN g.persona_id IS NOT NULL THEN 'agente'
              WHEN cl.persona_id IS NOT NULL THEN 'cliente' END AS rol,
         cl.puntos, cl.publicidad,
         g.comision::float8 AS comision, g.experiencia,
         a.salario::float8 AS salario, a.horario
    FROM persona p
    JOIN ciudad c ON c.id = p.ciudad_id
    JOIN departamento d ON d.id = c.departamento_id
    JOIN pais pa ON pa.id = d.pais_id
    LEFT JOIN administrador a ON a.persona_id = p.identificacion
    LEFT JOIN agente g ON g.persona_id = p.identificacion
    LEFT JOIN cliente cl ON cl.persona_id = p.identificacion`;

function armarPersona(f, telefonos) {
  const persona = {
    identificacion: f.identificacion,
    nombre: f.nombre,
    correo: f.correo,
    direccion: f.direccion,
    ciudadId: f.ciudadId,
    ciudad: f.ciudad,
    departamento: f.departamento,
    pais: f.pais,
    telefonos,
    rol: f.rol,
  };
  if (f.rol === "cliente")
    Object.assign(persona, {
      puntos: f.puntos,
      publicidad: Boolean(f.publicidad),
    });
  else if (f.rol === "agente")
    Object.assign(persona, {
      comision: f.comision,
      experiencia: f.experiencia,
    });
  else Object.assign(persona, { salario: f.salario, horario: f.horario });
  return persona;
}

async function obtenerPersona(identificacion) {
  const { rows } = await pool.query(
    `${CONSULTA_PERSONAS} WHERE p.identificacion = $1`,
    [identificacion],
  );
  if (!rows[0]) return null;
  const tel = await pool.query(
    "SELECT telefono FROM telefono_persona WHERE persona_id = $1 ORDER BY id",
    [identificacion],
  );
  return armarPersona(
    rows[0],
    tel.rows.map((t) => t.telefono),
  );
}

const idValido = (id) => /^[0-9A-Za-z.\-]{1,20}$/.test(id);

function responderError(res, error, mensajeGeneral) {
  console.error(error);
  res.status(500).json({ error: mensajeGeneral });
}

const hayValor = (v) =>
  v !== undefined && v !== null && String(v).trim() !== "";

// Revisa los datos de una persona. Al crear, los campos obligatorios deben venir;
// al editar, solo se revisan los que lleguen. Devuelve { error } o { datos }.
function validarPersona(c, { creando, rol }) {
  const datos = {};
  const texto = (v) => String(v ?? "").trim();

  if (creando || c.nombreCompleto !== undefined) {
    const n = texto(c.nombreCompleto);
    if (!n || n.length > 120)
      return { error: "El nombre es obligatorio (máximo 120 caracteres)" };
    datos.nombreCompleto = n;
  }
  if (creando || c.correo !== undefined) {
    const correo = texto(c.correo).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(correo) || correo.length > 120)
      return { error: "El correo no es válido" };
    datos.correo = correo;
  }
  if (c.direccion !== undefined) {
    if (typeof c.direccion !== "string" || c.direccion.trim().length > 160) {
      return {
        error: "La dirección debe ser un texto de máximo 160 caracteres",
      };
    }
    datos.direccion = c.direccion.trim();
  }
  if (creando || c.ciudadId !== undefined) {
    const ciudadId = Number(c.ciudadId);
    if (!hayValor(c.ciudadId) || !Number.isInteger(ciudadId))
      return { error: "La ciudad no es válida" };
    datos.ciudadId = ciudadId;
  }
  if (creando || c.contrasena !== undefined) {
    if (typeof c.contrasena !== "string" || c.contrasena.length < 6) {
      return { error: "La contraseña debe tener al menos 6 caracteres" };
    }
    datos.contrasena = c.contrasena;
  }
  if (c.telefonos !== undefined) {
    if (
      !Array.isArray(c.telefonos) ||
      c.telefonos.some((t) => typeof t !== "string")
    ) {
      return { error: "Los teléfonos deben enviarse como una lista de textos" };
    }
    const lista = [
      ...new Set(c.telefonos.map((t) => t.trim()).filter(Boolean)),
    ];
    if (lista.length > MAX_TELEFONOS)
      return { error: `Se permiten hasta ${MAX_TELEFONOS} teléfonos` };
    if (lista.some((t) => t.length > 25))
      return { error: "Cada teléfono admite máximo 25 caracteres" };
    datos.telefonos = lista;
  }

  // Lo propio de cada rol (lo de otros roles se ignora)
  if (rol === "cliente") {
    if (c.puntos !== undefined) {
      const puntos = Number(c.puntos);
      if (!hayValor(c.puntos) || !Number.isInteger(puntos) || puntos < 0)
        return { error: "Los puntos deben ser un entero de 0 en adelante" };
      datos.puntos = puntos;
    }
    if (c.publicidad !== undefined) {
      if (typeof c.publicidad !== "boolean")
        return { error: "publicidad debe ser verdadero o falso" };
      datos.publicidad = c.publicidad;
    }
  } else if (rol === "agente") {
    if (c.comision !== undefined) {
      const comision = Number(c.comision);
      if (
        !hayValor(c.comision) ||
        !Number.isFinite(comision) ||
        comision < 0 ||
        comision > 100
      )
        return { error: "La comisión debe estar entre 0 y 100" };
      datos.comision = comision;
    }
    if (c.experiencia !== undefined) {
      const exp = Number(c.experiencia);
      if (!hayValor(c.experiencia) || !Number.isInteger(exp) || exp < 0)
        return {
          error: "La experiencia (años) debe ser un entero de 0 en adelante",
        };
      datos.experiencia = exp;
    }
  } else if (rol === "administrador") {
    if (creando || c.salario !== undefined) {
      const salario = Number(c.salario);
      if (!hayValor(c.salario) || !Number.isFinite(salario) || salario < 0)
        return { error: "El salario es obligatorio y no puede ser negativo" };
      datos.salario = salario;
    }
    if (c.horario !== undefined) {
      if (typeof c.horario !== "string" || c.horario.trim().length > 60)
        return { error: "El horario admite máximo 60 caracteres" };
      datos.horario = c.horario.trim();
    }
  }
  return { datos };
}

// GET /api/personas?rol=cliente&q=maria — lista (con filtro opcional por rol y búsqueda)
router.get("/", ...soloAdmin, async (req, res) => {
  const rol = req.query?.rol ?? null;
  if (rol !== null && !ROLES.includes(rol)) {
    return res
      .status(400)
      .json({ error: `El rol debe ser uno de: ${ROLES.join(", ")}` });
  }
  const q = hayValor(req.query?.q)
    ? `%${String(req.query.q).trim().toLowerCase()}%`
    : null;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM (${CONSULTA_PERSONAS}) t
        WHERE ($1::text IS NULL OR t.rol = $1::text)
          AND ($2::text IS NULL OR LOWER(t.nombre) LIKE $2::text OR LOWER(t.correo) LIKE $2::text OR t.identificacion LIKE $2::text)
        ORDER BY t.nombre`,
      [rol, q],
    );
    const tel = await pool.query(
      "SELECT persona_id, telefono FROM telefono_persona ORDER BY id",
    );
    const porPersona = new Map();
    for (const t of tel.rows)
      porPersona.set(t.persona_id, [
        ...(porPersona.get(t.persona_id) ?? []),
        t.telefono,
      ]);
    res.json(
      rows.map((f) => armarPersona(f, porPersona.get(f.identificacion) ?? [])),
    );
  } catch (error) {
    responderError(res, error, "No se pudieron consultar las personas");
  }
});

// GET /api/personas/:id — una persona por su identificación
router.get("/:id", ...soloAdmin, async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ error: "La identificación no es válida" });
  try {
    const persona = await obtenerPersona(req.params.id);
    if (!persona)
      return res.status(404).json({ error: "La persona no existe" });
    res.json(persona);
  } catch (error) {
    responderError(res, error, "No se pudo consultar la persona");
  }
});

// POST /api/personas — el administrador crea una cuenta de cualquier rol
router.post("/", ...soloAdmin, async (req, res) => {
  const c = req.body ?? {};
  const identificacion = String(c.identificacion ?? "").trim();
  if (!idValido(identificacion)) {
    return res
      .status(400)
      .json({
        error:
          "La identificación es obligatoria (máximo 20 caracteres: letras, números, puntos y guiones)",
      });
  }
  if (!ROLES.includes(c.rol))
    return res
      .status(400)
      .json({ error: `El rol debe ser uno de: ${ROLES.join(", ")}` });
  const { error, datos } = validarPersona(c, { creando: true, rol: c.rol });
  if (error) return res.status(400).json({ error });

  const hash = await bcrypt.hash(datos.contrasena, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO persona (identificacion, nombre_completo, correo, contrasena, direccion, ciudad_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        identificacion,
        datos.nombreCompleto,
        datos.correo,
        hash,
        datos.direccion ?? null,
        datos.ciudadId,
      ],
    );
    for (const telefono of datos.telefonos ?? []) {
      await client.query(
        "INSERT INTO telefono_persona (persona_id, telefono) VALUES ($1, $2)",
        [identificacion, telefono],
      );
    }
    if (c.rol === "cliente") {
      await client.query(
        "INSERT INTO cliente (persona_id, puntos, publicidad) VALUES ($1, $2, $3)",
        [identificacion, datos.puntos ?? 0, datos.publicidad ?? true],
      );
    } else if (c.rol === "agente") {
      await client.query(
        "INSERT INTO agente (persona_id, comision, experiencia) VALUES ($1, $2, $3)",
        [identificacion, datos.comision ?? 0, datos.experiencia ?? 0],
      );
    } else {
      await client.query(
        "INSERT INTO administrador (persona_id, salario, horario) VALUES ($1, $2, $3)",
        [identificacion, datos.salario, datos.horario ?? null],
      );
    }
    await client.query("COMMIT");
    res.status(201).json(await obtenerPersona(identificacion));
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505")
      return res
        .status(409)
        .json({
          error: "Ya existe una persona con esa identificación o ese correo",
        });
    if (err.code === "23503")
      return res.status(400).json({ error: "La ciudad indicada no existe" });
    responderError(res, err, "No se pudo crear la persona");
  } finally {
    client.release();
  }
});

// PUT /api/personas/:id — solo cambia lo que se envíe. La identificación y el rol no cambian.
router.put("/:id", ...soloAdmin, async (req, res) => {
  const id = req.params.id;
  if (!idValido(id))
    return res.status(400).json({ error: "La identificación no es válida" });

  const client = await pool.connect();
  try {
    const actual = await obtenerPersona(id);
    if (!actual) return res.status(404).json({ error: "La persona no existe" });

    const { error, datos } = validarPersona(req.body ?? {}, {
      creando: false,
      rol: actual.rol,
    });
    if (error) return res.status(400).json({ error });

    // Si se envía una contraseña nueva, se guarda cifrada (restablecer la contraseña)
    const hash = datos.contrasena
      ? await bcrypt.hash(datos.contrasena, 10)
      : null;

    await client.query("BEGIN");
    await client.query(
      `UPDATE persona
          SET nombre_completo = COALESCE($1, nombre_completo),
              correo = COALESCE($2, correo),
              direccion = COALESCE($3, direccion),
              ciudad_id = COALESCE($4, ciudad_id),
              contrasena = COALESCE($5, contrasena)
        WHERE identificacion = $6`,
      [
        datos.nombreCompleto ?? null,
        datos.correo ?? null,
        datos.direccion ?? null,
        datos.ciudadId ?? null,
        hash,
        id,
      ],
    );
    if (actual.rol === "cliente") {
      await client.query(
        "UPDATE cliente SET puntos = COALESCE($1, puntos), publicidad = COALESCE($2, publicidad) WHERE persona_id = $3",
        [datos.puntos ?? null, datos.publicidad ?? null, id],
      );
    } else if (actual.rol === "agente") {
      await client.query(
        "UPDATE agente SET comision = COALESCE($1, comision), experiencia = COALESCE($2, experiencia) WHERE persona_id = $3",
        [datos.comision ?? null, datos.experiencia ?? null, id],
      );
    } else {
      await client.query(
        "UPDATE administrador SET salario = COALESCE($1, salario), horario = COALESCE($2, horario) WHERE persona_id = $3",
        [datos.salario ?? null, datos.horario ?? null, id],
      );
    }
    if (datos.telefonos !== undefined) {
      await client.query("DELETE FROM telefono_persona WHERE persona_id = $1", [
        id,
      ]);
      for (const telefono of datos.telefonos) {
        await client.query(
          "INSERT INTO telefono_persona (persona_id, telefono) VALUES ($1, $2)",
          [id, telefono],
        );
      }
    }
    await client.query("COMMIT");
    res.json(await obtenerPersona(id));
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505")
      return res
        .status(409)
        .json({ error: "Ya existe otra persona con ese correo" });
    if (err.code === "23503")
      return res.status(400).json({ error: "La ciudad indicada no existe" });
    responderError(res, err, "No se pudo actualizar la persona");
  } finally {
    client.release();
  }
});

// DELETE /api/personas/:id
router.delete("/:id", ...soloAdmin, async (req, res) => {
  const id = req.params.id;
  if (!idValido(id))
    return res.status(400).json({ error: "La identificación no es válida" });
  if (id === req.usuario.id) {
    return res
      .status(409)
      .json({ error: "No puedes eliminar tu propia cuenta" });
  }
  try {
    // Al borrar la persona se borran solos sus teléfonos y su ficha de rol (ON DELETE CASCADE)
    const { rows } = await pool.query(
      "DELETE FROM persona WHERE identificacion = $1 RETURNING identificacion",
      [id],
    );
    if (!rows[0])
      return res.status(404).json({ error: "La persona no existe" });
    res.json({ mensaje: "Persona eliminada" });
  } catch (err) {
    // La base no deja borrar a un cliente con reservas ni a un agente con eventos
    if (err.code === "23503") {
      return res
        .status(409)
        .json({
          error:
            "No se puede eliminar: la persona tiene reservas o eventos asociados",
        });
    }
    responderError(res, err, "No se pudo eliminar la persona");
  }
});

export default router;
