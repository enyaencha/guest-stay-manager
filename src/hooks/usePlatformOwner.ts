import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const usePlatformOwner = () => {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["is_platform_owner", user?.id],
    enabled: !!user?.id && !authLoading,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("is_platform_owner", {
        _user_id: user?.id,
      });

      if (error) throw error;
      return data === true;
    },
    staleTime: 30_000,
  });

  return {
    isPlatformOwner: query.data === true,
    isCheckingPlatformOwner: authLoading || query.isLoading,
    platformOwnerError: query.error,
    refetchPlatformOwner: query.refetch,
  };
};
