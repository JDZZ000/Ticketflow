import { PRIMARY } from "../../utils/theme";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-1" style={{ fontFamily: "Outfit, sans-serif", background: `linear-gradient(135deg, #1A1B2E 0%, ${PRIMARY} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-2">
            <span className="inline-block w-6 h-0.5 rounded-full flex-shrink-0" style={{ background: PRIMARY }} />
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

