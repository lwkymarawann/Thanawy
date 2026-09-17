import { Redis } from "@upstash/redis";
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

// Only talk to Upstash when it's actually configured. Otherwise fall back
// to a local JSON file so `npm run dev` works out of the box, matching
// what the README already promises.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

function readLocal() {
  try {
    const raw = fs.readFileSync(LOCAL_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DATA;
  }
}

function writeLocal(data) {
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
}

export async function getData() {
  if (redis) {
    const data = await redis.get(KEY);
    return data || DEFAULT_DATA;
  }

  return readLocal();
}

export async function setData(data) {
  if (redis) {
    await redis.set(KEY, data);
    return data;
  }

  writeLocal(data);
  return data;
}
