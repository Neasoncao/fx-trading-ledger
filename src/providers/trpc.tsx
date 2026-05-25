import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import * as localApi from "@/lib/local-api";

const queryClient = new QueryClient();

function base64ToFile(base64: string, filename: string): File {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab]);
  return new File([blob], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export const trpc: any = {
  ledger: {
    summary: {
      useQuery: (input: { ledger: string }, opts?: any) =>
        useQuery({
          queryKey: ["ledger", "summary", input],
          queryFn: () => localApi.ledgerSummary(input as any),
          staleTime: opts?.staleTime ?? 0,
          retry: opts?.retry ?? 1,
        }),
    },
    statistics: {
      useQuery: (input: { ledger: string; groupBy: string }, opts?: any) =>
        useQuery({
          queryKey: ["ledger", "statistics", input],
          queryFn: () => localApi.ledgerStatistics(input as any),
          staleTime: opts?.staleTime ?? 0,
          retry: opts?.retry ?? 1,
        }),
    },
    list: {
      useQuery: (
        input: {
          ledger: string;
          page: number;
          pageSize: number;
          filters?: Record<string, string>;
        },
        opts?: any
      ) =>
        useQuery({
          queryKey: ["ledger", "list", input],
          queryFn: () => localApi.ledgerList(input as any),
          staleTime: opts?.staleTime ?? 0,
          retry: opts?.retry ?? 1,
        }),
    },
    filterOptions: {
      useQuery: (input: { ledger: string }, opts?: any) =>
        useQuery({
          queryKey: ["ledger", "filterOptions", input],
          queryFn: () => localApi.ledgerFilterOptions(input as any),
          staleTime: opts?.staleTime ?? 0,
          retry: opts?.retry ?? 1,
        }),
    },
  },
  upload: {
    importExcel: {
      useMutation: (opts?: any) =>
        useMutation({
          mutationFn: ({
            fileBase64,
            filename,
          }: {
            fileBase64: string;
            filename: string;
          }) => localApi.importExcelFile(base64ToFile(fileBase64, filename)),
          ...opts,
        }),
    },
    clearData: {
      useMutation: (opts?: any) =>
        useMutation({
          mutationFn: () => localApi.clearAllLedgers(),
          ...opts,
        }),
    },
  },
  auth: {
    me: {
      useQuery: (_undefined: undefined, opts?: any) =>
        useQuery({
          queryKey: ["auth", "me"],
          queryFn: () => null,
          staleTime: opts?.staleTime ?? Infinity,
          retry: opts?.retry ?? false,
        }),
    },
    logout: {
      useMutation: (opts?: any) =>
        useMutation({
          mutationFn: async () => {},
          ...opts,
        }),
    },
  },
  localAuth: {
    me: {
      useQuery: (_undefined: undefined, opts?: any) =>
        useQuery({
          queryKey: ["localAuth", "me"],
          queryFn: () => {
            const userJson = localStorage.getItem("local_user");
            return userJson ? JSON.parse(userJson) : null;
          },
          staleTime: opts?.staleTime ?? Infinity,
          retry: opts?.retry ?? false,
        }),
    },
    login: {
      useMutation: (opts?: any) =>
        useMutation({
          mutationFn: ({
            username,
            password,
          }: {
            username: string;
            password: string;
          }) => {
            const users = JSON.parse(localStorage.getItem("local_users") || "[]");
            const user = users.find(
              (u: any) => u.username === username && u.password === password
            );
            if (!user) throw new Error("用户名或密码错误");
            localStorage.setItem("local_user", JSON.stringify(user));
            localStorage.setItem("local_auth_token", `token_${user.id}`);
            return { token: `token_${user.id}`, user };
          },
          ...opts,
        }),
    },
    register: {
      useMutation: (opts?: any) =>
        useMutation({
          mutationFn: ({
            username,
            password,
            name,
            adminCode,
          }: {
            username: string;
            password: string;
            name?: string;
            adminCode?: string;
          }) => {
            const users = JSON.parse(localStorage.getItem("local_users") || "[]");
            if (users.find((u: any) => u.username === username)) {
              throw new Error("用户名已存在");
            }
            const isFirstUser = users.length === 0;
            const role =
              isFirstUser || adminCode === "ADMIN2026" ? "admin" : "user";
            const newUser = {
              id: Date.now(),
              username,
              password,
              name: name || username,
              role,
            };
            users.push(newUser);
            localStorage.setItem("local_users", JSON.stringify(users));
            localStorage.setItem("local_user", JSON.stringify(newUser));
            localStorage.setItem("local_auth_token", `token_${newUser.id}`);
            return { token: `token_${newUser.id}`, user: newUser };
          },
          ...opts,
        }),
    },
  },
  useUtils: () => ({
    invalidate: () => queryClient.invalidateQueries(),
  }),
};

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
