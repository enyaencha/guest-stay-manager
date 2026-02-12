import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle2, Smartphone, Monitor, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <img src="/pwa-192x192.png" alt="STROS" className="w-20 h-20 mx-auto rounded-2xl mb-4" />
          <CardTitle className="text-2xl">Install STROS</CardTitle>
          <CardDescription>Get the full app experience on your device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-sm text-muted-foreground">STROS is already installed on your device!</p>
              <Button onClick={() => navigate("/")} className="w-full">Open App</Button>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <Button onClick={handleInstall} className="w-full gap-2" size="lg">
                <Download className="h-5 w-5" /> Install Now
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Installs instantly — no app store required
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-center">Install manually:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Smartphone className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">iPhone / iPad</p>
                    <p className="text-xs text-muted-foreground">
                      Tap the <strong>Share</strong> button → <strong>Add to Home Screen</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Smartphone className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Android</p>
                    <p className="text-xs text-muted-foreground">
                      Tap the <strong>⋮ menu</strong> → <strong>Install app</strong> or <strong>Add to Home Screen</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Monitor className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Desktop (Chrome/Edge)</p>
                    <p className="text-xs text-muted-foreground">
                      Click the <strong>install icon</strong> in the address bar
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button variant="ghost" onClick={() => navigate("/")} className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
