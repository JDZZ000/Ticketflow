import { useEffect, useRef } from "react";

// Ventana emergente. Se cierra con la tecla Escape o al pulsar fuera de ella,
// y al abrirse lleva el foco a la ventana (y lo devuelve al cerrarse).
export function Modal({
  titulo,
  onClose,
  children,
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  // onClose va en una referencia para que el efecto no se repita (y no robe el foco) en cada tecla
  const cerrar = useRef(onClose);
  cerrar.current = onClose;

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") cerrar.current();
    }
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      anterior?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(17,24,39,0.55)" }}
      onClick={onClose}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 outline-none"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        <h2 id="modal-titulo" className="text-lg font-bold text-gray-900 mb-4">
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  );
}
