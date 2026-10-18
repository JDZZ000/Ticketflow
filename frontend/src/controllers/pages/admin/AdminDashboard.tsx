import { useEffect, useState } from "react";
import { PRIMARY, PRIMARY_L } from "../../../utils/theme";
import { fmtPrice, fmtDate, fmtM } from "../../../utils/format";
import { Badge } from "../../../views/components/Badge";
import { Btn } from "../../../views/components/Btn";
import { StatCard } from "../../../views/components/StatCard";
import { PageHeader } from "../../../views/layouts/PageHeader";
import { mensajeDeError } from "../../../models/api/cliente";
import { cargarReportes, type Reportes } from "../../../models/api/reportes";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
// Todo sale de los 9 reportes de la API (solo el administrador puede pedirlos).
const ANIO = 2026;
const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
// Paleta de las gráficas: morado de la marca más colores de apoyo
const CHART_COLORS = [
  "#6D28D9",
  "#EC4899",
  "#F59E0B",
  "#06B6D4",
  "#10B981",
  "#F43F5E",
];

// Cada nombre recibe un color la primera vez que aparece y lo conserva siempre.
// Los nombres nuevos toman un color que nadie ha usado: primero los de la paleta
// y, cuando se acaban, se generan colores nuevos con tonos bien separados.
function crearPaleta() {
  const asignados = new Map<string, string>();
  return (nombre: string): string => {
    const existente = asignados.get(nombre);
    if (existente) return existente;
    const n = asignados.size;
    const color =
      n < CHART_COLORS.length
        ? CHART_COLORS[n]
        : `hsl(${Math.round((n * 137.508) % 360)}, 65%, 50%)`;
    asignados.set(nombre, color);
    return color;
  };
}
const colorCiudad = crearPaleta();
const colorEvento = crearPaleta();

const acortar = (texto: string, max = 15) =>
  texto.length > max ? texto.slice(0, max) + "…" : texto;

function Tarjeta({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3
        className="text-lg font-extrabold text-gray-800 mb-1"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        {titulo}
      </h3>
      {subtitulo ? (
        <p className="text-xs text-gray-400 mb-4">{subtitulo}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </div>
  );
}

function Tabla({
  cabeceras,
  filas,
  derecha = [],
}: {
  cabeceras: string[];
  filas: React.ReactNode[][];
  derecha?: number[];
}) {
  if (filas.length === 0)
    return <p className="text-sm text-gray-400">Sin datos para mostrar.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 border-b border-gray-100">
            {cabeceras.map((h, i) => (
              <th
                key={h}
                className={`pb-2 pr-3 font-semibold ${derecha.includes(i) ? "text-right" : "text-left"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr
              key={i}
              className="border-b border-gray-50 hover:bg-violet-50/30"
            >
              {fila.map((celda, j) => (
                <td
                  key={j}
                  className={`py-2 pr-3 text-gray-700 ${derecha.includes(j) ? "text-right" : "text-left"}`}
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard() {
  const [tab, setTab] = useState<"comercial" | "cobertura" | "operacion">(
    "comercial",
  );
  const [datos, setDatos] = useState<Reportes | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  function cargar() {
    setCargando(true);
    setError("");
    cargarReportes(ANIO)
      .then(setDatos)
      .catch((e: unknown) => setError(mensajeDeError(e)))
      .finally(() => setCargando(false));
  }
  useEffect(() => {
    cargar();
  }, []);

  const encabezado = (
    <PageHeader
      title="Panel Administrativo"
      subtitle="Estadísticas y reportes de la plataforma"
      actions={
        <Btn variant="outline" size="sm" disabled={cargando} onClick={cargar}>
          {cargando ? "Actualizando…" : "↻ Actualizar"}
        </Btn>
      }
    />
  );

  if (!datos) {
    return (
      <>
        {encabezado}
        {cargando && (
          <p className="text-sm text-gray-400">Cargando reportes…</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}{" "}
            <button
              className="underline font-semibold cursor-pointer"
              onClick={cargar}
            >
              Reintentar
            </button>
          </p>
        )}
      </>
    );
  }

  const {
    resumen,
    ingresosPorMes,
    reservasPorEvento,
    eventosPorAgente,
    promedioAgente,
    promedioCliente,
    cobertura,
    historial,
    cancelaciones,
  } = datos;

  // Datos con la forma que piden las gráficas
  const ingresosMensuales = ingresosPorMes.map((m) => ({
    mes: MESES[m.mes - 1],
    ingresos: m.ingresos,
  }));
  const reservasPorMes = ingresosPorMes.map((m) => ({
    mes: MESES[m.mes - 1],
    reservas: m.reservas,
  }));
  const reservasPorEventoTotal = reservasPorEvento.map((e) => ({
    evento: acortar(e.evento),
    reservas: e.total,
  }));
  const eventosPorCiudad = cobertura.ciudades.map((c) => ({
    name: c.nombre,
    value: c.eventos,
  }));
  const totalEventos = resumen.eventos || 1;

  return (
    <>
      {encabezado}
      {error && (
        <p role="alert" className="text-sm text-red-500 mb-4">
          No se pudo actualizar: {error}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
        <StatCard
          label="Clientes registrados"
          value={resumen.clientes}
          icon="👤"
          color="violet"
        />
        <StatCard
          label="Agentes registrados"
          value={resumen.agentes}
          icon="🎭"
          color="blue"
        />
        <StatCard
          label="Administradores"
          value={resumen.administradores}
          icon="🛡️"
          color="rose"
        />
        <StatCard
          label="Reservas totales"
          value={resumen.reservas}
          icon="🎫"
          color="emerald"
        />
        <StatCard
          label="Eventos registrados"
          value={resumen.eventos}
          icon="📅"
          color="amber"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ["comercial", "📊 Reportes Comerciales"],
            ["cobertura", "🗺️ Cobertura Geográfica"],
            ["operacion", "📋 Reservas y Operación"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${tab === k ? "text-white shadow-md" : "text-gray-600 bg-white border border-gray-200 hover:border-violet-300"}`}
            style={
              tab === k
                ? {
                    background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
                  }
                : {}
            }
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "comercial" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Tarjeta
              titulo={`Ingresos totales por mes — ${ANIO}`}
              subtitulo="Suma de reservas confirmadas"
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ingresosMensuales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtM} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) =>
                      Number(v) === 0 ? "Sin ingresos" : fmtPrice(Number(v))
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ fill: "#10B981", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Tarjeta>
            <Tarjeta
              titulo="Reservas por evento"
              subtitulo={`Número total de reservas por espectáculo en ${ANIO}`}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reservasPorEventoTotal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="evento" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="reservas" radius={[4, 4, 0, 0]}>
                    {reservasPorEventoTotal.map((d) => (
                      <Cell key={d.evento} fill={colorEvento(d.evento)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Tarjeta>
          </div>

          <Tarjeta
            titulo={`Reservas por evento y por mes — ${ANIO}`}
            subtitulo="Cada fila es un evento; cada columna, el mes en que se hizo la reserva"
          >
            <Tabla
              cabeceras={["Evento", ...MESES, "Total"]}
              derecha={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]}
              filas={reservasPorEvento.map((e) => [
                <span key="n" className="font-medium text-gray-800">
                  {e.evento}
                </span>,
                ...e.meses.map((n) => (n === 0 ? "·" : n)),
                <span key="t" className="font-bold text-violet-700">
                  {e.total}
                </span>,
              ])}
            />
          </Tarjeta>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Tarjeta
              titulo={`Reservas totales por mes — ${ANIO}`}
              subtitulo="Volumen mensual de reservas en la plataforma"
            >
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reservasPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="reservas"
                    fill="#EC4899"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Tarjeta>
            <Tarjeta
              titulo="Eventos por agente y por ciudad"
              subtitulo="Eventos creados por cada agente en cada ciudad"
            >
              <Tabla
                cabeceras={["Agente", "Ciudad", "Eventos"]}
                derecha={[2]}
                filas={eventosPorAgente.porAgenteYCiudad.map((a) => [
                  <span key="a" className="font-medium text-gray-800">
                    {a.agente}
                  </span>,
                  a.ciudad,
                  <span key="e" className="font-bold text-violet-600">
                    {a.eventos}
                  </span>,
                ])}
              />
              <p className="text-xs text-gray-500 mt-3">
                Total por agente:{" "}
                {eventosPorAgente.porAgente
                  .map((a) => `${a.agente} (${a.eventos})`)
                  .join(" · ") || "—"}
              </p>
            </Tarjeta>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Tarjeta
              titulo="Promedio de ingresos por agente"
              subtitulo="Solo cuentan las reservas confirmadas de sus eventos"
            >
              <Tabla
                cabeceras={[
                  "Agente",
                  "Eventos",
                  "Confirmadas",
                  "Ingresos",
                  "Por reserva",
                  "Por evento",
                ]}
                derecha={[1, 2, 3, 4, 5]}
                filas={promedioAgente.map((a) => [
                  <span key="a" className="font-medium text-gray-800">
                    {a.agente}
                  </span>,
                  a.eventos,
                  a.reservasConfirmadas,
                  fmtPrice(a.ingresosTotales),
                  fmtPrice(a.promedioPorReserva),
                  fmtPrice(a.promedioPorEvento),
                ])}
              />
            </Tarjeta>
            <Tarjeta
              titulo="Promedio de ingresos por cliente"
              subtitulo="Solo cuentan sus reservas confirmadas"
            >
              <Tabla
                cabeceras={[
                  "Cliente",
                  "Confirmadas",
                  "Ingresos",
                  "Por reserva",
                ]}
                derecha={[1, 2, 3]}
                filas={promedioCliente.map((c) => [
                  <span key="c" className="font-medium text-gray-800">
                    {c.cliente}
                  </span>,
                  c.reservasConfirmadas,
                  fmtPrice(c.ingresosTotales),
                  fmtPrice(c.promedioPorReserva),
                ])}
              />
            </Tarjeta>
          </div>
        </div>
      )}

      {tab === "cobertura" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Tarjeta titulo="Eventos por ciudad">
              {eventosPorCiudad.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos para mostrar.</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={eventosPorCiudad}
                      cx="50%"
                      cy="42%"
                      outerRadius={95}
                      dataKey="value"
                    >
                      {eventosPorCiudad.map((c) => (
                        <Cell key={c.name} fill={colorCiudad(c.name)} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ paddingTop: 16 }}
                      formatter={(value) => (
                        <span className="text-sm text-gray-700">
                          {value}:{" "}
                          {
                            eventosPorCiudad.find((c) => c.name === value)
                              ?.value
                          }
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Tarjeta>
            <Tarjeta titulo="Cobertura geográfica">
              <div className="space-y-3">
                {[
                  { nivel: "País", items: cobertura.paises, color: "#6D28D9" },
                  {
                    nivel: "Departamento",
                    items: cobertura.departamentos,
                    color: "#EC4899",
                  },
                  {
                    nivel: "Ciudad",
                    items: cobertura.ciudades,
                    color: "#06B6D4",
                  },
                ].map((g) => (
                  <div key={g.nivel}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      {g.nivel}
                    </p>
                    {g.items.map((item) => (
                      <div
                        key={item.nombre}
                        className="flex items-center gap-3 py-1.5"
                      >
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(item.eventos / totalEventos) * 100}%`,
                              background: g.color,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-700 font-medium w-32">
                          {item.nombre}
                        </span>
                        <span
                          className="text-sm font-bold w-8 text-right"
                          style={{ color: g.color }}
                        >
                          {item.eventos}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Tarjeta>
          </div>
          <Tarjeta
            titulo="Listado de eventos por país, departamento y ciudad"
            subtitulo="Dónde se realiza cada evento"
          >
            <Tabla
              cabeceras={[
                "Código",
                "Evento",
                "País",
                "Departamento",
                "Ciudad",
                "Estado",
              ]}
              filas={cobertura.listado.map((e) => [
                <span key="c" className="font-mono text-xs text-gray-500">
                  {e.codigo}
                </span>,
                <span key="n" className="font-medium text-gray-800">
                  {e.nombre}
                </span>,
                e.pais,
                e.departamento,
                e.ciudad,
                <Badge
                  key="s"
                  status={e.estado as Parameters<typeof Badge>[0]["status"]}
                />,
              ])}
            />
          </Tarjeta>
        </div>
      )}

      {tab === "operacion" && (
        <div className="space-y-6">
          <Tarjeta
            titulo="Historial de reservas por cliente"
            subtitulo="Ordenado por cliente, de la más reciente a la más antigua"
          >
            <Tabla
              cabeceras={[
                "ID",
                "Cliente",
                "Evento",
                "Fecha",
                "Entradas",
                "Total",
                "Estado",
                "Observaciones",
              ]}
              derecha={[4, 5]}
              filas={historial.map((r) => [
                <span key="i" className="font-mono text-xs text-gray-400">
                  #{r.id}
                </span>,
                <span key="c" className="font-medium text-gray-800">
                  {r.cliente}
                </span>,
                r.evento,
                fmtDate(r.fechaReserva),
                <span key="e" className="font-bold text-gray-800">
                  {r.entradas}
                </span>,
                <span key="t" className="font-semibold text-violet-700">
                  {fmtPrice(r.total)}
                </span>,
                <Badge key="s" status={r.estado} />,
                <span key="o" className="text-xs text-gray-400">
                  {r.observaciones || "—"}
                </span>,
              ])}
            />
          </Tarjeta>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Tarjeta titulo="Reservas canceladas y su causa">
              {cancelaciones.reservas.length === 0 && (
                <p className="text-sm text-gray-400">
                  No hay reservas canceladas.
                </p>
              )}
              {cancelaciones.reservas.map((r) => (
                <div
                  key={r.id}
                  className="border border-red-100 bg-red-50 rounded-xl p-4 mb-3"
                >
                  <p className="font-semibold text-gray-800 text-sm">
                    {r.evento}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    #{r.id} · Cliente: {r.cliente} · {r.entradas} entrada
                    {r.entradas > 1 ? "s" : ""} · {fmtPrice(r.total)}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Causa: {r.causa || "No especificada"}
                  </p>
                </div>
              ))}
            </Tarjeta>
            <Tarjeta titulo="Eventos cancelados y su causa">
              {cancelaciones.eventos.length === 0 && (
                <p className="text-sm text-gray-400">
                  No hay eventos cancelados.
                </p>
              )}
              {cancelaciones.eventos.map((ev) => (
                <div
                  key={ev.id}
                  className="border border-red-100 bg-red-50 rounded-xl p-4 mb-3"
                >
                  <p className="font-semibold text-gray-800 text-sm">
                    {ev.nombre}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ev.codigo} · {ev.ciudad} · {fmtDate(ev.fecha)} · Agente:{" "}
                    {ev.agente}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Causa: {ev.causa || "No especificada"}
                  </p>
                </div>
              ))}
            </Tarjeta>
          </div>
        </div>
      )}
    </>
  );
}
