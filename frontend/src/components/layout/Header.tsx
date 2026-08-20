import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell, LogOut, User as UserIcon, AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDebounce } from "../../hooks/useDebounce";
import { searchApi, type SearchResults } from "../../api/searchApi";
import { dashboardApi } from "../../api/dashboardApi";
import type { AppNotification } from "../../types";

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dashboardApi.notifications().then(setNotifications).catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }
    searchApi
      .search(debouncedQuery.trim())
      .then(setResults)
      .catch(() => setResults(null));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results && (results.assets.length || results.locations.length || results.services.length);

  const notifIcon = { overdue: ShieldAlert, "due-soon": Clock, warranty: AlertTriangle };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button onClick={onOpenMobileMenu} className="lg:hidden text-slate-500 hover:text-slate-700" aria-label="Open menu">
        <Menu className="h-6 w-6" />
      </button>

      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search assets, rooms, service records..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {searchOpen && debouncedQuery.trim() && (
          <div className="absolute left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {!hasResults && <p className="px-4 py-6 text-sm text-slate-500 text-center">No results for "{debouncedQuery}"</p>}
            {!!results?.assets.length && (
              <div className="py-2">
                <p className="px-4 pb-1 text-xs font-semibold uppercase text-slate-400">Assets</p>
                {results.assets.map((a) => (
                  <button
                    key={a._id}
                    onClick={() => {
                      navigate(`/assets/${a._id}`);
                      setSearchOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-800">{a.name}</span>
                    <span className="text-xs text-slate-400">
                      {a.assetId} &middot; {a.brand} {a.model}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {!!results?.locations.length && (
              <div className="py-2 border-t border-slate-100">
                <p className="px-4 pb-1 text-xs font-semibold uppercase text-slate-400">Rooms</p>
                {results.locations.map((l) => (
                  <button
                    key={l._id}
                    onClick={() => {
                      navigate("/locations");
                      setSearchOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-start px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
            {!!results?.services.length && (
              <div className="py-2 border-t border-slate-100">
                <p className="px-4 pb-1 text-xs font-semibold uppercase text-slate-400">Service Records</p>
                {results.services.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => {
                      navigate("/service-history");
                      setSearchOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-800">{s.serviceType}</span>
                    <span className="text-xs text-slate-400">{s.serviceProvider}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-3">
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500 text-center">You're all caught up.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notifications.map((n) => {
                    const Icon = notifIcon[n.type];
                    return (
                      <li key={n.id} className="flex items-start gap-2.5 px-4 py-3">
                        <Icon
                          className={`h-4 w-4 mt-0.5 shrink-0 ${
                            n.type === "overdue" ? "text-red-500" : n.type === "due-soon" ? "text-amber-500" : "text-blue-500"
                          }`}
                        />
                        <span className="text-sm text-slate-700">{n.message}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div ref={userRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() || <UserIcon className="h-4 w-4" />}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name}</span>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
