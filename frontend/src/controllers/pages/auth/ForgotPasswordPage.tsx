import { useState } from "react";
import type { Screen } from "../../../models/types";
import { Logo } from "../../../views/components/Logo";
import { Btn } from "../../../views/components/Btn";
import { Input } from "../../../views/components/Input";
import { solicitarRecuperacion } from "../../../models/api/auth";
import { mensajeDeError } from "../../../models/api/cliente";
// Aviso verde de éxito (el mismo estilo del resto de la página)
const AVISO_OK =
"bg-emerald-50 border border-emerald-200 text-emerald-700 " +
"text-sm rounded-xl p-3 mb-6";
export function ForgotPasswordPage({ onNav }: { onNav: (s: Screen) => void }) {
const [correo, setCorreo] = useState("");
const [error, setError] = useState("");
const [mensaje, setMensaje] = useState(""); // lo que responde el servidor
const [enviando, setEnviando] = useState(false);
async function enviar() {
if (!/^\S+@\S+\.\S+$/.test(correo.trim())) {
setError("Escribe un correo válido");
return;
}
setError("");
setEnviando(true);
try {
setMensaje(await solicitarRecuperacion(correo.trim()));
} catch (e) {
setError(mensajeDeError(e));
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
<h1 className="text-3xl font-extrabold text-gray-900 mb-2">
Recuperar contraseña
</h1>
<p className="text-gray-500 text-sm mb-6">
Escribe el correo de tu cuenta y te enviaremos un enlace para crear
una contraseña nueva.
</p>
{mensaje ? (
<div role="status" className={AVISO_OK}>
{mensaje}
</div>
) : (
<div className="space-y-4 mb-6">
<Input
label="Correo electrónico"
type="email"
value={correo}
onChange={setCorreo}
placeholder="tu@correo.com"
required
/>
{error && (
<p role="alert" className="text-red-500 text-sm">
{error}
</p>
)}
<Btn full size="lg" disabled={enviando} onClick={enviar}>
{enviando ? "Enviando…" : "Enviar enlace"}
</Btn>
</div>
)}
<button
onClick={() => onNav("login")}
className="text-sm text-violet-600 hover:underline font-medium cursor-pointer"
>
← Volver al inicio de sesión
</button>
</div>
</div>
);
}