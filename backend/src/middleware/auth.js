import jwt from "jsonwebtoken";

// Lee el token que manda el frontend en el encabezado "Authorization: Bearer <token>"
// y deja los datos de quien hace la petición en req.usuario.
export function verificarToken(req, res, next) {
  const [tipo, token] = (req.headers.authorization ?? "").split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "Debes iniciar sesión" });
  }
  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: datos.id, rol: datos.rol };
    next();
  } catch {
    res.status(401).json({ error: "La sesión no es válida o ya expiró" });
  }
}

// Deja pasar solo a los roles indicados: exigirRol("agente"), exigirRol("agente", "administrador")
export function exigirRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para hacer esto" });
    }
    next();
  };
}
