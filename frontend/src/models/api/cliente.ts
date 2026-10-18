// ─── Cliente de la API ────────────────────────────────────────────────────────
// Único lugar de la página que habla con el servidor. Las pantallas (controllers)
// no usan fetch: piden los datos a las funciones de models/api.
//
// La dirección del servidor sale de VITE_API_URL (archivo frontend/.env) y, si no
// existe, se usa http://localhost:4000.

const API_URL: string =
  import.meta.env?.VITE_API_URL ?? "http://localhost:4000";
const CLAVE_TOKEN = "ticketflow.token";

// Aviso que se emite cuando el servidor dice que la sesión ya no vale (el token venció)
export const SESION_EXPIRADA = "ticketflow:sesion-expirada";

// Neon apaga la base cuando pasa un rato sin uso y tarda unos segundos en despertar.
// Las consultas (GET) que fallan por eso se repiten solas, esperando entre intentos.
const ESPERAS_ENTRE_INTENTOS_MS = [1500, 3000];
const esperar = (ms: number) =>
  new Promise<void>((resolver) => setTimeout(resolver, ms));

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

async function intentar<T>(
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
    // Con una sesión abierta, un 401 significa que el token venció (las rutas de inicio de
    // sesión y registro también responden 401 cuando los datos están mal: esas no cuentan)
    if (respuesta.status === 401 && token && !ruta.startsWith("/api/auth/")) {
      sesion.borrar();
      if (typeof window !== "undefined")
        window.dispatchEvent(new Event(SESION_EXPIRADA));
    }
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

// Solo las consultas (GET) se repiten: son seguras. Crear, editar o eliminar no se repite
// nunca por su cuenta, para no hacer dos veces lo mismo.
async function peticion<T>(
  metodo: Metodo,
  ruta: string,
  cuerpo?: unknown,
): Promise<T> {
  const intentos = metodo === "GET" ? ESPERAS_ENTRE_INTENTOS_MS.length + 1 : 1;
  for (let i = 0; ; i++) {
    try {
      return await intentar<T>(metodo, ruta, cuerpo);
    } catch (error) {
      const sePuedeRepetir =
        error instanceof ApiError &&
        (error.status === 0 || error.status >= 500);
      if (!sePuedeRepetir || i >= intentos - 1) throw error;
      await esperar(ESPERAS_ENTRE_INTENTOS_MS[i]);
    }
  }
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
