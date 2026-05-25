import { authRouter } from "./auth-router";
import { localAuthRouter } from "./local-auth-router";
import { ledgerRouter } from "./ledger-router";
import { uploadRouter } from "./upload-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  ledger: ledgerRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
