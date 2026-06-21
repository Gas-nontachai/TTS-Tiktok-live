import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { AppConfig } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, "../data/config.json");

export const defaultConfig: AppConfig = {
  tiktok: {
    username: ""
  },
  tts: {
    enabled: false,
    lang: "th-TH",
    voiceName: "",
    rate: 1,
    pitch: 1,
    volume: 1,
    template: "{nickname} พูดว่า {comment}"
  },
  queue: {
    enabled: true,
    maxQueueSize: 20
  }
};

export const configSchema = z.object({
  tiktok: z.object({
    username: z.string().trim().default("")
  }).default(defaultConfig.tiktok),
  tts: z.object({
    enabled: z.boolean().default(defaultConfig.tts.enabled),
    lang: z.string().min(1).default(defaultConfig.tts.lang),
    voiceName: z.string().default(defaultConfig.tts.voiceName),
    rate: z.number().min(0.1).max(10).default(defaultConfig.tts.rate),
    pitch: z.number().min(0).max(2).default(defaultConfig.tts.pitch),
    volume: z.number().min(0).max(1).default(defaultConfig.tts.volume),
    template: z.string().min(1).default(defaultConfig.tts.template)
  }).default(defaultConfig.tts),
  queue: z.object({
    enabled: z.boolean().default(defaultConfig.queue.enabled),
    maxQueueSize: z.number().int().min(1).max(200).default(defaultConfig.queue.maxQueueSize)
  }).default(defaultConfig.queue)
});

export const updateConfigSchema = configSchema.deepPartial();

async function ensureDataDir() {
  await mkdir(path.dirname(configPath), { recursive: true });
}

export async function readConfig(): Promise<AppConfig> {
  await ensureDataDir();

  try {
    const rawConfig = await readFile(configPath, "utf8");
    const parsed = configSchema.parse(JSON.parse(rawConfig));
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await writeConfig(defaultConfig);
      return defaultConfig;
    }

    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      await writeConfig(defaultConfig);
      return defaultConfig;
    }

    throw error;
  }
}

export async function writeConfig(config: AppConfig): Promise<AppConfig> {
  await ensureDataDir();
  const parsed = configSchema.parse(config);
  await writeFile(configPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return parsed;
}

export async function updateConfig(partial: z.infer<typeof updateConfigSchema>): Promise<AppConfig> {
  const current = await readConfig();
  const next = configSchema.parse({
    ...current,
    ...partial,
    tiktok: {
      ...current.tiktok,
      ...partial.tiktok
    },
    tts: {
      ...current.tts,
      ...partial.tts
    },
    queue: {
      ...current.queue,
      ...partial.queue
    }
  });

  return writeConfig(next);
}
