import fs from "fs";
import path from "path";
import os from "os";

export interface SmsRecord {
  id: string;
  phoneNumber: string;
  normalizedPhone: string;
  placa?: string;
  model?: string;
  message: string;
  status: "sent" | "failed" | "delivered" | "answered";
  sentAt: string;
  gatewayResponse?: any;
  error?: string;
  response?: {
    message: string;
    receivedAt: string;
    sender: string;
  };
}

export interface WebhookLog {
  id: string;
  sender: string;
  normalizedSender: string;
  recipient?: string;
  message: string;
  receivedAt: string;
  matchedRecordId?: string;
}

interface SmsStoreData {
  records: SmsRecord[];
  incoming: WebhookLog[];
}

declare global {
  // eslint-disable-next-line no-var
  var __velsat_sms_store: SmsStoreData | undefined;
}

function getMemoryStore(): SmsStoreData {
  if (!globalThis.__velsat_sms_store) {
    globalThis.__velsat_sms_store = { records: [], incoming: [] };
  }
  return globalThis.__velsat_sms_store;
}

function getStorageFilePath(): string {
  // Use os.tmpdir() on Vercel or production serverless environments where process.cwd() is read-only
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NODE_ENV === "production"
  );
  if (isServerless) {
    return path.join(os.tmpdir(), "velsat_sms_history.json");
  }
  return path.join(process.cwd(), ".sms_history.json");
}

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length === 9) {
    return `+51${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("51")) {
    return `+${cleaned}`;
  }
  if (phone.startsWith("+")) {
    return `+${cleaned}`;
  }
  return cleaned ? `+${cleaned}` : "";
}

const RETENTION_MS = 12 * 60 * 60 * 1000; // 12 horas

function pruneExpired(data: SmsStoreData): SmsStoreData {
  const cutoff = Date.now() - RETENTION_MS;
  return {
    records: (data.records || []).filter((r) => {
      if (!r?.sentAt) return false;
      const t = new Date(r.sentAt).getTime();
      return !isNaN(t) && t >= cutoff;
    }),
    incoming: (data.incoming || []).filter((inc) => {
      if (!inc?.receivedAt) return false;
      const t = new Date(inc.receivedAt).getTime();
      return !isNaN(t) && t >= cutoff;
    }),
  };
}

function loadData(): SmsStoreData {
  const mem = getMemoryStore();
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed: SmsStoreData = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.records)) {
        // Merge file records with memory records, deduplicating by ID
        const recordMap = new Map<string, SmsRecord>();
        [...parsed.records, ...mem.records].forEach((r) => {
          if (r?.id) recordMap.set(r.id, r);
        });
        const incomingMap = new Map<string, WebhookLog>();
        [...(parsed.incoming || []), ...(mem.incoming || [])].forEach((inc) => {
          if (inc?.id) incomingMap.set(inc.id, inc);
        });
        const merged: SmsStoreData = pruneExpired({
          records: Array.from(recordMap.values()),
          incoming: Array.from(incomingMap.values()),
        });
        globalThis.__velsat_sms_store = merged;
        return merged;
      }
    }
  } catch (err) {
    console.warn("[smsStore] Warning reading history file:", err);
  }
  const prunedMem = pruneExpired(mem);
  globalThis.__velsat_sms_store = prunedMem;
  return prunedMem;
}

function saveData(data: SmsStoreData) {
  const pruned = pruneExpired(data);
  globalThis.__velsat_sms_store = pruned;
  try {
    const filePath = getStorageFilePath();
    fs.writeFileSync(filePath, JSON.stringify(pruned, null, 2), "utf-8");
  } catch (err) {
    console.warn("[smsStore] Could not persist to disk, keeping in memory:", err);
  }
}

export function addSentSms(record: Omit<SmsRecord, "id" | "sentAt" | "normalizedPhone"> & { id?: string; sentAt?: string }): SmsRecord {
  const data = loadData();
  const newRecord: SmsRecord = {
    ...record,
    id: record.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sms_${Date.now()}`),
    normalizedPhone: normalizePhoneNumber(record.phoneNumber),
    sentAt: record.sentAt || new Date().toISOString(),
  };

  data.records.unshift(newRecord);
  if (data.records.length > 150) {
    data.records = data.records.slice(0, 150);
  }
  saveData(data);
  return newRecord;
}

export function recordIncomingResponse(payload: { sender: string; message: string; receivedAt?: string; recipient?: string }) {
  const data = loadData();
  const normalizedSender = normalizePhoneNumber(payload.sender);
  const receivedAt = payload.receivedAt || new Date().toISOString();
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `inc_${Date.now()}`;
  const senderDigits = (payload.sender || "").replace(/[^0-9]/g, "");

  // 1. Prefer matching a command that is still waiting for an answer ('sent' or 'delivered')
  let matchingIndex = data.records.findIndex((r) => {
    if (r.status !== "sent" && r.status !== "delivered") return false;
    const recordDigits = (r.phoneNumber || "").replace(/[^0-9]/g, "");
    return (
      r.normalizedPhone === normalizedSender ||
      (senderDigits.length >= 9 && recordDigits.length >= 9 && recordDigits.slice(-9) === senderDigits.slice(-9))
    );
  });

  // 2. If all are already answered or failed, match the most recent record from this phone
  if (matchingIndex === -1) {
    matchingIndex = data.records.findIndex((r) => {
      const recordDigits = (r.phoneNumber || "").replace(/[^0-9]/g, "");
      return (
        r.normalizedPhone === normalizedSender ||
        (senderDigits.length >= 9 && recordDigits.length >= 9 && recordDigits.slice(-9) === senderDigits.slice(-9))
      );
    });
  }

  let matchedRecordId: string | undefined = undefined;
  if (matchingIndex !== -1) {
    matchedRecordId = data.records[matchingIndex].id;
    data.records[matchingIndex].status = "answered";
    data.records[matchingIndex].response = {
      message: payload.message,
      receivedAt,
      sender: payload.sender,
    };
  }

  const incomingLog: WebhookLog = {
    id,
    sender: payload.sender,
    normalizedSender,
    recipient: payload.recipient,
    message: payload.message,
    receivedAt,
    matchedRecordId,
  };

  data.incoming.unshift(incomingLog);
  if (data.incoming.length > 150) {
    data.incoming = data.incoming.slice(0, 150);
  }

  saveData(data);
  return { matchedRecord: matchingIndex !== -1 ? data.records[matchingIndex] : null, incomingLog };
}

export function getSmsHistory(filterPhone?: string, filterPlaca?: string) {
  const data = loadData();
  let results = data.records;
  if (filterPhone) {
    const norm = normalizePhoneNumber(filterPhone);
    const filterDigits = filterPhone.replace(/[^0-9]/g, "");
    results = results.filter((r) => {
      const recordDigits = (r.phoneNumber || "").replace(/[^0-9]/g, "");
      return (
        r.normalizedPhone === norm ||
        r.phoneNumber.includes(filterPhone) ||
        (filterDigits.length >= 9 && recordDigits.endsWith(filterDigits.slice(-9)))
      );
    });
  }
  if (filterPlaca) {
    results = results.filter((r) => r.placa?.toLowerCase().includes(filterPlaca.toLowerCase()));
  }
  return {
    records: results,
    incoming: data.incoming,
  };
}

export function clearSmsHistory() {
  const empty: SmsStoreData = { records: [], incoming: [] };
  globalThis.__velsat_sms_store = empty;
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn("[smsStore] Warning unlinking history file:", err);
  }
  saveData(empty);
}

