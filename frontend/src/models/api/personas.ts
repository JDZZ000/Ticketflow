import { api } from "./cliente";
import type { RolApi } from "./auth";

// ─── Personas (clientes, agentes y administradores) ───────────────────────────
// Solo el administrador puede usar estas rutas.
interface PersonaApi {
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
  comision?: number;
  experiencia?: number;
  salario?: number;
  horario?: string | null;
}

export interface Persona {
  identificacion: string;
  nombre: string;
  correo: string;
  direccion: string;
  ciudadId: number;
  ciudad: string;
  departamento: string;
  pais: string;
  telefonos: string[];
  rol: RolApi;
  // cliente
  puntos?: number;
  publicidad?: boolean;
  // agente
  comision?: number;
  experiencia?: number;
  // administrador
  salario?: number;
  horario?: string;
}

function aPersona(p: PersonaApi): Persona {
  return {
    ...p,
    direccion: p.direccion ?? "",
    horario: p.horario ?? undefined,
  };
}

// Lo propio de cada rol; solo se envía lo que corresponde al rol de la persona
export interface ExtrasDeRol {
  puntos?: number;
  publicidad?: boolean;
  comision?: number;
  experiencia?: number;
  salario?: number;
  horario?: string;
}

export interface DatosPersonaNueva extends ExtrasDeRol {
  identificacion: string;
  nombreCompleto: string;
  correo: string;
  contrasena: string;
  direccion: string;
  ciudadId: number;
  telefonos: string[];
  rol: RolApi;
}

// En la edición, la identificación y el rol no cambian; la contraseña es opcional
export interface DatosPersonaEdicion extends ExtrasDeRol {
  nombreCompleto: string;
  correo: string;
  direccion: string;
  ciudadId: number;
  telefonos: string[];
  contrasena?: string;
}

export async function listarPersonas(): Promise<Persona[]> {
  return (await api.get<PersonaApi[]>("/api/personas")).map(aPersona);
}

export async function crearPersona(datos: DatosPersonaNueva): Promise<Persona> {
  return aPersona(await api.post<PersonaApi>("/api/personas", datos));
}

export async function modificarPersona(
  identificacion: string,
  datos: DatosPersonaEdicion,
): Promise<Persona> {
  return aPersona(
    await api.put<PersonaApi>(
      `/api/personas/${encodeURIComponent(identificacion)}`,
      datos,
    ),
  );
}

// No se puede eliminar a quien tiene reservas o eventos, ni la propia cuenta
export async function eliminarPersona(identificacion: string): Promise<void> {
  await api.delete<{ mensaje: string }>(
    `/api/personas/${encodeURIComponent(identificacion)}`,
  );
}
