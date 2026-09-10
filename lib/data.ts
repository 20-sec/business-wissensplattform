import { catalogSchema } from "./schema.mjs";
import raw from "@/data/catalog.json";
import type { Video, Topic } from "./types";
export const catalog = catalogSchema.parse(raw) as { schemaVersion: number; videos: Video[]; topics: Topic[]; reviewQueue: { videoId: string; triggerVideoId: string; reason: string; createdAt: string }[] };
