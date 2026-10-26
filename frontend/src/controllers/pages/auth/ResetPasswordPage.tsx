import { useState } from "react";
import type { Screen } from "../../../models/types";
import { Logo } from "../../../views/components/Logo";
import { Btn } from "../../../views/components/Btn";
import { Input } from "../../../views/components/Input";
import { restablecerContrasena } from "../../../models/api/auth";
import { mensajeDeError } from "../../../models/api/cliente";
// Aviso verde de éxito (el mismo estilo del resto de la página)
const AVISO_OK =
"bg-emerald-50 border border-emerald-200 text-emerald-700 " +
"text-sm rounded-xl p-3 mb-6";
export function ResetPasswordPage({ onNav }: { onNav: (s: Screen) => void }) {
// El token llega en la dirección: /restablecer?token=...
const token = new URLSearchParams(window.location.search).get("token") ?? "";
const [contrasena, setContrasena] = useState("");
const [confirmacion, setConfirmacion] = useState("");
const [error, setError] = useState("");
const [listo, setListo] = useState(false);
const [enviando, setEnviando] = useState(false);
async function guardar() {
if (contrasena.length < 6) {
setError("La contraseña debe tener al menos 6 caracteres");
return;
}
if (contrasena !== confirmacion) {
setError("Las contraseñas no coinciden");
return;
}
setError("");
setEnviando(true);
try {
await restablecerContrasena(token, contrasena);
setListo(true);
} catch (e) {
setError(mensajeDeError(e)); // por ejemplo: «El enlace no es válido o ya expiró»
} finally {
setEnviando(false);
}
}
return (
<div
className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4"
style={{ fontFamily: "Outfit, sans-serif" }}
>
<div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-10">
<div className="mb-8">
<Logo size="md" on="light" />
</div>
<h1 className="text-3xl font-extrabold text-gray-900 mb-6">
Nueva contraseña
</h1>
{token === "" ? (
<>
<p role="alert" className="text-red-500 text-sm mb-6">
El enlace no es válido. Pide uno nuevo.
</p>
<Btn full onClick={() => onNav("forgot-password")}>
Pedir otro enlace
</Btn>
</>
) : listo ? (
<>
<div role="status" className={AVISO_OK}>
Tu contraseña se actualizó. Ya puedes iniciar sesión.
</div>
<Btn full onClick={() => onNav("login")}>
Ir al inicio de sesión
</Btn>
</>
) : (
<div className="space-y-4">
<Input
label="Contraseña nueva"
type="password"
value={contrasena}
onChange={setContrasena}
placeholder="Mínimo 6 caracteres"
required
/>
<Input
label="Repite la contraseña"
type="password"
value={confirmacion}
onChange={setConfirmacion}
required
/>
{error && (
<p role="alert" className="text-red-500 text-sm">
{error}
</p>
)}
<Btn full size="lg" disabled={enviando} onClick={guardar}>
{enviando ? "Guardando…" : "Guardar contraseña"}
</Btn>
</div>
)}
</div>
</div>
);
}