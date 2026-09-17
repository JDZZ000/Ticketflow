import type { Screen } from "../../types";
import { fmtPrice, fmtDate, unsplash } from "../../utils/format";
import { EVENTOS } from "../../data/mockData";
import { Btn } from "../../components/Btn";
import { Badge } from "../../components/Badge";
import { PageHeader } from "../../layouts/PageHeader";

// ─── AGENT MY EVENTS ─────────────────────────────────────────────────────────
export function AgentMyEvents({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <>
      <PageHeader title="Mis Eventos" subtitle="Gestiona todos tus eventos registrados"
        actions={<Btn onClick={() => onNav("agent-register-event")}>➕ Nuevo evento</Btn>} />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#F5F6FA" }}>
              {["Código", "Evento", "Ciudad", "Fecha", "Precio", "Capacidad", "Estado", "Acciones"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EVENTOS.map((ev, i) => (
              <tr key={ev.id} className={`border-t border-gray-50 hover:bg-violet-50/30 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{ev.codigo}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <img src={unsplash(ev.imagen, 60, 40)} alt={ev.nombre} className="w-10 h-7 rounded-lg object-cover flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{ev.nombre}</p>
                      <p className="text-xs text-gray-400">{ev.teatro}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{ev.ciudad}</td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{fmtDate(ev.fecha)}</td>
                <td className="px-4 py-3.5 text-sm font-semibold text-violet-700">{fmtPrice(ev.precio)}</td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{ev.capacidad.toLocaleString()}</td>
                <td className="px-4 py-3.5"><Badge status={ev.estado} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-600 transition text-sm cursor-pointer" title="Ver">👁️</button>
                    <button className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition text-sm cursor-pointer" title="Editar">✏️</button>
                    <button className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition text-sm cursor-pointer" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

