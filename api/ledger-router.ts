import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reportExposures, tradingExposures, proprietaryTrades } from "@db/schema";
import { sql, and, eq, desc } from "drizzle-orm";
import type { MySqlColumn } from "drizzle-orm/mysql-core";

const ledgerEnum = z.enum(["report", "trading", "proprietary"]);

function getTable(ledger: z.infer<typeof ledgerEnum>) {
  switch (ledger) {
    case "report":
      return reportExposures;
    case "trading":
      return tradingExposures;
    case "proprietary":
      return proprietaryTrades;
  }
}

export const ledgerRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        ledger: ledgerEnum,
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(500).default(50),
        filters: z
          .object({
            entity: z.string().optional(),
            trader: z.string().optional(),
            counterparty: z.string().optional(),
            expiryStatus: z.string().optional(),
            closeStatus: z.string().optional(),
            direction: z.string().optional(),
            productType: z.string().optional(),
            currencyPair: z.string().optional(),
            callPut: z.string().optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const table = getTable(input.ledger);
      const db = getDb();
      const offset = (input.page - 1) * input.pageSize;

      const conditions: ReturnType<typeof eq>[] = [];
      if (input.filters?.entity) {
        conditions.push(eq(table.entity, input.filters.entity));
      }
      if (input.filters?.trader) {
        conditions.push(eq(table.trader, input.filters.trader));
      }
      if (input.filters?.counterparty) {
        conditions.push(eq(table.counterparty, input.filters.counterparty));
      }
      if (input.filters?.expiryStatus) {
        conditions.push(eq(table.expiryStatus, input.filters.expiryStatus));
      }
      if (input.filters?.closeStatus) {
        conditions.push(eq(table.closeStatus, input.filters.closeStatus));
      }
      if (input.filters?.direction) {
        conditions.push(eq(table.direction, input.filters.direction));
      }
      if (input.filters?.productType) {
        conditions.push(eq(table.productType, input.filters.productType));
      }
      if (input.filters?.currencyPair) {
        conditions.push(eq(table.currencyPair, input.filters.currencyPair));
      }
      if (input.filters?.callPut) {
        conditions.push(eq(table.callPut, input.filters.callPut));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db
          .select()
          .from(table)
          .where(whereClause)
          .orderBy(desc(table.id))
          .limit(input.pageSize)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(table)
          .where(whereClause),
      ]);

      return {
        items,
        total: countResult[0]?.count ?? 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  statistics: publicQuery
    .input(
      z.object({
        ledger: ledgerEnum,
        groupBy: z.enum([
          "entity",
          "trader",
          "counterparty",
          "expiryStatus",
          "closeStatus",
          "direction",
          "productType",
          "currencyPair",
          "callPut",
        ]),
      })
    )
    .query(async ({ input }) => {
      const table = getTable(input.ledger);
      const db = getDb();
      const groupCol = table[input.groupBy] as MySqlColumn;

      // Build query dynamically based on ledger type
      const notionalCol = table.notionalLocal;
      
      // Get base stats
      const results = await db
        .select({
          groupValue: groupCol,
          count: sql<number>`count(*)`,
          totalNotional: sql<string>`COALESCE(SUM(${notionalCol}), 0)`,
          avgNotional: sql<string>`COALESCE(AVG(${notionalCol}), 0)`,
        })
        .from(table)
        .groupBy(groupCol)
        .orderBy(desc(sql`count(*)`));

      // Get PnL stats with raw SQL to avoid type issues
      let pnlSql: string;
      if (input.ledger === "report") {
        pnlSql = `
          SELECT ${input.groupBy} as groupValue,
            COALESCE(SUM(unrealized_pnl_usd), 0) as totalUnrealizedPnl,
            COALESCE(SUM(realized_pnl_usd), 0) as totalRealizedPnl,
            0 as totalPnl
          FROM report_exposures
          GROUP BY ${input.groupBy}
        `;
      } else if (input.ledger === "trading") {
        pnlSql = `
          SELECT ${input.groupBy} as groupValue,
            COALESCE(SUM(unrealized_pnl_cny), 0) as totalUnrealizedPnl,
            COALESCE(SUM(realized_pnl_cny), 0) as totalRealizedPnl,
            0 as totalPnl
          FROM trading_exposures
          GROUP BY ${input.groupBy}
        `;
      } else {
        pnlSql = `
          SELECT ${input.groupBy} as groupValue,
            COALESCE(SUM(unrealized_pnl_usd), 0) as totalUnrealizedPnl,
            0 as totalRealizedPnl,
            COALESCE(SUM(total_pnl_usd), 0) as totalPnl
          FROM proprietary_trades
          GROUP BY ${input.groupBy}
        `;
      }

      const pnlResults = await db.execute(sql.raw(pnlSql)) as unknown as Array<{
        groupValue: string;
        totalUnrealizedPnl: string;
        totalRealizedPnl: string;
        totalPnl: string;
      }>;

      // Merge results
      const merged = results.map((r) => {
        const pnl = pnlResults.find((p) => p.groupValue === r.groupValue);
        return {
          groupValue: r.groupValue || "(未指定)",
          count: r.count,
          totalNotional: Number(r.totalNotional),
          avgNotional: Number(r.avgNotional),
          totalUnrealizedPnl: Number(pnl?.totalUnrealizedPnl ?? 0),
          totalRealizedPnl: Number(pnl?.totalRealizedPnl ?? 0),
          totalPnl: Number(pnl?.totalPnl ?? 0),
        };
      });

      return merged;
    }),

  summary: publicQuery
    .input(z.object({ ledger: ledgerEnum }))
    .query(async ({ input }) => {
      const table = getTable(input.ledger);
      const db = getDb();

      const result = await db
        .select({
          totalCount: sql<number>`count(*)`,
          totalNotional: sql<string>`COALESCE(SUM(${table.notionalLocal}), 0)`,
          avgNotional: sql<string>`COALESCE(AVG(${table.notionalLocal}), 0)`,
          maxNotional: sql<string>`COALESCE(MAX(${table.notionalLocal}), 0)`,
        })
        .from(table);

      let pnlSql: string;
      if (input.ledger === "report") {
        pnlSql = `
          SELECT 
            COALESCE(SUM(unrealized_pnl_usd), 0) as totalUnrealizedPnl,
            COALESCE(SUM(realized_pnl_usd), 0) as totalRealizedPnl,
            COALESCE(SUM(premium), 0) as totalPremium
          FROM report_exposures
        `;
      } else if (input.ledger === "trading") {
        pnlSql = `
          SELECT 
            COALESCE(SUM(unrealized_pnl_cny), 0) as totalUnrealizedPnl,
            COALESCE(SUM(realized_pnl_cny), 0) as totalRealizedPnl,
            COALESCE(SUM(premium), 0) as totalPremium
          FROM trading_exposures
        `;
      } else {
        pnlSql = `
          SELECT 
            COALESCE(SUM(unrealized_pnl_usd), 0) as totalUnrealizedPnl,
            COALESCE(SUM(total_pnl_usd), 0) as totalRealizedPnl,
            COALESCE(SUM(premium), 0) as totalPremium
          FROM proprietary_trades
        `;
      }

      const pnlResult = await db.execute(sql.raw(pnlSql)) as unknown as Array<{
        totalUnrealizedPnl: string;
        totalRealizedPnl: string;
        totalPremium: string;
      }>;

      return {
        ...result[0],
        totalNotional: Number(result[0].totalNotional),
        avgNotional: Number(result[0].avgNotional),
        maxNotional: Number(result[0].maxNotional),
        totalUnrealizedPnl: Number(pnlResult[0].totalUnrealizedPnl),
        totalRealizedPnl: Number(pnlResult[0].totalRealizedPnl),
        totalPremium: Number(pnlResult[0].totalPremium),
      };
    }),

  filterOptions: publicQuery
    .input(z.object({ ledger: ledgerEnum }))
    .query(async ({ input }) => {
      const table = getTable(input.ledger);
      const db = getDb();

      const [
        entities,
        traders,
        counterparties,
        expiryStatuses,
        closeStatuses,
        directions,
        productTypes,
        currencyPairs,
        callPuts,
      ] = await Promise.all([
        db.selectDistinct({ value: table.entity }).from(table).where(sql`${table.entity} IS NOT NULL`),
        db.selectDistinct({ value: table.trader }).from(table).where(sql`${table.trader} IS NOT NULL`),
        db.selectDistinct({ value: table.counterparty }).from(table).where(sql`${table.counterparty} IS NOT NULL`),
        db.selectDistinct({ value: table.expiryStatus }).from(table).where(sql`${table.expiryStatus} IS NOT NULL`),
        db.selectDistinct({ value: table.closeStatus }).from(table).where(sql`${table.closeStatus} IS NOT NULL`),
        db.selectDistinct({ value: table.direction }).from(table).where(sql`${table.direction} IS NOT NULL`),
        db.selectDistinct({ value: table.productType }).from(table).where(sql`${table.productType} IS NOT NULL`),
        db.selectDistinct({ value: table.currencyPair }).from(table).where(sql`${table.currencyPair} IS NOT NULL`),
        db.selectDistinct({ value: table.callPut }).from(table).where(sql`${table.callPut} IS NOT NULL`),
      ]);

      return {
        entities: entities.map((e) => e.value).filter(Boolean),
        traders: traders.map((e) => e.value).filter(Boolean),
        counterparties: counterparties.map((e) => e.value).filter(Boolean),
        expiryStatuses: expiryStatuses.map((e) => e.value).filter(Boolean),
        closeStatuses: closeStatuses.map((e) => e.value).filter(Boolean),
        directions: directions.map((e) => e.value).filter(Boolean),
        productTypes: productTypes.map((e) => e.value).filter(Boolean),
        currencyPairs: currencyPairs.map((e) => e.value).filter(Boolean),
        callPuts: callPuts.map((e) => e.value).filter(Boolean),
      };
    }),
});
