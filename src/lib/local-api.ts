import * as XLSX from "xlsx";
import { format } from "date-fns";
import {
  getAll,
  addRecords,
  clearAllLedgers,
  type LedgerType,
  type LedgerRecord,
} from "./db";

function toDate(val: unknown): string | null {
  if (!val || val === "NaT" || val === "null" || val === "undefined") return null;
  if (val instanceof Date) {
    if (val.getFullYear() < 1900) return null;
    return val.toISOString();
  }
  if (typeof val === "number") {
    // Excel date serial numbers are typically in range 1-100000 (1900-2200)
    // Financial figures like notionals/prices are usually >1M or <0.001, 
    // or very small integers (1-100). Use range check to avoid misclassifying.
    if (val > 30000 && val < 100000) {
      // Excel epoch is 1899-12-30 (with 1900 leap year bug compatibility)
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const jsDate = new Date(excelEpoch.getTime() + val * 24 * 60 * 60 * 1000);
      if (!isNaN(jsDate.getTime()) && jsDate.getFullYear() >= 1900) return jsDate.toISOString();
    }
    return null;
  }
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime()) || d.getFullYear() < 1900) return null;
  return d.toISOString();
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

  // Import 报表敞口台账
  const sheet1 = workbook.Sheets["报表敞口台账"];
  const sheet2 = workbook.Sheets["交易敞口台账"];
  const sheet3 = workbook.Sheets["自营交易台账"];

  if (!sheet1 && !sheet2 && !sheet3) {
    throw new Error(
      "未找到有效的工作表，请确保文件包含：报表敞口台账、交易敞口台账、自营交易台账"
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
      batchId,
    }));
    await addRecords("report", records);
    reportCount = records.length;
  }

  // Import 交易敞口台账
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
      unrealizedPnlCny: toDecimal(row[32]),
      realizedPnlLocal: toDecimal(row[33]),
      realizedPnlCny: toDecimal(row[34]),
      batchId,
    }));
    await addRecords("trading", records);
    tradingCount = records.length;
  }

  // Import 自营交易台账
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
      totalPnlUsd: toDecimal(row[30]),
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
  // 1. Try totalPnlUsd first (proprietary ledger combined column)
  const totalUsd = Number(item.totalPnlUsd || 0);
  if (totalUsd !== 0) return totalUsd;

  // 2. Report ledger: unrealizedPnlUsd + realizedPnlUsd
  const usdUnrealized = Number(item.unrealizedPnlUsd || 0);
  const usdRealized = Number(item.realizedPnlUsd || 0);
  const usdTotal = usdUnrealized + usdRealized;
  if (usdTotal !== 0) return usdTotal;

  // 3. Trading ledger: CNY fields
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
    let totalPnl = 0;

    if (input.ledger === "report") {
      totalUnrealizedPnl = items.reduce(
        (sum, i) => sum + Number(i.unrealizedPnlUsd || 0),
        0
      );
      totalRealizedPnl = items.reduce(
        (sum, i) => sum + Number(i.realizedPnlUsd || 0),
        0
      );
    } else if (input.ledger === "trading") {
      totalUnrealizedPnl = items.reduce(
        (sum, i) => sum + Number(i.unrealizedPnlCny || 0),
        0
      );
      totalRealizedPnl = items.reduce(
        (sum, i) => sum + Number(i.realizedPnlCny || 0),
        0
      );
    } else {
      totalUnrealizedPnl = items.reduce(
        (sum, i) => sum + Number(i.unrealizedPnlUsd || 0),
        0
      );
      totalPnl = items.reduce(
        (sum, i) => sum + Number(i.totalPnlUsd || 0),
        0
      );
    }

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
