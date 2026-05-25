import { getDb } from "../api/queries/connection";
import { reportExposures, tradingExposures, proprietaryTrades } from "./schema";
import { format } from "date-fns";
import * as XLSX from "xlsx";

function toDate(val: unknown): Date | null {
  if (!val || val === "NaT") return null;
  if (val instanceof Date) return val;
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d;
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

export async function importExcelData(filePath: string, batchId?: string) {
  const db = getDb();
  const bid = batchId || generateBatchId();
  const workbook = XLSX.readFile(filePath);

  // Import 报表敞口台账
  const sheet1 = workbook.Sheets["报表敞口台账"];
  if (sheet1) {
    const data1 = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet1, { header: 1 });
    const rows1 = data1.slice(1).filter((row) => (row as unknown as unknown[])[0] !== undefined && (row as unknown as unknown[])[0] !== "");

    for (const row of rows1) {
      await db.insert(reportExposures).values({
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
        batchId: bid,
      });
    }
    console.log(`Imported ${rows1.length} report exposures`);
  }

  // Import 交易敞口台账
  const sheet2 = workbook.Sheets["交易敞口台账"];
  if (sheet2) {
    const data2 = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet2, { header: 1 });
    const rows2 = data2.slice(1).filter((row) => (row as unknown as unknown[])[0] !== undefined && (row as unknown as unknown[])[0] !== "");

    for (const row of rows2) {
      await db.insert(tradingExposures).values({
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
        batchId: bid,
      });
    }
    console.log(`Imported ${rows2.length} trading exposures`);
  }

  // Import 自营交易台账
  const sheet3 = workbook.Sheets["自营交易台账"];
  if (sheet3) {
    const data3 = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet3, { header: 1 });
    const rows3 = data3.slice(1).filter((row) => (row as unknown as unknown[])[0] !== undefined && (row as unknown as unknown[])[0] !== "");

    for (const row of rows3) {
      await db.insert(proprietaryTrades).values({
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
        batchId: bid,
      });
    }
    console.log(`Imported ${rows3.length} proprietary trades`);
  }

  return bid;
}
