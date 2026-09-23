export function StatCard({ label, value, icon, sub, color = "violet" }: {
  label: string; value: string | number; icon: string; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    violet: "from-violet-500 to-purple-600",
    blue: "from-blue-500 to-indigo-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-600",
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color] ?? colors.violet} flex items-center justify-center text-xl text-white flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Outfit, sans-serif" }}>{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

