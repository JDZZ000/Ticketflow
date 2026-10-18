import type { Role } from "../types";
import { api } from "./cliente";
import { ROL_DE_LA_API, type RolApi, type UsuarioActual } from "./auth";

// ─── Perfil de quien tiene la sesión iniciada ─────────────────────────────────
// Además de los datos personales, trae lo propio de cada rol: puntos y publicidad del
// cliente, comisión y experiencia del agente, salario y horario del administrador.
interface PerfilApi {
  identificacion: string;
  nombre: string;
  correo: string;
  direccion: string | null;
  ciudadId: number;
  ciudad: string;
  departamento: string;
  pais: string;
  telefonos: string[];
  rol: RolApi;
  puntos?: number;
  publicidad?: boolean;
  reservasTotales?: number;
  eventosAsistidos?: number;
  comision?: number;
  experiencia?: number;
  eventosCreados?: number;
  salario?: number;
  horario?: string | null;
}

export interface PerfilCompleto {
  identificacion: string;
  nombre: string;
  correo: string;
  direccion: string;
  ciudadId: number;
  ciudad: string;
  departamento: string;
  pais: string;
  telefonos: string[];
  role: Role;
  // cliente
  puntos?: number;
  publicidad?: boolean;
  reservasTotales?: number;
  eventosAsistidos?: number;
  // agente
  comision?: number;
  experiencia?: number;
  eventosCreados?: number;
  // administrador
  salario?: number;
  horario?: string;
}

function aPerfil(p: PerfilApi): PerfilCompleto {
  const { rol, direccion, horario, ...resto } = p;
  return {
    ...resto,
    role: ROL_DE_LA_API[rol],
    direccion: direccion ?? "",
    horario: horario ?? undefined,
  };
}

export async function miPerfil(): Promise<PerfilCompleto> {
  return aPerfil(await api.get<PerfilApi>("/api/perfil"));
}

// Solo se pueden cambiar la dirección, la ciudad y los teléfonos.
// La identificación, el nombre, el correo y el rol no se editan desde aquí.
export async function guardarPerfil(cambios: {
  direccion: string;
  ciudadId: number;
  telefonos: string[];
}): Promise<PerfilCompleto> {
  return aPerfil(await api.put<PerfilApi>("/api/perfil", cambios));
}

// El usuario con la forma resumida que usan el menú y el resto de la página
export function aUsuarioActual(p: PerfilCompleto): UsuarioActual {
  return {
    nombre: p.nombre,
    email: p.correo,
    role: p.role,
    id: p.identificacion,
    direccion: p.direccion,
    ciudad: p.ciudad,
    telefono: p.telefonos[0] ?? "",
  };
}
