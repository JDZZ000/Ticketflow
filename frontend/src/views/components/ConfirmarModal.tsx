import { useState } from "react";
import { mensajeDeError } from "../../models/api/cliente";
import { Btn } from "./Btn";
import { Modal } from "./Modal";

// Pide confirmación antes de una acción que no se puede deshacer (por ejemplo, eliminar).
// Si el servidor la rechaza, muestra su mensaje dentro de la misma ventana.
export function ConfirmarModal({
  titulo,
  mensaje,
  textoConfirmar,
  onConfirmar,
  onClose,
}: {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  onConfirmar: () => Promise<void>;
  onClose: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function confirmar() {
    setError("");
    setEnviando(true);
    try {
      await onConfirmar();
      onClose();
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={titulo} onClose={onClose}>
      <p className="text-sm text-gray-600">{mensaje}</p>
      {error && (
        <p role="alert" className="text-red-500 text-sm mt-3">
          {error}
        </p>
      )}
      <div className="flex gap-3 mt-5">
        <Btn variant="danger" disabled={enviando} onClick={confirmar}>
          {enviando ? "Un momento…" : textoConfirmar}
        </Btn>
        <Btn variant="ghost" disabled={enviando} onClick={onClose}>
          Volver
        </Btn>
      </div>
    </Modal>
  );
}
