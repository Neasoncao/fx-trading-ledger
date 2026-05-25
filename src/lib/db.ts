const DB_NAME = "fx-ledger-db";
const DB_VERSION = 2;

export type LedgerType = "report" | "trading" | "proprietary";

export interface LedgerRecord {
  id?: number;
  seqNo?: number | null;
  tradeDate?: string | null;
  entity?: string | null;
  trader?: string | null;
  counterparty?: string | null;
  expiryStatus?: string | null;
  closeStatus?: string | null;
  priceCurrency?: string | null;
  settleCurrency?: string | null;
  pricingDate?: string | null;
  premiumDate?: string | null;
  deliveryDate?: string | null;
  direction?: string | null;
  productType?: string | null;
  currencyPair?: string | null;
  subType?: string | null;
  callPut?: string | null;
  notionalLocal?: string | null;
  notionalUsd?: string | null;
  barrier1?: string | null;
  barrier2?: string | null;
  swapPoints?: string | null;
  strikePrice?: string | null;
  targetYield?: string | null;
  frequency?: string | null;
  times?: string | null;
  premium?: string | null;
  payRate?: string | null;
  receiveRate?: string | null;
  closeDate?: string | null;
  closePrice?: string | null;
  unrealizedPnlLocal?: string | null;
  unrealizedPnlUsd?: string | null;
  unrealizedPnlCny?: string | null;
  realizedPnlLocal?: string | null;
  realizedPnlUsd?: string | null;
  realizedPnlCny?: string | null;
  futurePremium?: string | null;
  totalPnlLocal?: string | null;
  totalPnlUsd?: string | null;
  realizedPnl2025?: string | null;
  batchId: string;
  createdAt?: string;
}

export interface Snapshot {
  ledger: LedgerType;
  date: string; // YYYY-MM-DD
  totalCount: number;
  openCount: number;
  totalNotional: number;
  openNotional: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("report"))
        db.createObjectStore("report", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("trading"))
        db.createObjectStore("trading", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("proprietary"))
        db.createObjectStore("proprietary", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("snapshots")) {
        const snapStore = db.createObjectStore("snapshots", { keyPath: "id", autoIncrement: true });
        snapStore.createIndex("ledger_date", ["ledger", "date"], { unique: true });
        snapStore.createIndex("ledger", "ledger", { unique: false });
      }
    };
  });
}

export async function getAll(ledger: LedgerType): Promise<LedgerRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ledger, "readonly");
    const store = tx.objectStore(ledger);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addRecords(
  ledger: LedgerType,
  records: Omit<LedgerRecord, "id">[]
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ledger, "readwrite");
    const store = tx.objectStore(ledger);
    for (const record of records) {
      store.add(record);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
  });
}

export async function clearLedger(ledger: LedgerType): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ledger, "readwrite");
    const store = tx.objectStore(ledger);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllLedgers(): Promise<void> {
  await Promise.all([clearLedger("report"), clearLedger("trading"), clearLedger("proprietary")]);
}

// ── Snapshot CRUD ──

export async function saveSnapshot(snap: Snapshot): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("snapshots", "readwrite");
    const store = tx.objectStore("snapshots");
    const idx = store.index("ledger_date");
    const getReq = idx.get([snap.ledger, snap.date]);
    getReq.onsuccess = () => {
      if (getReq.result) {
        // update existing
        const updated = { ...getReq.result, ...snap };
        store.put(updated);
      } else {
        store.add(snap);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Snapshot save failed"));
  });
}

export async function getSnapshot(ledger: LedgerType, date: string): Promise<Snapshot | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("snapshots", "readonly");
    const idx = tx.objectStore("snapshots").index("ledger_date");
    const req = idx.get([ledger, date]);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getSnapshotsByLedger(ledger: LedgerType): Promise<Snapshot[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("snapshots", "readonly");
    const idx = tx.objectStore("snapshots").index("ledger");
    const req = idx.getAll(ledger);
    req.onsuccess = () => {
      const list: Snapshot[] = req.result || [];
      list.sort((a, b) => a.date.localeCompare(b.date));
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getLatestSnapshot(ledger: LedgerType): Promise<Snapshot | null> {
  const all = await getSnapshotsByLedger(ledger);
  return all.length > 0 ? all[all.length - 1] : null;
}

export async function deleteSnapshotBefore(ledger: LedgerType, beforeDate: string): Promise<void> {
  const all = await getSnapshotsByLedger(ledger);
  const toDelete = all.filter(s => s.date < beforeDate);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("snapshots", "readwrite");
    const store = tx.objectStore("snapshots");
    for (const s of toDelete) {
      if (s.id) store.delete(s.id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Snapshot delete failed"));
  });
}

export async function clearAllSnapshots(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("snapshots", "readwrite");
    const store = tx.objectStore("snapshots");
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Snapshot clear failed"));
  });
}
