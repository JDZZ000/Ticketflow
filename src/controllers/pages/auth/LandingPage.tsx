import { useState } from "react";
import type { Screen } from "../../../models/types";
import { PRIMARY, PRIMARY_L, NAV } from "../../../utils/theme";
import { unsplash } from "../../../utils/format";
import { EVENTOS } from "../../../models/data/mockData";
import { Logo } from "../../../views/components/Logo";
import { SocialIcons } from "../../../views/components/SocialIcons";
import { Btn } from "../../../views/components/Btn";
import { EventCard } from "../../../views/components/EventCard";

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
export function LandingPage({ onNav }: { onNav: (s: Screen) => void }) {
  const featured = EVENTOS.filter(e => e.estado === "En Boletería").slice(0, 3);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: NAV }}>
        <div className="flex items-center justify-between px-5 sm:px-8 py-4">
          <Logo size="md" on="dark" />
          <div className="hidden md:flex items-center gap-4">
            <a href="#eventos" className="text-gray-300 hover:text-white text-sm font-medium transition">Eventos</a>
            <a href="#nosotros" className="text-gray-300 hover:text-white text-sm font-medium transition">Nosotros</a>
            <Btn size="sm" variant="outline" onClick={() => onNav("login")}>Iniciar sesión</Btn>
            <Btn size="sm" onClick={() => onNav("register")}>Registrarse</Btn>
          </div>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden text-white text-2xl leading-none cursor-pointer"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden flex flex-col gap-3 px-5 pb-5">
            <a href="#eventos" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white text-sm font-medium transition py-1">Eventos</a>
            <a href="#nosotros" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white text-sm font-medium transition py-1">Nosotros</a>
            <Btn size="sm" variant="outline" onClick={() => onNav("login")}>Iniciar sesión</Btn>
            <Btn size="sm" onClick={() => onNav("register")}>Registrarse</Btn>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-24 lg:pt-20" style={{ background: NAV }}>
        <div className="absolute inset-0 overflow-hidden">
          <img src={unsplash("photo-1540039155733-5bb30b53aa14", 1600, 900)} alt="evento" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${NAV} 40%, ${PRIMARY}44 100%)` }} />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-5 py-14 sm:px-8 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: PRIMARY + "33", color: "#c4b5fd", border: `1px solid ${PRIMARY}55` }}>
              🎟️ La plataforma de eventos más completa de Colombia
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Vive cada <span style={{ background: `linear-gradient(135deg, #c4b5fd, #f472b6)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>momento</span> sin perderte nada
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Descubre, reserva y disfruta los mejores eventos de teatro, música, circo y espectáculos. Gestión de entradas simple, rápida y segura.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Btn size="lg" onClick={() => onNav("login")}>Explorar eventos →</Btn>
              <button className="text-gray-300 hover:text-white font-medium text-sm transition" onClick={() => onNav("register")}>
                Crear cuenta gratis
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 mt-10">
              {[["12K+", "Eventos realizados"], ["48K+", "Clientes satisfechos"], ["98%", "Satisfacción"]].map(([v, l]) => (
                <div key={l}>
                  <p className="text-2xl font-bold text-white">{v}</p>
                  <p className="text-xs text-gray-400">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {EVENTOS.slice(0, 4).map((ev, i) => (
              <div key={ev.id} className={`rounded-2xl overflow-hidden ${i === 0 ? "col-span-2 h-48" : "h-32"}`}>
                <img src={unsplash(ev.imagen, 400, 300)} alt={ev.nombre} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nosotros */}
      <section className="py-24 bg-white" id="nosotros">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-violet-600 text-sm font-bold uppercase tracking-widest mb-3">Sobre nosotros</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>Quiénes somos</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            TicketFlow nace como un proyecto universitario con el objetivo de simplificar la manera en que las personas descubren, reservan y disfrutan eventos en Colombia. Conectamos a organizadores y asistentes en una sola plataforma, simple, rápida y segura.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-14">
            {[
              { icon: "🎯", t: "Nuestra misión", d: "Facilitar el acceso a experiencias culturales y de entretenimiento para todos." },
              { icon: "🤝", t: "Nuestro compromiso", d: "Seguridad y transparencia en cada reserva, de principio a fin." },
              { icon: "🚀", t: "Nuestra visión", d: "Ser la plataforma de referencia para la gestión de eventos en la región." },
            ].map(s => (
              <div key={s.t} className="flex flex-col items-center p-6 rounded-2xl border border-gray-100">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `linear-gradient(135deg, ${PRIMARY}22, ${PRIMARY_L}33)` }}>
                  {s.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{s.t}</h3>
                <p className="text-sm text-gray-500 text-center">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-24" style={{ background: "#F5F6FA" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-violet-600 text-sm font-bold uppercase tracking-widest mb-3">Simple y rápido</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>¿Cómo funciona?</h2>
          <p className="text-gray-500 text-lg mb-14 max-w-md mx-auto">En tres pasos simples puedes reservar tu entrada favorita</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "01", icon: "🔍", t: "Explora", d: "Navega el catálogo de eventos disponibles, filtra por ciudad, fecha o categoría." },
              { n: "02", icon: "🎫", t: "Reserva", d: "Selecciona las entradas que necesitas y confirma tu reserva en segundos." },
              { n: "03", icon: "🎉", t: "Disfruta", d: "Recibe la confirmación y disfruta del evento. ¡Así de fácil!" },
            ].map(s => (
              <div key={s.n} className="flex flex-col items-center p-6 rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `linear-gradient(135deg, ${PRIMARY}22, ${PRIMARY_L}33)` }}>
                  {s.icon}
                </div>
                <span className="text-xs font-mono text-violet-400 font-bold mb-1">{s.n}</span>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{s.t}</h3>
                <p className="text-sm text-gray-500 text-center">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-20 bg-white" id="eventos">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-violet-600 text-sm font-bold uppercase tracking-widest mb-2">En cartelera ahora</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>Eventos destacados</h2>
              <p className="text-gray-500 mt-2">Disponibles en boletería ahora mismo</p>
            </div>
            <button className="text-violet-600 font-semibold text-sm hover:underline" onClick={() => onNav("login")}>
              Ver todos →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map(ev => (
              <EventCard key={ev.id} ev={ev} onView={() => onNav("login")} />
            ))}
          </div>
        </div>
      </section>
      

      {/* Footer */}
      <footer style={{ background: NAV }} className="pt-14 pb-8 text-gray-400 text-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 pb-10 border-b border-white/10">
            <div className="max-w-xs">
              <Logo size="sm" on="dark" />
              <p className="mt-4 leading-relaxed">Descubre, reserva y disfruta los mejores eventos de teatro, música y espectáculos en un solo lugar.</p>
            </div>
            <div>
              <p className="text-white font-semibold text-xs uppercase tracking-wide mb-3">Síguenos</p>
              <SocialIcons size={60} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-6 pt-6 flex-wrap">
            <div className="text-xs text-gray-500">
              <p>© 2026 TicketFlow · Plataforma de gestión de eventos y boletería</p>
              <p className="mt-1">Proyecto Integrador Universitario</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
              {["Términos", "Privacidad", "Contacto"].map(t => (
                <button key={t} className="px-4 py-1.5 rounded-full text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

