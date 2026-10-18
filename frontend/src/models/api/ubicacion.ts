import { api } from "./cliente";
import type { Ciudad } from "./auth";

// ─── Países, departamentos y ciudades ─────────────────────────────────────────
// Consultar es público; crear, editar y eliminar es solo del administrador.
// Las ciudades se listan con listarCiudades() de auth.ts.
export type { Ciudad };

export interface Pais {
  id: number;
  nombre: string;
}

export interface Departamento {
  id: number;
  nombre: string;
  paisId: number;
  pais: string;
}

export const listarPaises = () => api.get<Pais[]>("/api/paises");
export const listarDepartamentos = () =>
  api.get<Departamento[]>("/api/departamentos");

export const crearPais = (nombre: string) =>
  api.post<Pais>("/api/paises", { nombre });
export const modificarPais = (id: number, nombre: string) =>
  api.put<Pais>(`/api/paises/${id}`, { nombre });
export const eliminarPais = (id: number) =>
  api.delete<{ mensaje: string }>(`/api/paises/${id}`);

export const crearDepartamento = (nombre: string, paisId: number) =>
  api.post<Departamento>("/api/departamentos", { nombre, paisId });
export const modificarDepartamento = (
  id: number,
  nombre: string,
  paisId: number,
) => api.put<Departamento>(`/api/departamentos/${id}`, { nombre, paisId });
export const eliminarDepartamento = (id: number) =>
  api.delete<{ mensaje: string }>(`/api/departamentos/${id}`);

export const crearCiudad = (nombre: string, departamentoId: number) =>
  api.post<Ciudad>("/api/ciudades", { nombre, departamentoId });
export const modificarCiudad = (
  id: number,
  nombre: string,
  departamentoId: number,
) => api.put<Ciudad>(`/api/ciudades/${id}`, { nombre, departamentoId });
export const eliminarCiudad = (id: number) =>
  api.delete<{ mensaje: string }>(`/api/ciudades/${id}`);
