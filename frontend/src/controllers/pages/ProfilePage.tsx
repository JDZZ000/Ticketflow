import { useEffect, useState } from "react";
import type { Role } from "../../models/types";
import { Input } from "../../views/components/Input";
import { SelectorCiudad } from "../../views/components/SelectorCiudad";
import { PRIMARY, PRIMARY_L, NAV } from "../../utils/theme";
import { fmtPrice } from "../../utils/format";
import { Btn } from "../../views/components/Btn";
import { PageHeader } from "../../views/layouts/PageHeader";
import {
  listarCiudades,
  type Ciudad,
  type UsuarioActual,
} from "../../models/api/auth";
import { mensajeDeError } from "../../models/api/cliente";
import {
  miPerfil,
  guardarPerfil,
  aUsuarioActual,
  type PerfilCompleto,
} from "../../models/api/perfil";

const MAX_TELEFONOS = 5;

// ─── PROFILE PAGE ────────────────────────────────────────────────────────────
export function ProfilePage({
  role,
  user,
  onPerfilActualizado,
}: {
  role: Role;
  user: { nombre: string; email: string } | null;
  // Avisa a la página (menú, encabezado) que los datos de la persona cambiaron
  onPerfilActualizado: (u: UsuarioActual) => void;
}) {
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<{
    direccion: string;
    ciudadId: number | null;
    telefonos: string[];
  }>({ direccion: "", ciudadId: null, telefonos: [""] });
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Los datos salen de la base de datos
  function cargar() {
    setCargando(true);
    setErrorCarga("");
    miPerfil()
      .then(setPerfil)
      .catch((e: unknown) => setErrorCarga(mensajeDeError(e)))
      .finally(() => setCargando(false));
  }
  useEffect(() => {
    cargar();
    listarCiudades()
      .then(setCiudades)
      .catch(() => {});
  }, []);

  function empezarAEditar() {
    if (!perfil) return;
    setForm({
      direccion: perfil.direccion,
      ciudadId: perfil.ciudadId,
      telefonos: perfil.telefonos.length > 0 ? perfil.telefonos : [""],
    });
    setError("");
    setEditando(true);
  }

  async function handleGuardar() {
    const direccion = form.direccion.trim();
    const telefonos = form.telefonos
      .map((t) => t.trim())
      .filter((t) => t !== "");
    if (direccion.length > 160) {
      setError("La dirección admite máximo 160 caracteres");
      return;
    }
    if (form.ciudadId === null) {
      setError("Selecciona tu ciudad");
      return;
    }
    if (telefonos.some((t) => t.length > 25)) {
      setError("Cada teléfono admite máximo 25 caracteres");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      const nuevo = await guardarPerfil({
        direccion,
        ciudadId: form.ciudadId,
        telefonos,
      });
      setPerfil(nuevo);
      onPerfilActualizado(aUsuarioActual(nuevo));
      setEditando(false);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }

  const nombre = perfil?.nombre ?? user?.nombre ?? "Usuario";
  const correo = perfil?.correo ?? user?.email ?? "—";

  // Lo propio de cada rol, con los valores reales de la base
  const extrasPorRol: string[][] = !perfil
    ? []
    : perfil.role === "client"
      ? [
          ["⭐ Puntos acumulados", String(perfil.puntos ?? 0)],
          ["📺 Prefiere ver publicidad", perfil.publicidad ? "Sí" : "No"],
        ]
      : perfil.role === "agent"
        ? [
            [
              "💼 Comisión",
              `${(perfil.comision ?? 0).toLocaleString("es-CO")}%`,
            ],
            ["🏆 Experiencia", `${perfil.experiencia ?? 0} años`],
          ]
        : [
            ["💰 Salario", fmtPrice(perfil.salario ?? 0)],
            ["🕐 Horario", perfil.horario || "—"],
          ];

  return (
    <>
      <PageHeader
        title="Mi Perfil"
        subtitle="Información personal y de cuenta"
      />
      <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="h-24 relative"
            style={{
              background: `linear-gradient(135deg, ${NAV}, ${PRIMARY})`,
            }}
          >
            <div className="absolute -bottom-8 left-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl border-4 border-white"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_L} 100%)`,
                }}
              >
                {nombre
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            </div>
          </div>
          <div className="pt-10 px-5 pb-8 sm:pt-12 sm:px-8">
            <h2
              className="text-xl font-bold text-gray-800"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {nombre}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{correo}</p>

            {cargando && (
              <p className="text-sm text-gray-400">Cargando tu perfil…</p>
            )}
            {errorCarga && (
              <p role="alert" className="text-sm text-red-500">
                {errorCarga}{" "}
                <button
                  className="underline font-semibold cursor-pointer"
                  onClick={cargar}
                >
                  Reintentar
                </button>
              </p>
            )}

            {perfil && editando && (
              <div className="space-y-4">
                <Input
                  label="Dirección"
                  value={form.direccion}
                  onChange={(v) => setForm((p) => ({ ...p, direccion: v }))}
                />
                <SelectorCiudad
                  ciudades={ciudades}
                  ciudadId={form.ciudadId}
                  onChange={(id) => setForm((p) => ({ ...p, ciudadId: id }))}
                />
                <div className="space-y-2">
                  {form.telefonos.map((t, i) => (
                    <div key={i} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Input
                          label={`Teléfono ${i + 1}`}
                          value={t}
                          onChange={(v) =>
                            setForm((p) => ({
                              ...p,
                              telefonos: p.telefonos.map((x, j) =>
                                j === i ? v : x,
                              ),
                            }))
                          }
                          placeholder="+57 300 0000000"
                        />
                      </div>
                      {form.telefonos.length > 1 && (
                        <button
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              telefonos: p.telefonos.filter((_, j) => j !== i),
                            }))
                          }
                          aria-label={`Quitar teléfono ${i + 1}`}
                          className="px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}
                  {form.telefonos.length < MAX_TELEFONOS && (
                    <button
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          telefonos: [...p.telefonos, ""],
                        }))
                      }
                      className="text-sm text-violet-600 hover:underline font-medium cursor-pointer"
                    >
                      ＋ Agregar otro teléfono
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  La identificación, el nombre y el correo no se pueden cambiar
                  desde aquí.
                </p>
              </div>
            )}

            {perfil && !editando && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["🪪 N.° Identificación", perfil.identificacion],
                  ["📧 Correo electrónico", perfil.correo],
                  ["🏠 Dirección", perfil.direccion || "—"],
                  [
                    "📍 Ciudad",
                    `${perfil.ciudad}, ${perfil.departamento} (${perfil.pais})`,
                  ],
                  [
                    perfil.telefonos.length > 1
                      ? "📞 Teléfonos"
                      : "📞 Teléfono",
                    perfil.telefonos.length > 0
                      ? perfil.telefonos.join(" · ")
                      : "—",
                  ],
                  ...extrasPorRol,
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">{l}</p>
                    <p className="text-sm font-semibold text-gray-800">{v}</p>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p role="alert" className="text-red-500 text-sm mt-4">
                {error}
              </p>
            )}
            {perfil && (
              <div className="mt-6 flex gap-3">
                {editando ? (
                  <>
                    <Btn size="sm" disabled={guardando} onClick={handleGuardar}>
                      {guardando ? "Guardando…" : "Guardar cambios"}
                    </Btn>
                    <Btn
                      size="sm"
                      variant="ghost"
                      disabled={guardando}
                      onClick={() => {
                        setEditando(false);
                        setError("");
                      }}
                    >
                      Cancelar
                    </Btn>
                  </>
                ) : (
                  <Btn size="sm" onClick={empezarAEditar}>
                    Editar perfil
                  </Btn>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {perfil && role === "client" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Resumen de actividad
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Reservas totales
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {perfil.reservasTotales ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Eventos asistidos
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {perfil.eventosAsistidos ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}
          {perfil && role === "agent" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Resumen de actividad
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Eventos creados</span>
                <span className="text-sm font-bold text-gray-800">
                  {perfil.eventosCreados ?? 0}
                </span>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Seguridad
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                🔑 Cambiar contraseña
              </button>
              <button className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                📱 Verificación en dos pasos
              </button>
              <button className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                🔔 Preferencias de notificación
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 text-xs text-gray-500 leading-relaxed">
            💡 Mantén tus datos actualizados para recibir confirmaciones de
            reserva y cambios de evento sin contratiempos.
          </div>
        </div>
      </div>
    </>
  );
}
