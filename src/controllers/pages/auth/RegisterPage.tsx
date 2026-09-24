import { useState } from "react";
import type { Screen, Role } from "../../../models/types";
import { PRIMARY } from "../../../utils/theme";
import { Logo } from "../../../views/components/Logo";
import { Btn } from "../../../views/components/Btn";
import { Input } from "../../../views/components/Input";

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export function RegisterPage({ onNav, registrarUsuario, usuarios }: { onNav: (s: Screen) => void; registrarUsuario: (nombre: string, email: string, pass: string, role: Role, id: string, direccion: string, ciudad: string, telefono: string) => void; usuarios: { email: string }[] }) {
  const [tipoUsuario, setTipoUsuario] = useState<"Cliente" | "Agente">("Cliente");
  const [form, setForm] = useState({ id: "", nombre: "", email: "", direccion: "", ciudad: "", telefono: "", pass: "", pass2: "" });
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const [error, setError] = useState("");
  function handleRegister() {
  if (form.nombre === "" || form.email === "" || form.pass === "" || form.pass2 === "") {
    setError("Por favor, completa nombre, correo y contraseña");
    return;
  }
  if (form.pass !== form.pass2) {
    setError("Las contraseñas no coinciden");
    return;
  }
  if (usuarios.some(u => u.email === form.email)) {
  setError("Ya existe una cuenta con ese correo");
  return;
}
  setError("");
  registrarUsuario(form.nombre, form.email, form.pass, tipoUsuario === "Cliente" ? "client" : "agent", form.id, form.direccion, form.ciudad, form.telefono);
  onNav("login");
}
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-10">
        <div className="mb-8">
          <Logo size="md" on="light" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2" style={{ background: `linear-gradient(135deg, #1A1B2E, ${PRIMARY})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Crear cuenta</h1>
        <p className="text-gray-500 text-sm mb-8 flex items-center gap-2"><span className="inline-block w-6 h-0.5 rounded-full" style={{ background: PRIMARY }} />Únete a la plataforma de eventos más completa</p>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Tipo de cuenta</p>
          <div className="flex gap-3">
            {(["Cliente", "Agente"] as const).map(t => (
              <button key={t} onClick={() => setTipoUsuario(t)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition cursor-pointer ${tipoUsuario === t ? "border-violet-600 text-violet-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                style={tipoUsuario === t ? { background: PRIMARY + "11" } : {}}>
                {t === "Cliente" ? "🧑 Cliente" : "🎭 Agente"}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Los administradores son creados directamente por el sistema.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Input label="N.° de identificación" value={form.id} onChange={f("id")} placeholder="1234567890" />
          <Input label="Nombre completo" value={form.nombre} onChange={f("nombre")} placeholder="María González" required />
          <Input label="Correo electrónico" type="email" value={form.email} onChange={f("email")} placeholder="correo@ejemplo.com" required />
          <Input label="Teléfono" value={form.telefono} onChange={f("telefono")} placeholder="+57 300 0000000" />
          <Input label="Dirección" value={form.direccion} onChange={f("direccion")} placeholder="Calle 123 # 45-67" />
          <Input label="Ciudad" value={form.ciudad} onChange={f("ciudad")} placeholder="Bogotá" />
          <Input label="Contraseña" type="password" value={form.pass} onChange={f("pass")} placeholder="Mínimo 8 caracteres" required />
          <Input label="Confirmar contraseña" type="password" value={form.pass2} onChange={f("pass2")} placeholder="Repite tu contraseña" required />
        </div>
        
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="mt-6 flex gap-3">
          <Btn full size="lg" onClick={handleRegister}>Crear cuenta</Btn>
          <Btn variant="ghost" size="lg" onClick={() => onNav("login")}>Cancelar</Btn>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{" "}
          <button className="text-violet-600 font-semibold hover:underline" onClick={() => onNav("login")}>Iniciar sesión</button>
        </p>
      </div>
    </div>
  );
}

