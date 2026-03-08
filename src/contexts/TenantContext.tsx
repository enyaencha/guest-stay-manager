import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type TenantContextRow = {
  organization_id: string;
  organization_slug: string;
  organization_name: string;
  membership_role: string;
  has_all_properties: boolean;
  property_id: string;
  property_slug: string;
  property_name: string;
};

export type AccessibleProperty = {
  id: string;
  organization_id: string;
  slug: string;
  display_name: string;
  is_primary: boolean;
  is_active: boolean;
};

interface TenantContextType {
  isLoading: boolean;
  organizationId: string | null;
  organizationSlug: string | null;
  organizationName: string;
  membershipRole: string | null;
  propertyId: string | null;
  propertySlug: string | null;
  propertyName: string;
  properties: AccessibleProperty[];
  refreshTenantContext: () => Promise<void>;
  switchProperty: (propertyId: string) => Promise<{ error: Error | null }>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const DEFAULT_ORG_NAME = "Organization";
const DEFAULT_PROPERTY_NAME = "Main Branch";

type RpcResult = {
  data: unknown;
  error: Error | null;
};

type RpcClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<RpcResult>;
};

const rpcClient = supabase as unknown as RpcClient;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationSlug, setOrganizationSlug] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>(DEFAULT_ORG_NAME);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertySlug, setPropertySlug] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string>(DEFAULT_PROPERTY_NAME);
  const [properties, setProperties] = useState<AccessibleProperty[]>([]);

  const resetTenantState = useCallback(() => {
    setOrganizationId(null);
    setOrganizationSlug(null);
    setOrganizationName(DEFAULT_ORG_NAME);
    setMembershipRole(null);
    setPropertyId(null);
    setPropertySlug(null);
    setPropertyName(DEFAULT_PROPERTY_NAME);
    setProperties([]);
  }, []);

  const refreshTenantContext = useCallback(async () => {
    if (!user?.id) {
      resetTenantState();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [{ data: contextData, error: contextError }, { data: propertiesData, error: propertiesError }] =
        await Promise.all([
          rpcClient.rpc("get_my_tenant_context"),
          rpcClient.rpc("list_my_accessible_properties"),
        ]);

      if (contextError) throw contextError;
      if (propertiesError) throw propertiesError;

      const contextRow: TenantContextRow | null =
        Array.isArray(contextData) && contextData.length > 0 ? (contextData[0] as TenantContextRow) : null;

      const nextProperties = Array.isArray(propertiesData)
        ? (propertiesData as AccessibleProperty[])
        : [];

      setProperties(nextProperties);

      if (!contextRow) {
        resetTenantState();
        return;
      }

      setOrganizationId(contextRow.organization_id || null);
      setOrganizationSlug(contextRow.organization_slug || null);
      setOrganizationName(contextRow.organization_name || DEFAULT_ORG_NAME);
      setMembershipRole(contextRow.membership_role || null);
      setPropertyId(contextRow.property_id || null);
      setPropertySlug(contextRow.property_slug || null);
      setPropertyName(contextRow.property_name || DEFAULT_PROPERTY_NAME);
    } catch (error: unknown) {
      console.error("Failed to load tenant context", error);
      resetTenantState();
      toast.error(getErrorMessage(error, "Failed to load organization context"));
    } finally {
      setIsLoading(false);
    }
  }, [resetTenantState, user?.id]);

  const switchProperty = useCallback(
    async (nextPropertyId: string) => {
      try {
        const { error } = await rpcClient.rpc("set_current_property", {
          _property_id: nextPropertyId,
        });

        if (error) throw error;

        await refreshTenantContext();
        await queryClient.invalidateQueries();

        return { error: null };
      } catch (error: unknown) {
        console.error("Failed to switch property", error);
        toast.error(getErrorMessage(error, "Failed to switch branch"));
        return { error: error instanceof Error ? error : new Error("Failed to switch branch") };
      }
    },
    [queryClient, refreshTenantContext]
  );

  useEffect(() => {
    if (authLoading) return;
    void refreshTenantContext();
  }, [authLoading, refreshTenantContext, user?.id]);

  const value = useMemo<TenantContextType>(
    () => ({
      isLoading,
      organizationId,
      organizationSlug,
      organizationName,
      membershipRole,
      propertyId,
      propertySlug,
      propertyName,
      properties,
      refreshTenantContext,
      switchProperty,
    }),
    [
      isLoading,
      organizationId,
      organizationSlug,
      organizationName,
      membershipRole,
      propertyId,
      propertySlug,
      propertyName,
      properties,
      refreshTenantContext,
      switchProperty,
    ]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
