"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, PenTool, Factory } from "lucide-react";

const navItems = [
  { href: "/tv",       icon: LayoutDashboard, label: "Command Center" },
  { href: "/sales",    icon: Users,           label: "Sales & Orders" },
  { href: "/engineer", icon: PenTool,         label: "Design Desk"    },
  { href: "/floor",         icon: Factory,         label: "Live Floor Pulse" },
  { href: "/history",   icon: LayoutDashboard, label: "Dispatch & Ledger History" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-slate-950 text-slate-300 flex flex-col shadow-2xl z-50 shrink-0">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">
          TechSaw <span className="text-indigo-500">OS</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
          Operating System
        </p>
      </div>

      {/* Nav links */}
      <div className="flex flex-col gap-1 px-3 py-4 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          // Exact match for "/" so it doesn't highlight on every route
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg font-semibold
                transition-all duration-150
                ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${isActive ? "text-indigo-200" : ""}`}
              />
              <span>{label}</span>

              {/* Active indicator bar */}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600 font-medium">
          Accurate Cutting Systems
        </p>
      </div>
    </nav>
  );
}