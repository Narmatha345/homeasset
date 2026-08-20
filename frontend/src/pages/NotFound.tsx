import { Link } from "react-router-dom";
import { HousePlus } from "lucide-react";
import { Button } from "../components/ui/Button";

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center">
        <HousePlus className="h-6 w-6 text-white" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">404 — Page not found</h1>
      <p className="text-sm text-slate-500 max-w-sm">The page you're looking for doesn't exist or may have been moved.</p>
      <Link to="/dashboard">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
