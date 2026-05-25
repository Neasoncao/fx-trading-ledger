import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { authenticateRequest } from "./kimi/auth";
import { verifyLocalAuthToken } from "./local-auth-router";
import { getDb } from "./queries/connection";
import { localUsers } from "@db/schema";
import { eq } from "drizzle-orm";

export type UnifiedUser = {
  id: number;
  name: string | null;
  email?: string | null;
  avatar?: string | null;
  role: "user" | "admin";
  authType: "oauth" | "local";
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: UnifiedUser;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try OAuth authentication first
  try {
    const oauthUser = await authenticateRequest(opts.req.headers);
    if (oauthUser) {
      ctx.user = {
        id: oauthUser.id,
        name: oauthUser.name,
        email: oauthUser.email,
        avatar: oauthUser.avatar,
        role: oauthUser.role as "user" | "admin",
        authType: "oauth",
      };
      return ctx;
    }
  } catch {
    // OAuth auth failed, try local auth
  }

  // Try local authentication
  try {
    const localToken = opts.req.headers.get("x-local-auth-token");
    if (localToken) {
      const payload = await verifyLocalAuthToken(localToken);
      if (payload) {
        const db = getDb();
        const users = await db
          .select()
          .from(localUsers)
          .where(eq(localUsers.id, payload.userId))
          .limit(1);

        if (users.length > 0) {
          const user = users[0];
          ctx.user = {
            id: user.id,
            name: user.name,
            role: user.role as "user" | "admin",
            authType: "local",
          };
        }
      }
    }
  } catch {
    // Local auth failed
  }

  return ctx;
}
