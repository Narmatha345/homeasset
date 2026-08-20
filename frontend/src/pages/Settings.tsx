import { useState } from "react";
import { User, Info, Layers } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

export function Settings() {
  const { user, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and view application information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Name</span>
            <span className="text-slate-800 font-medium">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Email</span>
            <span className="text-slate-800 font-medium">{user?.email}</span>
          </div>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-400" /> About HomeAsset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>
            HomeAsset is a demo Home Asset & Maintenance Management application, inspired by common
            asset-management concepts (such as those in IBM Maximo) and simplified for residential use.
          </p>
          <p className="flex items-center gap-1.5 text-slate-400">
            <Layers className="h-4 w-4" /> Built as an open demo / MVP project.
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out of HomeAsset?"
        description="You'll need to sign in again to access your dashboard."
        confirmLabel="Logout"
        onConfirm={async () => {
          logout();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
