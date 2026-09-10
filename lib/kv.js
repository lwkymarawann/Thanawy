import fs from "fs";
import path from "path";

const KEY = "thanaweya-data";
const LOCAL_FILE = path.join(process.cwd(), ".data", "store.json");

export const DEFAULT_DATA = {
  subjects: [],
  schedule: [],
  exams: [],
  events: [],
};

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function readLocal() {
  try {
    const raw = fs.readFileSync(LOCAL_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLocal(data) {
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getData() {
  if (hasKv()) {
    const { kv } = await import("@vercel/kv");
    const data = await kv.get(KEY);
    return data || DEFAULT_DATA;
  }
  return readLocal() || DEFAULT_DATA;
}

export async function setData(data) {
  if (hasKv()) {
    const { kv } = await import("@vercel/kv");
    await kv.set(KEY, data);
    return data;
  }
  writeLocal(data);
  return data;
}
