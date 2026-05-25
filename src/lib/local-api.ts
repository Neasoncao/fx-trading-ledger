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
  if (!val || val === "NaT") return null;
  if (val instanceof Date) return val.toISOString();
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d.toISOString();
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
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
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
    const data1 = XLSX.utils.sheet_to_json<unknown[]>(sheet1, { header: 1 });
    const rows1 = data1
      .slice(1)
      .filter((row) => row[0] !== undefined && row[0] !== "");
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
    const data2 = XLSX.utils.sheet_to_json<unknown[]>(sheet2, { header: 1 });
    const rows2 = data2
      .slice(1)
      .filter((row) => row[0] !== undefined && row[0] !== "");
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
    const data3 = XLSX.utils.sheet_to_json<unknown[]>(sheet3, { header: 1 });
    const rows3 = data3
      .slice(1)
      .filter((row) => row[0] !== undefined && row[0] !== "");
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
      totalPnlLocal: toDecimal(row[28]),
      totalPnlUsd: toDecimal(row[29]),
      realizedPnl2025: toDecimal(row[30]),
      batchId,
    }));
    await addRecords("proprietary", records);
    proprietaryCount = records.length;
  }

  return { batchId, reportCount, tradingCount, proprietaryCount };
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

  // Sort by id desc, then paginate
  const sorted = [...filtered].sort((a, b) => (b.id || 0) - (a.id || 0));
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
  const totalCount = all.length;
  const totalNotional = all.reduce(
    (sum, i) => sum + Number(i.notionalLocal || 0),
    0
  );
  const avgNotional = totalCount > 0 ? totalNotional / totalCount : 0;
  const maxNotional = all.reduce(
    (max, i) => Math.max(max, Number(i.notionalLocal || 0)),
    0
  );

  let totalUnrealizedPnl = 0;
  let totalRealizedPnl = 0;
  let totalPremium = 0;

  if (input.ledger === "report") {
    totalUnrealizedPnl = all.reduce(
      (sum, i) => sum + Number(i.unrealizedPnlUsd || 0),
      0
    );
    totalRealizedPnl = all.reduce(
      (sum, i) => sum + Number(i.realizedPnlUsd || 0),
      0
    );
  } else if (input.ledger === "trading") {
    totalUnrealizedPnl = all.reduce(
      (sum, i) => sum + Number(i.unrealizedPnlCny || 0),
      0
    );
    totalRealizedPnl = all.reduce(
      (sum, i) => sum + Number(i.realizedPnlCny || 0),
      0
    );
  } else {
    totalUnrealizedPnl = all.reduce(
      (sum, i) => sum + Number(i.unrealizedPnlUsd || 0),
      0
    );
    totalRealizedPnl = all.reduce(
      (sum, i) => sum + Number(i.totalPnlUsd || 0),
      0
    );
  }

  totalPremium = all.reduce((sum, i) => sum + Number(i.premium || 0), 0);

  return {
    totalCount,
    totalNotional,
    avgNotional,
    maxNotional,
    totalUnrealizedPnl,
    totalRealizedPnl,
    totalPremium,
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
