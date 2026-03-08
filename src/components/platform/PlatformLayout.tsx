import { ReactNode } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { Building2, LogOut, PanelTop, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface PlatformLayoutProps {
  children: ReactNode;
}

export const PlatformLayout = ({ children }: PlatformLayoutProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out from platform console");
    navigate("/platform/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full md:w-[280px] md:min-h-screen md:flex md:flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur-sm">
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Platform</p>
                <h1 className="text-lg font-semibold text-white">Owner Console</h1>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <NavLink
              to="/platform/console"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <PanelTop className="h-4 w-4" />
              Console
            </NavLink>
          </nav>

          <div className="mt-auto p-3 space-y-2 border-t border-slate-800">
            <Button
              variant="outline"
              className="w-full justify-start border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
              onClick={() => navigate("/dashboard")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Tenant App
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto bg-slate-100">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
