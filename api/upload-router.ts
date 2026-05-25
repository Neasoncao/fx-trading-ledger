import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reportExposures, tradingExposures, proprietaryTrades } from "@db/schema";
import { sql } from "drizzle-orm";
import { importExcelData } from "../db/import-data";
import { TRPCError } from "@trpc/server";
import { writeFile, unlink } from "fs/promises";

export const uploadRouter = createRouter({
  importExcel: adminQuery
    .input(
      z.object({
        fileBase64: z.string(),
        filename: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Decode base64 file
        const buffer = Buffer.from(input.fileBase64, "base64");
        const tempPath = `/tmp/upload_${Date.now()}_${input.filename}`;

        // Write temp file
        await writeFile(tempPath, buffer);

        // Import data
        const batchId = await importExcelData(tempPath);

        // Clean up temp file
        try {
          await unlink(tempPath);
        } catch {
          // ignore cleanup error
        }

        // Get summary counts
        const db = getDb();
        const [reportCount, tradingCount, propCount] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(reportExposures)
            .where(sql`${reportExposures.batchId} = ${batchId}`),
          db
            .select({ count: sql<number>`count(*)` })
            .from(tradingExposures)
            .where(sql`${tradingExposures.batchId} = ${batchId}`),
          db
            .select({ count: sql<number>`count(*)` })
            .from(proprietaryTrades)
            .where(sql`${proprietaryTrades.batchId} = ${batchId}`),
        ]);

        return {
          success: true,
          batchId,
          reportCount: reportCount[0]?.count ?? 0,
          tradingCount: tradingCount[0]?.count ?? 0,
          proprietaryCount: propCount[0]?.count ?? 0,
        };
      } catch (error) {
        console.error("Upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to process file",
        });
      }
    }),

  clearData: adminQuery.mutation(async () => {
    const db = getDb();

    await Promise.all([
      db.delete(reportExposures),
      db.delete(tradingExposures),
      db.delete(proprietaryTrades),
    ]);

    return { success: true };
  }),
});
