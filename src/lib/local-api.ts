import * as XLSX from "xlsx";
import { format } from "date-fns";
import {
  getAll,
  addRecords,
  clearAllLedgers,
  saveSnapshot,
  getSnapshot,
  getSnapshotsByLedger,
  getLatestSnapshot,
  type LedgerType,
  type LedgerRecord,
  type Snapshot,
} from "./db";

function toDate(val: unknown): string | null {
  if (!val || val === "NaT" || val === "null" || val === "undefined") return null;
  
  let d: Date | null = null;
  
  if (val instanceof Date) {
    if (val.getFullYear() < 1900) return null;
    d = val;
  } else if (typeof val === "number") {
    if (val > 30000 && val < 100000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      d = new Date(excelEpoch.getTime() + val * 24 * 60 * 60 * 1000);
    }
  } else {
    const s = String(val).trim();
    if (!s) return null;
    d = new Date(s);
  }
  
  if (!d || isNaN(d.getTime()) || d.getFullYear() < 1900) return null;
  
  // Normalize to UTC midnight — strip time so timezone never shifts the date
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
}

function isEmptyRow(row: unknown[]): boolean {
  // Skip if only seqNo exists and everything else is empty
  if (row.length <= 1) return true;
  const hasData = row.slice(1).some((cell) => {
    if (cell === null || cell === undefined || cell === "" || cell === "NaT") return false;
    if (typeof cell === "string" && cell.trim() === "") return false;
    return true;
  });
  return !hasData;
}

function toDecimal(val: unknown): string | null {
  if (val === null || val === undefined || val === "" || val === "NaT") return null;
  const n = Number(val);
  return isNaN(n) ? null : String(n);
}

function toInt(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : Math.floor(n);
}

function toString(val: unknown): string | null {
  if (val === null || val === undefined || val === "NaT") return null;
  return String(val).trim() || null;
}

function generateBatchId(): string {
  return `batch_${format(new Date(), "yyyyMMdd_HHmmss")}`;
}

export async function importExcelFile(file: File): Promise<{
  batchId: string;
  reportCount: number;
  tradingCount: number;
  proprietaryCount: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const batchId = generateBatchId();

  // Clear all existing data first to ensure latest upload overwrites everything
  await clearAllLedgers();

  // Import Hedge-BS (结汇套保)
  const sheet1 = workbook.Sheets["Hedge-BS"];
  const sheet2 = workbook.Sheets["Hedge-Trade"];
  const sheet3 = workbook.Sheets["Trading"];

  if (!sheet1 && !sheet2 && !sheet3) {
    throw new Error(
      "未找到有效的工作表，请确保文件包含：Hedge-BS、Hedge-Trade、Trading"
    );
  }

  let reportCount = 0;
  let tradingCount = 0;
  let proprietaryCount = 0;
  if (sheet1) {
    const data1 = XLSX.utils.sheet_to_json<unknown[]>(sheet1, { header: 1, raw: true, defval: null });
    const rows1 = data1
      .slice(1)
      .filter((row) => row[0] !== undefined && row[0] !== "" && !isEmptyRow(row));
    const records: Omit<LedgerRecord, "id">[] = rows1.map((row) => ({
      seqNo: toInt(row[0]),
      tradeDate: toDate(row[1]),
      entity: toString(row[2]),
      trader: toString(row[3]),
      counterparty: toString(row[4]),
      expiryStatus: toString(row[5]),
      closeStatus: toString(row[6]),
      priceCurrency: toString(row[7]),
      settleCurrency: toString(row[8]),
      pricingDate: toDate(row[9]),
      premiumDate: toDate(row[10]),
      deliveryDate: toDate(row[11]),
      direction: toString(row[12]),
      productType: toString(row[13]),
      currencyPair: toString(row[14]),
      subType: toString(row[15]),
      callPut: toString(row[16]),
      notionalLocal: toDecimal(row[17]),
      barrier1: toDecimal(row[18]),
      barrier2: toDecimal(row[19]),
      strikePrice: toDecimal(row[20]),
      premium: toDecimal(row[21]),
      closeDate: toDate(row[22]),
      closePrice: toDecimal(row[23]),
      unrealizedPnlLocal: toDecimal(row[24]),
      unrealizedPnlUsd: toDecimal(row[25]),
      realizedPnlLocal: toDecimal(row[26]),
      realizedPnlUsd: toDecimal(row[27]),
      totalPnlUsd: toDecimal(row[28]),
      batchId,
    }));
    await addRecords("report", records);
    reportCount = records.length;
  }

  // Import Hedge-Trade (购汇套保)
  if (sheet2) {
    const data2 = XLSX.utils.sheet_to_json<unknown[]>(sheet2, { header: 1, raw: true, defval: null });
    const rows2 = data2
      .slice(1)
      .filter((row) => row[0] !== undefined && row[0] !== "" && !isEmptyRow(row));
    const records: Omit<LedgerRecord, "id">[] = rows2.map((row) => ({
      seqNo: toInt(row[0]),
      tradeDate: toDate(row[1]),
      entity: toString(row[2]),
      trader: toString(row[3]),
      counterparty: toString(row[4]),
      expiryStatus: toString(row[5]),
      closeStatus: toString(row[6]),
      priceCurrency: toString(row[7]),
      settleCurrency: toString(row[8]),
      pricingDate: toDate(row[9]),
      premiumDate: toDate(row[10]),
      deliveryDate: toDate(row[11]),
      direction: toString(row[12]),
      productType: toString(row[13]),
      currencyPair: toString(row[14]),
      subType: toString(row[15]),
      callPut: toString(row[16]),
      notionalLocal: toDecimal(row[17]),
      notionalUsd: toDecimal(row[18]),
      barrier1: toDecimal(row[19]),
      barrier2: toDecimal(row[20]),
      swapPoints: toString(row[21]),
      strikePrice: toDecimal(row[22]),
      targetYield: toDecimal(row[23]),
      frequency: toString(row[24]),
      times: toDecimal(row[25]),
      premium: toDecimal(row[26]),
      payRate: toDecimal(row[27]),
      receiveRate: toDecimal(row[28]),
      closeDate: toDate(row[29]),
      closePrice: toDecimal(row[30]),
      unrealizedPnlLocal: toDecimal(row[31]),
      unrealizedPnlUsd: toDecimal(row[32]),
      realizedPnlLocal: toDecimal(row[33]),
      realizedPnlUsd: toDecimal(row[34]),
      totalPnlUsd: toDecimal(row[35]),
      batchId,
    }));
    await addRecords("trading", records);
    tradingCount = records.length;
  }

  // Import Trading (自营交易)
  if (sheet3) {
    const data3 = XLSX.utils.sheet_to_json<unknown[]>(sheet3, { header: 1, raw: true, defval: null });
    const rows3 = data3
      .slice(1)
      .filter((row) => row[0] !== undefined && row[0] !== "" && !isEmptyRow(row));
    const records: Omit<LedgerRecord, "id">[] = rows3.map((row) => ({
      seqNo: toInt(row[0]),
      tradeDate: toDate(row[1]),
      entity: toString(row[2]),
      trader: toString(row[3]),
      counterparty: toString(row[4]),
      expiryStatus: toString(row[5]),
      closeStatus: toString(row[6]),
      priceCurrency: toString(row[7]),
      settleCurrency: toString(row[8]),
      pricingDate: toDate(row[9]),
      premiumDate: toDate(row[10]),
      deliveryDate: toDate(row[11]),
      direction: toString(row[12]),
      productType: toString(row[13]),
      currencyPair: toString(row[14]),
      subType: toString(row[15]),
      callPut: toString(row[16]),
      notionalLocal: toDecimal(row[17]),
      notionalUsd: toDecimal(row[18]),
      barrier1: toDecimal(row[19]),
      barrier2: toDecimal(row[20]),
      strikePrice: toDecimal(row[21]),
      premium: toDecimal(row[22]),
      closeDate: toDate(row[23]),
      closePrice: toDecimal(row[24]),
      unrealizedPnlLocal: toDecimal(row[25]),
      unrealizedPnlUsd: toDecimal(row[26]),
      futurePremium: toDecimal(row[27]),
      realizedPnlLocal: toDecimal(row[28]),
      realizedPnlUsd: toDecimal(row[29]),
      totalPnlUsd: toDecimal(row[29]),
      batchId,
    }));
    await addRecords("proprietary", records);
    proprietaryCount = records.length;
  }

  return { batchId, reportCount, tradingCount, proprietaryCount };
}

// Helper: get the PnL for a single record
// User requirement: use totalPnlUsd (the combined PnL column) when available.
// For ledgers without totalPnlUsd, fallback to unrealized + realized.
function getRecordPnl(item: LedgerRecord): number {
  // 1. Always use totalPnlUsd (combined column) when available, even if it's 0
  if (item.totalPnlUsd != null && item.totalPnlUsd !== "") {
    return Number(item.totalPnlUsd);
  }

  // 2. Fallback: unrealizedPnlUsd + realizedPnlUsd
  const usdUnrealized = Number(item.unrealizedPnlUsd || 0);
  const usdRealized = Number(item.realizedPnlUsd || 0);
  const usdTotal = usdUnrealized + usdRealized;
  if (usdTotal !== 0) return usdTotal;

  // 3. Legacy fallback: CNY fields
  const cnyUnrealized = Number(item.unrealizedPnlCny || 0);
  const cnyRealized = Number(item.realizedPnlCny || 0);
  const cnyTotal = cnyUnrealized + cnyRealized;
  if (cnyTotal !== 0) return cnyTotal;

  return 0;
}

// Pie chart stats: group by a dimension, sum PnL, top 5 + others
export async function pieStats(input: {
  ledger: LedgerType;
  groupBy: "currencyPair" | "counterparty";
}) {
  const all = await getAll(input.ledger);
  const map = new Map<string, number>();

  for (const item of all) {
    const key = (item as any)[input.groupBy];
    if (!key || String(key).trim() === "") continue; // skip empty values to avoid "未指定"
    const pnl = getRecordPnl(item);
    map.set(key, (map.get(key) || 0) + pnl);
  }

  const entries = Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  // Top 5 + others
  const top5 = entries.slice(0, 5);
  const rest = entries.slice(5);
  if (rest.length > 0) {
    const othersValue = rest.reduce((sum, e) => sum + e.value, 0);
    top5.push({ name: "其他", value: Number(othersValue.toFixed(2)) });
  }

  return top5;
}

// Bar chart stats: group by dimension, sum total PnL (one bar per group)
export async function barStats(input: {
  ledger: LedgerType;
  groupBy: "currencyPair" | "counterparty" | "tradeDate";
}) {
  const all = await getAll(input.ledger);
  const map = new Map<string, number>();

  for (const item of all) {
    const pnl = getRecordPnl(item);
    let key: string;

    if (input.groupBy === "tradeDate") {
      if (item.tradeDate) {
        const d = new Date(item.tradeDate);
        const year = d.getFullYear();
        if (year === 2025) {
          key = "2025年";
        } else {
          key = `${year}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }
      } else {
        continue;
      }
    } else {
      const rawKey = (item as any)[input.groupBy];
      if (!rawKey || String(rawKey).trim() === "") continue;
      key = rawKey;
    }

    map.set(key, (map.get(key) || 0) + pnl);
  }

  const entries = Array.from(map.entries()).map(([key, value]) => ({
    key,
    value: Number(value.toFixed(2)),
  }));

  // Sort by absolute value desc by default; for tradeDate sort chronologically
  if (input.groupBy === "tradeDate") {
    const toSortKey = (key: string) => {
      if (key === "2025年") return "2025-00";
      return key;
    };
    entries.sort((a, b) => toSortKey(a.key).localeCompare(toSortKey(b.key)));
  } else {
    entries.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }

  return entries;
}

export async function ledgerList(input: {
  ledger: LedgerType;
  page: number;
  pageSize: number;
  filters?: Record<string, string>;
}) {
  const all = await getAll(input.ledger);
  let filtered = all;

  if (input.filters && Object.keys(input.filters).length > 0) {
    filtered = all.filter((item) => {
      for (const [key, value] of Object.entries(input.filters!)) {
        if (!value) continue;
        const itemVal = (item as any)[key];
        if (itemVal !== value) return false;
      }
      return true;
    });
  }

  const total = filtered.length;
  const offset = (input.page - 1) * input.pageSize;

  // Sort by tradeDate desc (newest first), then by id desc, then paginate
  const sorted = [...filtered].sort((a, b) => {
    const dateA = a.tradeDate ? new Date(a.tradeDate).getTime() : 0;
    const dateB = b.tradeDate ? new Date(b.tradeDate).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || 0) - (a.id || 0);
  });
  const items = sorted.slice(offset, offset + input.pageSize);

  return { items, total, page: input.page, pageSize: input.pageSize };
}

export async function ledgerStatistics(input: {
  ledger: LedgerType;
  groupBy: string;
}) {
  const all = await getAll(input.ledger);
  const groupMap = new Map<string, LedgerRecord[]>();

  for (const item of all) {
    const key = (item as any)[input.groupBy] || "(未指定)";
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(item);
  }

  const results = Array.from(groupMap.entries()).map(([groupValue, items]) => {
    const count = items.length;
    const totalNotional = items.reduce(
      (sum, i) => sum + Number(i.notionalLocal || 0),
      0
    );
    const avgNotional = count > 0 ? totalNotional / count : 0;

    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    const totalPnl = items.reduce((sum, i) => sum + getRecordPnl(i), 0);

    return {
      groupValue,
      count,
      totalNotional,
      avgNotional,
      totalUnrealizedPnl,
      totalRealizedPnl,
      totalPnl,
    };
  });

  results.sort((a, b) => b.count - a.count);
  return results;
}

export async function ledgerSummary(input: { ledger: LedgerType }) {
  const all = await getAll(input.ledger);

  const openItems = all.filter((i) => i.closeStatus === "Open");
  const closeItems = all.filter((i) => i.closeStatus === "Close");

  const openCount = openItems.length;
  const totalCount = all.length;

  const openNotional = openItems.reduce((sum, i) => sum + Number(i.notionalLocal || 0), 0);
  const totalNotional = all.reduce((sum, i) => sum + Number(i.notionalLocal || 0), 0);

  // All PnL stats use getRecordPnl (totalPnlUsd when available)
  const openPnl = openItems.reduce((sum, i) => sum + getRecordPnl(i), 0);
  const closePnl = closeItems.reduce((sum, i) => sum + getRecordPnl(i), 0);
  const totalPnl = all.reduce((sum, i) => sum + getRecordPnl(i), 0);

  return {
    openCount,
    totalCount,
    openNotional,
    totalNotional,
    // 持仓盈亏 = open positions total PnL
    unrealizedPnl: openPnl,
    // 已确认盈亏 = closed positions total PnL
    realizedPnl: closePnl,
    totalPnl,
  };
}

export async function ledgerFilterOptions(input: { ledger: LedgerType }) {
  const all = await getAll(input.ledger);

  const getDistinct = (field: string) => {
    const values = new Set<string>();
    for (const item of all) {
      const val = (item as any)[field];
      if (val) values.add(val);
    }
    return Array.from(values).sort();
  };

  return {
    entities: getDistinct("entity"),
    traders: getDistinct("trader"),
    counterparties: getDistinct("counterparty"),
    expiryStatuses: getDistinct("expiryStatus"),
    closeStatuses: getDistinct("closeStatus"),
    directions: getDistinct("direction"),
    productTypes: getDistinct("productType"),
    currencyPairs: getDistinct("currencyPair"),
    callPuts: getDistinct("callPut"),
  };
}

// Re-export clearAllLedgers for use by trpc provider
export { clearAllLedgers } from "./db";

// ── Trend / Historical Snapshot ──

export interface TrendPeriod {
  current: number;
  previous: number;
  change: number;
  changePct: number;
}

export interface TrendMetric {
  daily: TrendPeriod;
  weekly: TrendPeriod;
  monthly: TrendPeriod;
  ytd: TrendPeriod;
}

export interface TrendData {
  count: TrendMetric;      // 总交易笔数
  notional: TrendMetric;   // 交易本金 (totalNotional)
  pnl: TrendMetric;        // 总盈亏
}

function makeTrendPeriod(current: number, previous: number): TrendPeriod {
  const change = current - previous;
  const changePct = previous !== 0 ? (change / previous) * 100 : 0;
  return { current, previous, change, changePct };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export async function getTrendData(ledger: LedgerType): Promise<TrendData | null> {
  const snaps = await getSnapshotsByLedger(ledger);
  if (snaps.length === 0) return null;

  const latest = snaps[snaps.length - 1];
  const latestDate = latest.date;
  const yearStart = latestDate.slice(0, 4) + "-01-01";

  // Find reference snapshots
  const prevSnap = snaps.length >= 2 ? snaps[snaps.length - 2] : null;
  const weekAgoDate = addDays(latestDate, -7);
  const weekSnap = findNearestSnapBefore(snaps, weekAgoDate);
  const monthAgoDate = addDays(latestDate, -30);
  const monthSnap = findNearestSnapBefore(snaps, monthAgoDate);
  const ytdSnap = snaps.find(s => s.date >= yearStart) || snaps[0];

  return {
    count: {
      daily: makeTrendPeriod(latest.totalCount, prevSnap?.totalCount ?? 0),
      weekly: makeTrendPeriod(latest.totalCount, weekSnap?.totalCount ?? 0),
      monthly: makeTrendPeriod(latest.totalCount, monthSnap?.totalCount ?? 0),
      ytd: makeTrendPeriod(latest.totalCount, ytdSnap.totalCount),
    },
    notional: {
      daily: makeTrendPeriod(latest.totalNotional, prevSnap?.totalNotional ?? 0),
      weekly: makeTrendPeriod(latest.totalNotional, weekSnap?.totalNotional ?? 0),
      monthly: makeTrendPeriod(latest.totalNotional, monthSnap?.totalNotional ?? 0),
      ytd: makeTrendPeriod(latest.totalNotional, ytdSnap.totalNotional),
    },
    pnl: {
      daily: makeTrendPeriod(latest.totalPnl, prevSnap?.totalPnl ?? 0),
      weekly: makeTrendPeriod(latest.totalPnl, weekSnap?.totalPnl ?? 0),
      monthly: makeTrendPeriod(latest.totalPnl, monthSnap?.totalPnl ?? 0),
      ytd: makeTrendPeriod(latest.totalPnl, ytdSnap.totalPnl),
    },
  };
}

function findNearestSnapBefore(snaps: Snapshot[], targetDate: string): Snapshot | null {
  // Find the latest snap with date <= targetDate
  for (let i = snaps.length - 1; i >= 0; i--) {
    if (snaps[i].date <= targetDate) return snaps[i];
  }
  return null;
}

// Also export getSnapshotsByLedger for admin/debug
export { getSnapshotsByLedger };

// Export getSnapshot for frontend daily-snapshot check
export { getSnapshot } from "./db";

// ── Daily Snapshot ──

export async function saveDailySnapshot(): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  for (const ledger of ["report", "trading", "proprietary"] as LedgerType[]) {
    const summary = await ledgerSummary({ ledger });
    await saveSnapshot({
      ledger,
      date: today,
      totalCount: summary.totalCount,
      openCount: summary.openCount,
      totalNotional: summary.totalNotional,
      openNotional: summary.openNotional,
      realizedPnl: summary.realizedPnl,
      unrealizedPnl: summary.unrealizedPnl,
      totalPnl: summary.totalPnl,
      createdAt: new Date().toISOString(),
    });
  }
}
