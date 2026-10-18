import { Input } from "./Input";

// Lista de teléfonos que se puede ampliar (hasta un máximo) y de la que se puede quitar
export function ListaTelefonos({
  valores,
  onChange,
  max = 5,
}: {
  valores: string[];
  onChange: (valores: string[]) => void;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      {valores.map((t, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label={`Teléfono ${i + 1}`}
              value={t}
              onChange={(v) =>
                onChange(valores.map((x, j) => (j === i ? v : x)))
              }
              placeholder="+57 300 0000000"
            />
          </div>
          {valores.length > 1 && (
            <button
              onClick={() => onChange(valores.filter((_, j) => j !== i))}
              aria-label={`Quitar teléfono ${i + 1}`}
              className="px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
            >
              Quitar
            </button>
          )}
        </div>
      ))}
      {valores.length < max && (
        <button
          onClick={() => onChange([...valores, ""])}
          className="text-sm text-violet-600 hover:underline font-medium cursor-pointer"
        >
          ＋ Agregar otro teléfono
        </button>
      )}
    </div>
  );
}
