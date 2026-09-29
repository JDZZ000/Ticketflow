import { useState } from "react";
import { PRIMARY, PRIMARY_L } from "../../../utils/theme";
import { fmtPrice, fmtDate, fmtM } from "../../../utils/format";
import { EVENTOS, RESERVAS } from "../../../models/data/mockData";
import { Badge } from "../../../views/components/Badge";
import { StatCard } from "../../../views/components/StatCard";
import { PageHeader } from "../../../views/layouts/PageHeader";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
const ingresosMensuales = [
  { mes: "Ene", ingresos: 3200000 },
  { mes: "Feb", ingresos: 4100000 },
  { mes: "Mar", ingresos: 5800000 },
  { mes: "Abr", ingresos: 4500000 },
  { mes: "May", ingresos: 6200000 },
  { mes: "Jun", ingresos: 7100000 },
  { mes: "Jul", ingresos: 5400000 },
  { mes: "Ago", ingresos: 8300000 },
  { mes: "Sep", ingresos: 6900000 },
  { mes: "Oct", ingresos: 9200000 },
  { mes: "Nov", ingresos: 7800000 },
  { mes: "Dic", ingresos: 11000000 },
];

const reservasPorEvento = [
  { evento: "Ballet", reservas: 142 },
  { evento: "Rock Sinfónico", reservas: 289 },
  { evento: "Feria Libro", reservas: 87 },
  { evento: "Jazz Parque", reservas: 0 },
  { evento: "Circo Lumière", reservas: 196 },
  { evento: "Stand Up", reservas: 0 },
];

const eventosPorCiudad = [
  { name: "Bogotá", value: 4 },
  { name: "Medellín", value: 1 },
  { name: "Cali", value: 1 },
];

const CHART_COLORS = ["#6D28D9", "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD"];

export function AdminDashboard() {
  const [tab, setTab] = useState<"comercial" | "cobertura" | "operacion">("comercial");

  const reservasPorMes = [
    { mes: "Ene", reservas: 23 }, { mes: "Feb", reservas: 35 }, { mes: "Mar", reservas: 48 },
    { mes: "Abr", reservas: 29 }, { mes: "May", reservas: 52 }, { mes: "Jun", reservas: 61 },
    { mes: "Jul", reservas: 44 }, { mes: "Ago", reservas: 67 }, { mes: "Sep", reservas: 58 },
    { mes: "Oct", reservas: 73 }, { mes: "Nov", reservas: 81 }, { mes: "Dic", reservas: 95 },
  ];

  const eventosAgente = [
    { agente: "Carlos M.", eventos: 4, ciudad: "Bogotá" },
    { agente: "Laura P.", eventos: 2, ciudad: "Medellín" },
    { agente: "Juan S.", eventos: 1, ciudad: "Cali" },
    { agente: "Ana R.", eventos: 3, ciudad: "Bogotá" },
  ];

  return (
    <>
      <PageHeader title="Panel Administrativo" subtitle="Estadísticas y reportes de la plataforma" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
        <StatCard label="Clientes registrados" value="1,284" icon="👤" color="violet" />
        <StatCard label="Agentes registrados" value="47" icon="🎭" color="blue" />
        <StatCard label="Administradores" value="5" icon="🛡️" color="rose" />
        <StatCard label="Reservas totales" value="3,621" icon="🎫" color="emerald" />
        <StatCard label="Eventos registrados" value="128" icon="📅" color="amber" />
      </div>

      <div className="flex gap-2 mb-6">
        {([["comercial", "📊 Reportes Comerciales"], ["cobertura", "🗺️ Cobertura Geográfica"], ["operacion", "📋 Reservas y Operación"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${tab === k ? "text-white shadow-md" : "text-gray-600 bg-white border border-gray-200 hover:border-violet-300"}`}
            style={tab === k ? { background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})` } : {}}>
            {l}
          </button>
        ))}
      </div>

      {tab === "comercial" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-lg font-extrabold text-gray-800 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Ingresos totales por mes — 2026</h3>
              <p className="text-xs text-gray-400 mb-4">Suma de reservas confirmadas</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ingresosMensuales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtM} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmtPrice(Number(v))} />
                  <Line type="monotone" dataKey="ingresos" stroke={PRIMARY} strokeWidth={2.5} dot={{ fill: PRIMARY, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-lg font-extrabold text-gray-800 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Reservas por evento</h3>
              <p className="text-xs text-gray-400 mb-4">Número total de reservas por espectáculo</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reservasPorEvento}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="evento" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="reservas" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-lg font-extrabold text-gray-800 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Reservas totales por mes — 2026</h3>
              <p className="text-xs text-gray-400 mb-4">Volumen mensual de reservas en la plataforma</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reservasPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="reservas" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xl font-extrabold text-gray-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Eventos por agente</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 text-left font-semibold">Agente</th>
                    <th className="pb-2 text-left font-semibold">Ciudad</th>
                    <th className="pb-2 text-right font-semibold">Eventos</th>
                    <th className="pb-2 text-right font-semibold">Ing. prom.</th>
                  </tr>
                </thead>
                <tbody>
                  {eventosAgente.map(a => (
                    <tr key={a.agente} className="border-b border-gray-50">
                      <td className="py-2 font-medium text-gray-800">{a.agente}</td>
                      <td className="py-2 text-gray-500">{a.ciudad}</td>
                      <td className="py-2 text-right font-bold text-violet-600">{a.eventos}</td>
                      <td className="py-2 text-right text-gray-600">{fmtPrice(Math.round(Math.random() * 3000000 + 1500000))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "cobertura" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xl font-extrabold text-gray-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Eventos por ciudad</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={eventosPorCiudad} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {eventosPorCiudad.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xl font-extrabold text-gray-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Cobertura geográfica</h3>
              <div className="space-y-3">
                {[
                  { nivel: "País", items: [{ nombre: "Colombia", eventos: 6 }] },
                  { nivel: "Departamento", items: [{ nombre: "Cundinamarca", eventos: 4 }, { nombre: "Antioquia", eventos: 1 }, { nombre: "Valle del Cauca", eventos: 1 }] },
                  { nivel: "Ciudad", items: [{ nombre: "Bogotá", eventos: 4 }, { nombre: "Medellín", eventos: 1 }, { nombre: "Cali", eventos: 1 }] },
                ].map(g => (
                  <div key={g.nivel}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{g.nivel}</p>
                    {g.items.map(item => (
                      <div key={item.nombre} className="flex items-center gap-3 py-1.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(item.eventos / 6) * 100}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_L})` }} />
                        </div>
                        <span className="text-sm text-gray-700 font-medium w-32">{item.nombre}</span>
                        <span className="text-sm font-bold text-violet-700 w-8 text-right">{item.eventos}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "operacion" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xl font-extrabold text-gray-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Historial de reservas por cliente</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  {["ID", "Cliente", "Evento", "Fecha", "Entradas", "Total", "Estado", "Observaciones"].map(h => (
                    <th key={h} className="pb-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESERVAS.map(r => {
                  const ev = EVENTOS.find(e => e.id === r.eventoId)!;
                  return (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-violet-50/30">
                      <td className="py-3 font-mono text-xs text-gray-400">#{r.id}</td>
                      <td className="py-3 font-medium text-gray-800">{r.cliente}</td>
                      <td className="py-3 text-gray-600 max-w-36 truncate">{ev.nombre}</td>
                      <td className="py-3 text-gray-500">{fmtDate(r.fechaReserva)}</td>
                      <td className="py-3 text-center font-bold text-gray-800">{r.entradas}</td>
                      <td className="py-3 font-semibold text-violet-700">{fmtPrice(r.total)}</td>
                      <td className="py-3"><Badge status={r.estado} /></td>
                      <td className="py-3 text-xs text-gray-400">{r.observaciones || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xl font-extrabold text-gray-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Reservas canceladas</h3>
              {RESERVAS.filter(r => r.estado === "Cancelada").map(r => {
                const ev = EVENTOS.find(e => e.id === r.eventoId)!;
                return (
                  <div key={r.id} className="border border-red-100 bg-red-50 rounded-xl p-4 mb-3">
                    <p className="font-semibold text-gray-800 text-sm">{ev.nombre}</p>
                    <p className="text-xs text-gray-500 mt-1">Cliente: {r.cliente}</p>
                    <p className="text-xs text-red-600 mt-1">Motivo: {r.observaciones || "No especificado"}</p>
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xl font-extrabold text-gray-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Eventos cancelados</h3>
              {EVENTOS.filter(e => e.estado === "Cancelado").map(ev => (
                <div key={ev.id} className="border border-red-100 bg-red-50 rounded-xl p-4 mb-3">
                  <p className="font-semibold text-gray-800 text-sm">{ev.nombre}</p>
                  <p className="text-xs text-gray-500 mt-1">{ev.ciudad} · {fmtDate(ev.fecha)}</p>
                  <p className="text-xs text-red-600 mt-1">Motivo: {ev.observaciones || "No especificado"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

