import type { PublicStore } from "@/components/menu/types";
import type { Store } from "./types";

export function toPublicStore(s: Store): PublicStore {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sound_enabled, is_active, created_at, updated_at, ...pub } = s;
  return pub;
}
