import type { Role } from "../types";
import { api, sesion } from "./cliente";

// ─── Sesión, registro y ciudades ──────────────────────────────────────────────

// El usuario con la forma que ya usa toda la página
export interface UsuarioActual {
  nombre: string;
  email: string;
  role: Role;
  id: string;
  direccion: string;
  ciudad: string;
  telefono: string;
}

export interface Ciudad {
  id: number;
  ciudad: string;
  departamentoId: number;
  departamento: string;
  paisId: number;
  pais: string;
}

// La API habla en español; la página usa client / agent / admin
type RolApi = "cliente" | "agente" | "administrador";
const ROL_DE_LA_API: Record<RolApi, Role> = {
  cliente: "client",
  agente: "agent",
  administrador: "admin",
};

interface RespuestaSesion {
  token: string;
  usuario: {
    identificacion: string;
    nombre: string;
    correo: string;
    rol: RolApi;
  };
}

interface PerfilApi {
  identificacion: string;
  nombre: string;
  correo: string;
  direccion: string | null;
  ciudad: string;
  telefonos: string[];
  rol: RolApi;
}

function aUsuario(p: PerfilApi): UsuarioActual {
  return {
    nombre: p.nombre,
    email: p.correo,
    role: ROL_DE_LA_API[p.rol],
    id: p.identificacion,
    direccion: p.direccion ?? "",
    ciudad: p.ciudad,
    telefono: p.telefonos[0] ?? "",
  };
}

// Datos del usuario que tiene la sesión iniciada (también sirve para comprobar que el token sigue vigente)
export async function obtenerPerfil(): Promise<UsuarioActual> {
  return aUsuario(await api.get<PerfilApi>("/api/perfil"));
}

export async function iniciarSesion(
  correo: string,
  contrasena: string,
): Promise<UsuarioActual> {
  const respuesta = await api.post<RespuestaSesion>("/api/auth/login", {
    correo,
    contrasena,
  });
  sesion.guardar(respuesta.token);
  try {
    return await obtenerPerfil();
  } catch (error) {
    sesion.borrar();
    throw error;
  }
}

export interface DatosRegistro {
  identificacion: string;
  nombreCompleto: string;
  correo: string;
  contrasena: string;
  direccion: string;
  ciudadId: number;
  telefonos: string[];
  rol: "cliente" | "agente";
}

export async function registrar(datos: DatosRegistro): Promise<void> {
  await api.post<RespuestaSesion>("/api/auth/registro", datos);
}

export function listarCiudades(): Promise<Ciudad[]> {
  return api.get<Ciudad[]>("/api/ciudades");
}

// Texto que se muestra en las listas: «Bogotá, Cundinamarca»
export const etiquetaCiudad = (c: Ciudad): string =>
  `${c.ciudad}, ${c.departamento}`;

export function cerrarSesion(): void {
  sesion.borrar();
}
