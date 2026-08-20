import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  Home,
  MapPinned,
  Boxes,
  Wrench,
  CalendarDays,
  History,
  Settings,
  HousePlus,
  X,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/houses", label: "Houses", icon: Home },
  { to: "/locations", label: "Locations", icon: MapPinned },
  { to: "/assets", label: "Assets", icon: Boxes },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/service-history", label: "Service History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <HousePlus className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-white font-semibold text-sm">HomeAsset</p>
          <p className="text-slate-400 text-[11px]">Asset & Maintenance</p>
        </div>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="ml-auto text-slate-400 hover:text-white lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-800 text-[11px] text-slate-500">
        HomeAsset Demo &middot; v1.0
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900">{content}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={onCloseMobile} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
}
