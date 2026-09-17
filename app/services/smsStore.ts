import fs from "fs";
import path from "path";

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

const FILE_PATH = path.join(process.cwd(), ".sms_history.json");

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

function loadData(): SmsStoreData {
  try {
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading sms history file:", err);
  }
  return { records: [], incoming: [] };
}

function saveData(data: SmsStoreData) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving sms history file:", err);
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

  const matchingIndex = data.records.findIndex(
    (r) => r.normalizedPhone === normalizedSender || r.phoneNumber.replace(/[^0-9]/g, "").endsWith(normalizedSender.slice(-9))
  );

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
    results = results.filter((r) => r.normalizedPhone === norm || r.phoneNumber.includes(filterPhone));
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
  saveData({ records: [], incoming: [] });
}

