import type { Role } from "../../models/types";
import { PRIMARY, PRIMARY_L, NAV } from "../../utils/theme";
import { RESERVAS } from "../../models/data/mockData";
import { Btn } from "../../views/components/Btn";
import { PageHeader } from "../../views/layouts/PageHeader";

// ─── PROFILE PAGE ────────────────────────────────────────────────────────────
export function ProfilePage({ role, user }: { role: Role; user: { nombre: string; email: string; id: string; direccion: string; ciudad: string; telefono: string } | null }) {
  const extrasPorRol =
  role === "client" ? [["⭐ Puntos acumulados", "1,240"], ["📺 Prefiere ver publicidad", "Sí"]]
  : role === "agent" ? [["💼 Comisión", "8%"], ["🏆 Experiencia", "5 años"]]
  : [["💰 Salario", "$4,500,000"], ["🕐 Horario", "Lun–Vie 8am–5pm"]];

const data = {
  nombre: user?.nombre ?? "Usuario",
  id: user?.id ?? "—",
  email: user?.email ?? "—",
  direccion: user?.direccion ?? "—",
  ciudad: user?.ciudad ?? "—",
  telefono: user?.telefono ?? "—",
  extra: extrasPorRol,
};

  return (
    <>
      <PageHeader title="Mi Perfil" subtitle="Información personal y de cuenta" />
      <div className="max-w-5xl grid grid-cols-3 gap-6 items-start">
        <div className="col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${NAV}, ${PRIMARY})` }}>
            <div className="absolute -bottom-8 left-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl border-4 border-white"
                style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_L} 100%)` }}>
                {data.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="pt-12 px-8 pb-8">
            <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "Outfit, sans-serif" }}>{data.nombre}</h2>
            <p className="text-sm text-gray-500 mb-6">{data.email}</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["🪪 N.° Identificación", data.id],
                ["📧 Correo electrónico", data.email],
                ["🏠 Dirección", data.direccion],
                ["📍 Ciudad", data.ciudad],
                ["📞 Teléfono", data.telefono],
                ...data.extra,
              ].map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">{l}</p>
                  <p className="text-sm font-semibold text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-6"><Btn size="sm">Editar perfil</Btn></div>
          </div>
        </div>

        <div className="space-y-5">
          {role === "client" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Resumen de actividad</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Reservas totales</span>
                  <span className="text-sm font-bold text-gray-800">{RESERVAS.filter(r => r.cliente === "María González").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Eventos asistidos</span>
                  <span className="text-sm font-bold text-gray-800">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Miembro desde</span>
                  <span className="text-sm font-bold text-gray-800">2024</span>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Seguridad</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">🔑 Cambiar contraseña</button>
              <button className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">📱 Verificación en dos pasos</button>
              <button className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">🔔 Preferencias de notificación</button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 text-xs text-gray-500 leading-relaxed">
            💡 Mantén tus datos actualizados para recibir confirmaciones de reserva y cambios de evento sin contratiempos.
          </div>
        </div>
      </div>
    </>
  );
}

