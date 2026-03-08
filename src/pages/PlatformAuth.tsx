import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformOwner } from "@/hooks/usePlatformOwner";

const mapPlatformIdentity = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return normalized;
  if (!normalized.includes("@")) return `${normalized}@platform.local`;
  return normalized;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const PlatformAuth = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isPlatformOwner, isCheckingPlatformOwner } = usePlatformOwner();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading || isCheckingPlatformOwner) return;

    if (!user) return;

    if (isPlatformOwner) {
      navigate("/platform/console", { replace: true });
      return;
    }

    toast.error("This account is not allowed to access the platform console.");
    navigate("/dashboard", { replace: true });
  }, [authLoading, isCheckingPlatformOwner, isPlatformOwner, navigate, user]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: mapPlatformIdentity(identity),
        password,
      });

      if (error) throw error;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to sign in"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-10 text-white shadow-2xl lg:block">
            <div className="inline-flex rounded-2xl bg-cyan-500/15 p-4 text-cyan-300">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
              Platform Owner
            </p>
            <h1 className="mt-3 text-4xl font-semibold">Dedicated control portal</h1>
            <p className="mt-4 max-w-xl text-base text-slate-300">
              Manage organizations, branches, role policies, and user onboarding from one platform-only console.
            </p>
          </div>

          <Card className="w-full border-slate-800 bg-slate-900 text-white shadow-2xl">
            <CardHeader className="space-y-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <CardTitle className="text-3xl">Platform Login</CardTitle>
              <CardDescription className="text-slate-400">
                Sign in as platform owner to access global organization controls.
              </CardDescription>
              <p className="text-xs text-slate-500">
                Username shortcut supports values like <code>admin</code>.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="platform-identity" className="text-slate-200">
                    Email or Username
                  </Label>
                  <Input
                    id="platform-identity"
                    type="text"
                    autoComplete="email"
                    value={identity}
                    onChange={(event) => setIdentity(event.target.value)}
                    className="border-slate-700 bg-slate-950 text-white"
                    placeholder="admin or owner@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform-password" className="text-slate-200">
                    Password
                  </Label>
                  <Input
                    id="platform-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="border-slate-700 bg-slate-950 text-white"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  disabled={isSubmitting || authLoading || isCheckingPlatformOwner}
                >
                  {isSubmitting ? "Signing in..." : "Access Platform Console"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => navigate("/auth")}
                >
                  Back To Tenant Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlatformAuth;
