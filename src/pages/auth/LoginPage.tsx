import { useState } from "react";
import type { Screen, Role } from "../../types";
import { PRIMARY, PRIMARY_L, ACCENT, ACCENT_BLUE, NAV } from "../../utils/theme";
import { fmtPrice, fmtDate, unsplash } from "../../utils/format";
import { EVENTOS } from "../../data/mockData";
import { Logo } from "../../components/Logo";
import { Btn } from "../../components/Btn";
import { Input } from "../../components/Input";

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export function LoginPage({ onNav, usuarios, loginExitoso }: { onNav: (s: Screen, role?: Role) => void; usuarios: { nombre: string; email: string; pass: string; role: Role; id: string; direccion: string; ciudad: string; telefono: string }[]; loginExitoso: (u: { nombre: string; email: string; role: Role; id: string; direccion: string; ciudad: string; telefono: string }) => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (email === "" || pass === "") {
      setError("Por favor, completa todos los campos");
      return;
    }
    setError("");
    const encontrado = usuarios.find(u => u.email === email && u.pass === pass);
    if (!encontrado) {
      setError("Correo o contraseña incorrectos");
      return;
    }
    loginExitoso(encontrado);
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Outfit, sans-serif" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[55%] flex-col relative overflow-hidden" style={{ background: NAV }}>
        {/* background image */}
        <img src={unsplash("photo-1540039155733-5bb30b53aa14", 1000, 1200)} alt="evento" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        {/* gradient overlay */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${NAV}ee 30%, ${PRIMARY}88 100%)` }} />

        {/* top logo */}
        <div className="relative z-10 px-12 pt-10">
          <Logo size="lg" on="dark" />
        </div>

        {/* main copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-8">
          <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: ACCENT_BLUE }}>🎟️ Tu plataforma de eventos</p>
          <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Cada gran<br />
            <span style={{ background: `linear-gradient(135deg, ${ACCENT_BLUE}, ${ACCENT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              espectáculo
            </span><br />
            empieza aquí.
          </h2>
          <p className="text-gray-300 text-base leading-relaxed max-w-xs mb-10">
            Gestiona reservas, descubre eventos y vive experiencias únicas desde una sola plataforma.
          </p>

          {/* event preview cards */}
          <div className="space-y-3 mb-10">
            {EVENTOS.filter(e => e.estado === "En Boletería").slice(0, 2).map(ev => (
              <div key={ev.id} className="flex items-center gap-4 rounded-2xl px-4 py-3 backdrop-blur-sm"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <img src={unsplash(ev.imagen, 80, 56)} alt={ev.nombre} className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{ev.nombre}</p>
                  <p className="text-gray-400 text-xs">{ev.ciudad} · {fmtDate(ev.fecha)}</p>
                </div>
                <span className="text-sm font-bold flex-shrink-0" style={{ color: ACCENT_BLUE }}>{fmtPrice(ev.precio)}</span>
              </div>
            ))}
          </div>

          {/* stats row */}
          <div className="flex items-center gap-8">
            {[["12K+", "Eventos"], ["48K+", "Clientes"], ["98%", "Satisfacción"]].map(([v, l]) => (
              <div key={l}>
                <p className="text-2xl font-extrabold text-white">{v}</p>
                <p className="text-xs text-gray-400">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* bottom pill */}
        <div className="relative z-10 px-12 pb-10">
          <div className="flex gap-3 text-xs text-gray-400">
            {["✓ Gestión en tiempo real", "✓ Tres perfiles de usuario", "✓ Reportes avanzados"].map(t => (
              <span key={t} className="px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ background: "#F5F6FA" }}>
        {/* top bar for mobile */}
        <div className="lg:hidden flex items-center px-8 pt-8">
          <Logo size="md" on="light" />
        </div>

        {/* form area */}
        <div className="flex-1 flex items-center justify-center px-10 py-8">
          <div className="w-full max-w-md">
            {/* heading */}
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                Bienvenido<br />
                <span style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  de vuelta
                </span>
              </h1>
              <p className="text-gray-500 text-sm">Ingresa tus credenciales para acceder a tu cuenta</p>
            </div>

            {/* form card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-5">
              <div className="space-y-5 mb-5">
                <Input label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" />
                <Input label="Contraseña" type="password" value={pass} onChange={setPass} placeholder="••••••••" />
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
              <div className="flex justify-end mb-6">
                <button className="text-sm text-violet-600 hover:underline font-medium">¿Olvidaste tu contraseña?</button>
              </div>
              <Btn full size="lg" onClick={handleLogin}>Iniciar sesión →</Btn>
              <div className="mt-5 pt-5 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  ¿No tienes cuenta?{" "}
                  <button className="text-violet-600 font-bold hover:underline" onClick={() => onNav("register")}>
                    Crear cuenta gratis
                  </button>
                </p>
              </div>
            </div>

            {/* demo box */}
            <div className="rounded-2xl p-4 border border-gray-100 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">⚡</span>
                <p className="font-bold text-gray-800 text-sm">Acceso demo instantáneo</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: "👤", label: "Cliente", mail: "cliente@demo.com", color: PRIMARY },
                  { icon: "🎭", label: "Agente", mail: "agente@demo.com", color: ACCENT_BLUE },
                  { icon: "🛡️", label: "Admin", mail: "admin@demo.com", color: ACCENT },
                ].map(o => (
                  <button key={o.label} onClick={() => { setEmail(o.mail); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition hover:-translate-y-0.5 border"
                    style={{ background: o.color + "0d", borderColor: o.color + "33" }}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ background: o.color + "22" }}>{o.icon}</span>
                    <span className="font-semibold text-gray-700 text-xs">{o.label}</span>
                    <span className="text-gray-400 text-[10px] truncate w-full text-center">{o.mail}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* footer strip */}
        <div className="px-10 py-4 text-xs text-gray-400 text-center border-t border-gray-200">
          © 2026 TicketFlow · Proyecto Integrador Universitario
        </div>
      </div>
    </div>
  );
}

