import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

interface StaffSecretModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StaffSecretModal({ open, onOpenChange }: StaffSecretModalProps) {
  const navigate = useNavigate();
  const [secretCode, setSecretCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifySecret = async () => {
    if (!secretCode.trim()) {
      toast.error("Please enter the staff access code");
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.rpc("verify_staff_secret", {
        _secret: secretCode.trim(),
      } as any);

      if (error) throw error;

      if (data === true) {
        toast.success("Access verified!");
        onOpenChange(false);
        navigate("/auth?verified=true");
      } else {
        toast.error("Invalid access code. Please contact your administrator.");
      }
    } catch (error: any) {
      console.error("Error verifying secret:", error);
      toast.error("Failed to verify access code");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Staff Access Required</DialogTitle>
          <DialogDescription className="text-center">
            Enter your staff access code to continue to the login page
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="secret-code">Access Code</Label>
            <Input
              id="secret-code"
              type="password"
              placeholder="Enter staff access code"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerifySecret()}
            />
          </div>
          <Button 
            onClick={handleVerifySecret} 
            className="w-full"
            disabled={isVerifying}
          >
            {isVerifying ? "Verifying..." : "Continue to Login"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
