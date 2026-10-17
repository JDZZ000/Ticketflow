// ─── Cliente de la API ────────────────────────────────────────────────────────
// Único lugar de la página que habla con el servidor. Las pantallas (controllers)
// no usan fetch: piden los datos a las funciones de models/api.
//
// La dirección del servidor sale de VITE_API_URL (archivo frontend/.env) y, si no
// existe, se usa http://localhost:4000.

const API_URL: string =
  import.meta.env?.VITE_API_URL ?? "http://localhost:4000";
const CLAVE_TOKEN = "ticketflow.token";

// Error de la API: guarda el código HTTP (401, 403, 409...) y un mensaje claro en español
export class ApiError extends Error {
  status: number;
  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
  }
}

// Token de sesión, guardado en el navegador para que la sesión sobreviva a recargar la página
export const sesion = {
  token(): string | null {
    try {
      return localStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },
  guardar(token: string): void {
    try {
      localStorage.setItem(CLAVE_TOKEN, token);
    } catch {
      /* si el navegador no permite guardar, la sesión dura hasta recargar */
    }
  },
  borrar(): void {
    try {
      localStorage.removeItem(CLAVE_TOKEN);
    } catch {
      /* nada que borrar */
    }
  },
};

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function peticion<T>(
  metodo: Metodo,
  ruta: string,
  cuerpo?: unknown,
): Promise<T> {
  const encabezados: Record<string, string> = {};
  if (cuerpo !== undefined) encabezados["Content-Type"] = "application/json";
  const token = sesion.token();
  if (token) encabezados["Authorization"] = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: encabezados,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    // El servidor está apagado, o la página no se abrió por localhost:8443 (CORS)
    throw new ApiError(
      0,
      "No se pudo conectar con el servidor. Comprueba que el backend esté corriendo y que la página esté abierta en http://localhost:8443.",
    );
  }

  let datos: unknown = null;
  try {
    datos = await respuesta.json();
  } catch {
    /* la respuesta no trae JSON */
  }

  if (!respuesta.ok) {
    const mensaje =
      datos &&
      typeof datos === "object" &&
      "error" in datos &&
      typeof (datos as { error: unknown }).error === "string"
        ? (datos as { error: string }).error
        : "Ocurrió un error inesperado. Intenta de nuevo.";
    throw new ApiError(respuesta.status, mensaje);
  }
  return datos as T;
}

export const api = {
  get: <T>(ruta: string) => peticion<T>("GET", ruta),
  post: <T>(ruta: string, cuerpo?: unknown) =>
    peticion<T>("POST", ruta, cuerpo),
  put: <T>(ruta: string, cuerpo?: unknown) => peticion<T>("PUT", ruta, cuerpo),
  patch: <T>(ruta: string, cuerpo?: unknown) =>
    peticion<T>("PATCH", ruta, cuerpo),
  delete: <T>(ruta: string) => peticion<T>("DELETE", ruta),
};

// Mensaje para mostrar en pantalla a partir de cualquier error
export function mensajeDeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado. Intenta de nuevo.";
}
