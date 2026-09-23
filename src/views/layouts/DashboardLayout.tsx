import type { Role, Screen } from "../../models/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardLayout({ role, screen, onNav, user, children }: {
  role: Role; screen: Screen; onNav: (s: Screen) => void;
  user: { name: string; email: string }; children: React.ReactNode;
}) {
  if (role === "client") {
    return (
      <div className="min-h-screen" style={{ background: "#F5F6FA" }}>
        <Topbar current={screen} onNav={onNav} user={user} />
        <main className="max-w-[1400px] mx-auto px-8 py-7">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} current={screen} onNav={onNav} user={user} />
      <main className="flex-1 overflow-auto" style={{ background: "#F5F6FA" }}>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

