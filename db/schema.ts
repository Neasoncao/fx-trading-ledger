import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  date,
  int,
} from "drizzle-orm/mysql-core";

// Users table (OAuth)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Local users table (username/password login)
export const localUsers = mysqlTable("local_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

// 报表敞口台账 (Report Exposure Ledger)
export const reportExposures = mysqlTable("report_exposures", {
  id: serial("id").primaryKey(),
  seqNo: int("seq_no"),
  tradeDate: date("trade_date"),
  entity: varchar("entity", { length: 100 }),
  trader: varchar("trader", { length: 100 }),
  counterparty: varchar("counterparty", { length: 100 }),
  expiryStatus: varchar("expiry_status", { length: 50 }),
  closeStatus: varchar("close_status", { length: 50 }),
  priceCurrency: varchar("price_currency", { length: 10 }),
  settleCurrency: varchar("settle_currency", { length: 10 }),
  pricingDate: date("pricing_date"),
  premiumDate: date("premium_date"),
  deliveryDate: date("delivery_date"),
  direction: varchar("direction", { length: 20 }),
  productType: varchar("product_type", { length: 50 }),
  currencyPair: varchar("currency_pair", { length: 20 }),
  subType: varchar("sub_type", { length: 50 }),
  callPut: varchar("call_put", { length: 20 }),
  notionalLocal: decimal("notional_local", { precision: 20, scale: 2 }),
  barrier1: decimal("barrier1", { precision: 20, scale: 6 }),
  barrier2: decimal("barrier2", { precision: 20, scale: 6 }),
  strikePrice: decimal("strike_price", { precision: 20, scale: 6 }),
  premium: decimal("premium", { precision: 20, scale: 2 }),
  closeDate: date("close_date"),
  closePrice: decimal("close_price", { precision: 20, scale: 6 }),
  unrealizedPnlLocal: decimal("unrealized_pnl_local", { precision: 20, scale: 2 }),
  unrealizedPnlUsd: decimal("unrealized_pnl_usd", { precision: 20, scale: 2 }),
  realizedPnlLocal: decimal("realized_pnl_local", { precision: 20, scale: 2 }),
  realizedPnlUsd: decimal("realized_pnl_usd", { precision: 20, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  batchId: varchar("batch_id", { length: 100 }),
});

export type ReportExposure = typeof reportExposures.$inferSelect;
export type InsertReportExposure = typeof reportExposures.$inferInsert;

// 交易敞口台账 (Trading Exposure Ledger)
export const tradingExposures = mysqlTable("trading_exposures", {
  id: serial("id").primaryKey(),
  seqNo: int("seq_no"),
  tradeDate: date("trade_date"),
  entity: varchar("entity", { length: 100 }),
  trader: varchar("trader", { length: 100 }),
  counterparty: varchar("counterparty", { length: 100 }),
  expiryStatus: varchar("expiry_status", { length: 50 }),
  closeStatus: varchar("close_status", { length: 50 }),
  priceCurrency: varchar("price_currency", { length: 10 }),
  settleCurrency: varchar("settle_currency", { length: 10 }),
  pricingDate: date("pricing_date"),
  premiumDate: date("premium_date"),
  deliveryDate: date("delivery_date"),
  direction: varchar("direction", { length: 20 }),
  productType: varchar("product_type", { length: 50 }),
  currencyPair: varchar("currency_pair", { length: 20 }),
  subType: varchar("sub_type", { length: 50 }),
  callPut: varchar("call_put", { length: 20 }),
  notionalLocal: decimal("notional_local", { precision: 20, scale: 2 }),
  notionalUsd: decimal("notional_usd", { precision: 20, scale: 2 }),
  barrier1: decimal("barrier1", { precision: 20, scale: 6 }),
  barrier2: decimal("barrier2", { precision: 20, scale: 6 }),
  swapPoints: varchar("swap_points", { length: 50 }),
  strikePrice: decimal("strike_price", { precision: 20, scale: 6 }),
  targetYield: decimal("target_yield", { precision: 20, scale: 6 }),
  frequency: varchar("frequency", { length: 50 }),
  times: decimal("times", { precision: 10, scale: 1 }),
  premium: decimal("premium", { precision: 20, scale: 2 }),
  payRate: decimal("pay_rate", { precision: 20, scale: 6 }),
  receiveRate: decimal("receive_rate", { precision: 20, scale: 6 }),
  closeDate: date("close_date"),
  closePrice: decimal("close_price", { precision: 20, scale: 6 }),
  unrealizedPnlLocal: decimal("unrealized_pnl_local", { precision: 20, scale: 2 }),
  unrealizedPnlCny: decimal("unrealized_pnl_cny", { precision: 20, scale: 2 }),
  realizedPnlLocal: decimal("realized_pnl_local", { precision: 20, scale: 2 }),
  realizedPnlCny: decimal("realized_pnl_cny", { precision: 20, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  batchId: varchar("batch_id", { length: 100 }),
});

export type TradingExposure = typeof tradingExposures.$inferSelect;
export type InsertTradingExposure = typeof tradingExposures.$inferInsert;

// 自营交易台账 (Proprietary Trading Ledger)
export const proprietaryTrades = mysqlTable("proprietary_trades", {
  id: serial("id").primaryKey(),
  seqNo: int("seq_no"),
  tradeDate: date("trade_date"),
  entity: varchar("entity", { length: 100 }),
  trader: varchar("trader", { length: 100 }),
  counterparty: varchar("counterparty", { length: 100 }),
  expiryStatus: varchar("expiry_status", { length: 50 }),
  closeStatus: varchar("close_status", { length: 50 }),
  priceCurrency: varchar("price_currency", { length: 10 }),
  settleCurrency: varchar("settle_currency", { length: 10 }),
  pricingDate: date("pricing_date"),
  premiumDate: date("premium_date"),
  deliveryDate: date("delivery_date"),
  direction: varchar("direction", { length: 20 }),
  productType: varchar("product_type", { length: 50 }),
  currencyPair: varchar("currency_pair", { length: 20 }),
  subType: varchar("sub_type", { length: 50 }),
  callPut: varchar("call_put", { length: 20 }),
  notionalLocal: decimal("notional_local", { precision: 20, scale: 2 }),
  notionalUsd: decimal("notional_usd", { precision: 20, scale: 2 }),
  barrier1: decimal("barrier1", { precision: 20, scale: 6 }),
  barrier2: decimal("barrier2", { precision: 20, scale: 6 }),
  strikePrice: decimal("strike_price", { precision: 20, scale: 6 }),
  premium: decimal("premium", { precision: 20, scale: 2 }),
  closeDate: date("close_date"),
  closePrice: decimal("close_price", { precision: 20, scale: 6 }),
  unrealizedPnlLocal: decimal("unrealized_pnl_local", { precision: 20, scale: 2 }),
  unrealizedPnlUsd: decimal("unrealized_pnl_usd", { precision: 20, scale: 2 }),
  futurePremium: decimal("future_premium", { precision: 20, scale: 2 }),
  totalPnlLocal: decimal("total_pnl_local", { precision: 20, scale: 2 }),
  totalPnlUsd: decimal("total_pnl_usd", { precision: 20, scale: 2 }),
  realizedPnl2025: decimal("realized_pnl_2025", { precision: 20, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  batchId: varchar("batch_id", { length: 100 }),
});

export type ProprietaryTrade = typeof proprietaryTrades.$inferSelect;
export type InsertProprietaryTrade = typeof proprietaryTrades.$inferInsert;
