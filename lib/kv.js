import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const KEY = "thanaweya-data";

export const DEFAULT_DATA = {
  subjects: [],
  schedule: [],
  exams: [],
  events: [],
};

export async function getData() {
  const data = await redis.get(KEY);

  return data || DEFAULT_DATA;
}

export async function setData(data) {
  await redis.set(KEY, data);

  return data;
}
