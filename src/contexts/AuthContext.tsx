import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  passwordResetRequired: boolean;
  roles: UserRole[];
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          role_id,
          roles:role_id (
            id,
            name,
            permissions
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      const userRoles: UserRole[] = [];
      const allPermissions: string[] = [];

      data?.forEach((ur: any) => {
        if (ur.roles) {
          userRoles.push({
            id: ur.roles.id,
            name: ur.roles.name,
            permissions: ur.roles.permissions || [],
          });
          (ur.roles.permissions || []).forEach((p: string) => {
            if (!allPermissions.includes(p)) {
              allPermissions.push(p);
            }
          });
        }
      });

      setRoles(userRoles);
      setPermissions(allPermissions);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      setRoles([]);
      setPermissions([]);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("password_reset_required")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      setPasswordResetRequired(!!data?.password_reset_required);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setPasswordResetRequired(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setRoles([]);
          setPermissions([]);
          setPasswordResetRequired(false);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoles(session.user.id);
        fetchProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasRole = (roleName: string): boolean => {
    return roles.some((r) => r.name.toLowerCase() === roleName.toLowerCase());
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPasswordResetRequired(false);
    setRoles([]);
    setPermissions([]);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        passwordResetRequired,
        roles,
        permissions,
        hasPermission,
        hasRole,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
