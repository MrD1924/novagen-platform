"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/domain";
import { clearStoredTokens, setStoredTokens, getStoredToken } from "@/services/apiClient";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authService.me()).data,
    enabled: typeof window !== "undefined" && !!getStoredToken("novagen_access_token"),
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await authService.login(email, password);
      return res.data;
    },
    onSuccess: async (data) => {
      setStoredTokens(data.access_token, data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      // Route by the account's real role, not a guess - admins land in the
      // separate admin console, everyone else in the normal workspace.
      const me = await authService.me();
      router.push(me.data.role === "admin" ? "/admin" : "/dashboard");
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string; full_name: string; role: string; organization?: string }) => {
      const res = await authService.register(payload);
      return res.data;
    },
    onSuccess: () => router.push("/login?registered=1"),
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    clearStoredTokens();
    queryClient.clear();
    router.push("/login");
  };
}
