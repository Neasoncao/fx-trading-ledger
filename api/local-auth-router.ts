import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { localUsers } from "@db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { SignJWT, jwtVerify } from "jose";
import { hashPassword, verifyPassword } from "./lib/password";

const JWT_SECRET = new TextEncoder().encode(
  process.env.LOCAL_AUTH_SECRET || "local-auth-secret-key-change-in-production"
);

async function createToken(userId: number, username: string, role: string): Promise<string> {
  return new SignJWT({ userId, username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyLocalAuthToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload as { userId: number; username: string; role: string };
  } catch {
    return null;
  }
}

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(6).max(100),
        name: z.string().min(1).max(100).optional(),
        adminCode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check if user exists
      const existing = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      // Determine role - adminCode can be used to create admin accounts
      const role = input.adminCode === "ADMIN2026" ? "admin" : "user";

      const passwordHash = await hashPassword(input.password);

      const result = await db.insert(localUsers).values({
        username: input.username,
        passwordHash,
        name: input.name || input.username,
        role,
      });

      const userId = Number(result[0].insertId);
      const token = await createToken(userId, input.username, role);

      return {
        token,
        user: {
          id: userId,
          username: input.username,
          name: input.name || input.username,
          role,
        },
      };
    }),

  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const users = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username))
        .limit(1);

      if (users.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const user = users[0];
      const valid = await verifyPassword(input.password, user.passwordHash);

      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const token = await createToken(user.id, user.username, user.role);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("x-local-auth-token");
    if (!authHeader) {
      return null;
    }

    const payload = await verifyLocalAuthToken(authHeader);
    if (!payload) {
      return null;
    }

    const db = getDb();
    const users = await db
      .select()
      .from(localUsers)
      .where(eq(localUsers.id, payload.userId))
      .limit(1);

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };
  }),
});
