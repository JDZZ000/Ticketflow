import { useState } from "react";
import type { Role, Screen } from "../../models/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NAV } from "../../utils/theme";
import { Logo } from "../components/Logo";

export function DashboardLayout({ role, screen, onNav, user, children }: {
  role: Role; screen: Screen; onNav: (s: Screen) => void;
  user: { name: string; email: string }; children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (role === "client") {
    return (
      <div className="min-h-screen" style={{ background: "#F5F6FA" }}>
        <Topbar current={screen} onNav={onNav} user={user} />
        <main className="max-w-[1400px] mx-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} current={screen} onNav={onNav} user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-auto min-w-0" style={{ background: "#F5F6FA" }}>
        {/* Barra superior solo visible en móvil/tablet, con botón para abrir el menú lateral */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14" style={{ background: NAV }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white text-xl leading-none cursor-pointer"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <Logo size="sm" on="dark" />
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

