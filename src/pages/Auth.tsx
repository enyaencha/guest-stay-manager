import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, KeyRound, Lock, Mail, User, ArrowLeft, RefreshCw } from "lucide-react";
import { z } from "zod";
import heroBg from "@/assets/hero-bg.jpg";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading } = useAuth();
  
  const [secretVerified, setSecretVerified] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  // Check if coming with verified secret from landing page
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      setSecretVerified(true);
    }
  }, [searchParams]);

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
        setSecretVerified(true);
        toast.success("Access code verified!");
      } else {
        toast.error("Invalid access code. Please try again.");
      }
    } catch (error: any) {
      console.error("Error verifying secret:", error);
      toast.error("Failed to verify access code");
    } finally {
      setIsVerifying(false);
    }
  };

  const validateForm = (isSignUp: boolean): boolean => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e: any) {
      newErrors.email = e.errors[0].message;
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e: any) {
      newErrors.password = e.errors[0].message;
    }
    
    if (isSignUp) {
      try {
        nameSchema.parse(fullName);
      } catch (e: any) {
        newErrors.name = e.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(false)) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please try again.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(true)) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("An account with this email already exists. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      toast.success("Account created successfully! Welcome to HavenStay.");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      emailSchema.parse(resetEmail);
    } catch (e: any) {
      toast.error(e.errors[0].message);
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Check your inbox.");
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Password Reset View
  if (showResetPassword && secretVerified) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: `linear-gradient(to bottom right, hsl(158 45% 12% / 0.9), hsl(45 30% 98% / 0.85)), url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 border-accent/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                />
              </div>
            </div>
            <Button 
              onClick={handleResetPassword} 
              className="w-full"
              disabled={isResetting}
            >
              {isResetting ? "Sending..." : "Send Reset Link"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowResetPassword(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Secret gate view
  if (!secretVerified) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: `linear-gradient(to bottom right, hsl(158 45% 12% / 0.85), hsl(45 30% 98% / 0.8)), url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 border-accent/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Staff Access</CardTitle>
            <CardDescription>
              Enter your staff access code to continue to the login page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">Access Code</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter staff access code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifySecret()}
                className="bg-background/80"
              />
            </div>
            <Button 
              onClick={handleVerifySecret} 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "Verify Access Code"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login/Signup view
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(to bottom right, hsl(158 45% 12% / 0.85), hsl(45 30% 98% / 0.8)), url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 border-accent/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="text-2xl">HavenStay Staff Portal</CardTitle>
          <CardDescription>
            Sign in to access the hotel management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9 bg-background/80"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="text-xs text-accent hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 bg-background/80"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-9 bg-background/80"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9 bg-background/80"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 bg-background/80"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  First user to sign up will be assigned Administrator role
                </p>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 pt-4 border-t border-accent/20">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
